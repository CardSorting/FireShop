import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import type { User } from '@domain/models';
import { logger } from '@utils/logger';

const COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-session' : '__session';
const SESSION_VERSION = 1;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
const MAX_SESSION_COOKIE_BYTES = 4096;
const MAX_SESSION_CLOCK_SKEW_MS = 60 * 1000;

type SessionPayload = {
    sid: string;
    version: typeof SESSION_VERSION;
    issuedAt: number;
    expiresAt: number;
    lastVerified: number;
    user: Omit<User, 'createdAt'> & { createdAt: string };
};

function sessionCookieOptions(maxAge: number): Partial<ResponseCookie> {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge,
    };
}

function getSessionSecrets(): string[] {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('SESSION_SECRET must be configured in production.');
        }
        return ['development-only-session-secret-change-before-production'];
    }
    // Support multiple secrets for rotation via comma-separated list
    const secrets = secret.split(',').map(s => s.trim()).filter(s => s.length >= 32);
    if (secrets.length === 0) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('All SESSION_SECRET entries must be at least 32 characters in production.');
        }
        return ['development-only-session-secret-change-before-production'];
    }
    return secrets;
}

function signPayload(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('base64url');
}

function isValidSessionPayload(value: unknown): value is SessionPayload {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<SessionPayload>;
    const user = candidate.user as Partial<SessionPayload['user']> | undefined;
    return typeof candidate.sid === 'string'
        && candidate.version === SESSION_VERSION
        && typeof candidate.issuedAt === 'number'
        && typeof candidate.expiresAt === 'number'
        && typeof candidate.lastVerified === 'number'
        && Number.isFinite(candidate.issuedAt)
        && Number.isFinite(candidate.expiresAt)
        && Number.isFinite(candidate.lastVerified)
        && candidate.issuedAt > 0
        && candidate.expiresAt > candidate.issuedAt
        && candidate.issuedAt <= Date.now() + MAX_SESSION_CLOCK_SKEW_MS
        && Date.now() < candidate.expiresAt
        && !!user
        && typeof user.id === 'string'
        && typeof user.email === 'string'
        && typeof user.displayName === 'string'
        && (user.role === 'customer' || user.role === 'admin')
        && typeof user.createdAt === 'string';
}

function encodeSession(user: User): string {
    const issuedAt = Date.now();
    const payload = Buffer.from(JSON.stringify({
        sid: randomUUID(),
        version: SESSION_VERSION,
        issuedAt,
        expiresAt: issuedAt + SESSION_TTL_SECONDS * 1000,
        lastVerified: issuedAt,
        user: { ...user, createdAt: user.createdAt.toISOString() },
    } satisfies SessionPayload)).toString('base64url');
    
    // Always sign with the primary (first) secret
    const primarySecret = getSessionSecrets()[0];
    const encoded = `${payload}.${signPayload(payload, primarySecret)}`;
    
    if (Buffer.byteLength(encoded, 'utf8') > MAX_SESSION_COOKIE_BYTES) {
        throw new Error('Encoded session cookie exceeds safe browser limits.');
    }
    return encoded;
}

async function decodeSession(value: string): Promise<User | null> {
    const [payload, signature] = value.split('.');
    if (!payload || !signature) {
        logger.warn('Session cookie format invalid (missing payload or signature)');
        return null;
    }
    const secrets = getSessionSecrets();
    let signatureMatched = false;
    
    // Try all available secrets (for rotation)
    for (const secret of secrets) {
        const expected = signPayload(payload, secret);
        const signatureBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expected);
        
        if (signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer)) {
            signatureMatched = true;
            break;
        }
    }
    
    if (!signatureMatched) {
        logger.warn('Session signature mismatch with all available secrets');
        return null;
    }

    try {
        const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as unknown;
        if (!isValidSessionPayload(parsed)) {
            logger.warn('Session payload invalid or expired', { 
                hasPayload: !!parsed,
                version: (parsed as any)?.version,
                isExpired: (parsed as any)?.expiresAt < Date.now()
            });
            return null;
        }
        if (Date.now() - parsed.issuedAt > SESSION_TTL_SECONDS * 1000) {
            logger.warn('Session issued too long ago');
            return null;
        }

        // Production Hardening: Re-verify user role from database if verification is stale (> 1 hour)
        // This prevents privilege persistence for demoted admins.
        const VERIFICATION_TTL_MS = 60 * 60 * 1000;
        if (Date.now() - parsed.lastVerified > VERIFICATION_TTL_MS) {
            const { adminDb } = await import('@infrastructure/firebase/admin');
            const userSnap = await adminDb.collection('users').doc(parsed.user.id).get();
            if (!userSnap.exists) {
                logger.warn('Session user no longer exists in database');
                return null;
            }
            const data = userSnap.data()!;
            if (data.role !== parsed.user.role) {
                logger.info('User role changed in database, updating session', { 
                    userId: parsed.user.id, 
                    oldRole: parsed.user.role, 
                    newRole: data.role 
                });
                // Update the user object in the session
                parsed.user.role = data.role;
            }
            parsed.lastVerified = Date.now();
            // Note: We'd ideally re-sign the cookie here, but setSessionUser is async 
            // and usually called from setSessionUser. We'll return the updated user 
            // and the caller can decide whether to refresh the cookie.
        }

        return { ...parsed.user, createdAt: new Date(parsed.user.createdAt) };
    } catch (e) {
        logger.error('Failed to decode session payload', e);
        return null;
    }
}

export async function getSessionUser(): Promise<User | null> {
    const value = (await cookies()).get(COOKIE_NAME)?.value;
    if (!value) return null;
    try {
        return decodeSession(value);
    } catch {
        return null;
    }
}

export async function setSessionUser(user: User) {
    const value = encodeSession(user);
    (await cookies()).set(COOKIE_NAME, value, sessionCookieOptions(SESSION_TTL_SECONDS));
}

export async function clearSessionUser() {
    (await cookies()).set(COOKIE_NAME, '', sessionCookieOptions(0));
}
