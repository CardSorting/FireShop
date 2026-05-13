import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual, randomUUID, randomBytes, createHash, createCipheriv, createDecipheriv } from 'node:crypto';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import type { User } from '@domain/models';
import { logger } from '@utils/logger';

const COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-session' : '__session';
const SESSION_VERSION = 2; // V2: Encrypted + Signed
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
const MAX_SESSION_COOKIE_BYTES = 4096;
const MAX_SESSION_CLOCK_SKEW_MS = 60 * 1000;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

type SessionPayload = {
    sid: string;
    version: typeof SESSION_VERSION;
    issuedAt: number;
    expiresAt: number;
    lastVerified: number;
    user: User;
    fp: string; // [HARDENING] Client Fingerprint (UA + Subnet Hash)
};

type RawSessionPayload = Omit<SessionPayload, 'user'> & {
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

/**
 * [HARDENING] AES-256-GCM Authenticated Encryption
 */
function encrypt(text: string, secret: string): string {
    const iv = randomBytes(IV_LENGTH);
    const key = createHash('sha256').update(secret).digest();
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    
    return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function decrypt(cipherText: string, secret: string): string | null {
    try {
        const buffer = Buffer.from(cipherText, 'base64url');
        const iv = buffer.subarray(0, IV_LENGTH);
        const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
        const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);
        
        const key = createHash('sha256').update(secret).digest();
        const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        
        return decipher.update(encrypted) + decipher.final('utf8');
    } catch (err) {
        return null;
    }
}

function isValidSessionPayload(value: unknown, expectedFp?: string): value is RawSessionPayload {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<SessionPayload>;
    const user = candidate.user as Partial<SessionPayload['user']> | undefined;
    
    // Fingerprint verification (Zero-Trust)
    if (expectedFp && candidate.fp && !timingSafeEqual(Buffer.from(candidate.fp), Buffer.from(expectedFp))) {
        return false;
    }

    return typeof candidate.sid === 'string'
        && candidate.version === SESSION_VERSION
        && typeof candidate.issuedAt === 'number'
        && typeof candidate.expiresAt === 'number'
        && typeof candidate.lastVerified === 'number'
        && typeof candidate.fp === 'string'
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

function encodeSession(user: User, fingerprint: string): string {
    const issuedAt = Date.now();
    const rawPayload = JSON.stringify({
        sid: randomUUID(),
        version: SESSION_VERSION,
        issuedAt,
        expiresAt: issuedAt + SESSION_TTL_SECONDS * 1000,
        lastVerified: issuedAt,
        fp: fingerprint,
        user: { ...user, createdAt: user.createdAt.toISOString() },
    } satisfies RawSessionPayload);
    
    const secrets = getSessionSecrets();
    const primarySecret = secrets[0];
    
    // 1. Encrypt the payload (Privacy)
    const encrypted = encrypt(rawPayload, primarySecret);
    
    // 2. Sign the encrypted payload (Integrity)
    const signature = signPayload(encrypted, primarySecret);
    
    const encoded = `${encrypted}.${signature}`;
    
    if (Buffer.byteLength(encoded, 'utf8') > MAX_SESSION_COOKIE_BYTES) {
        logger.error('Session overflow', { userId: user.id });
        throw new Error('Encoded session cookie exceeds safe browser limits.');
    }

    logger.info('Session created', { userId: user.id, sid: JSON.parse(rawPayload).sid });
    return encoded;
}

async function decodeSession(value: string, expectedFp?: string): Promise<SessionPayload | null> {
    const [cipherText, signature] = value.split('.');
    if (!cipherText || !signature) {
        logger.warn('Forensic: Invalid session format');
        return null;
    }

    const secrets = getSessionSecrets();
    let decryptedPayload: string | null = null;
    
    // Try secrets in order (rotation support)
    for (const secret of secrets) {
        const expectedSignature = signPayload(cipherText, secret);
        const signatureBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);
        
        if (signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer)) {
            decryptedPayload = decrypt(cipherText, secret);
            if (decryptedPayload) break;
        }
    }
    
    if (!decryptedPayload) {
        logger.warn('Forensic: Session signature/decryption failure');
        return null;
    }

    try {
        const parsed = JSON.parse(decryptedPayload) as any;
        if (!isValidSessionPayload(parsed, expectedFp)) {
            const user = parsed?.user;
            const reasons = [
                !parsed?.sid && 'missing sid',
                parsed?.version !== SESSION_VERSION && `version mismatch (expected ${SESSION_VERSION}, got ${parsed?.version})`,
                typeof parsed?.issuedAt !== 'number' && 'issuedAt not number',
                typeof parsed?.expiresAt !== 'number' && 'expiresAt not number',
                typeof parsed?.lastVerified !== 'number' && 'lastVerified not number',
                !parsed?.fp && 'missing fingerprint',
                expectedFp && parsed?.fp !== expectedFp && 'fingerprint mismatch (Session Hijacking Attempt)',
                parsed?.expiresAt <= Date.now() && 'expired',
                !user && 'missing user',
                user && typeof user.id !== 'string' && 'user.id not string',
                user && typeof user.email !== 'string' && 'user.email not string',
                user && typeof user.displayName !== 'string' && 'user.displayName not string',
                user && (user.role !== 'customer' && user.role !== 'admin') && 'invalid role',
                user && typeof user.createdAt !== 'string' && 'user.createdAt not string'
            ].filter(Boolean);

            logger.warn('Session payload invalid or expired', { 
                hasPayload: !!parsed,
                version: parsed?.version,
                isExpired: parsed?.expiresAt < Date.now(),
                reasons
            });
            return null;
        }
        if (Date.now() - parsed.issuedAt > SESSION_TTL_SECONDS * 1000) {
            logger.warn('Session issued too long ago');
            return null;
        }

        // Production Hardening: Re-verify user role from database frequently (Zero-Trust)
        // We use 5 minutes to balance security (fast revocation) with Firestore cost/latency.
        const VERIFICATION_TTL_MS = 5 * 60 * 1000;
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
            
            // Fix: Actually refresh the session cookie in the browser 
            // so we don't hit the DB again on the very next request.
            if (expectedFp) {
                await setSessionUser({ ...parsed.user, createdAt: new Date(parsed.user.createdAt) }, expectedFp);
            }
        }

        const transformed: SessionPayload = {
            ...parsed,
            user: { ...parsed.user, createdAt: new Date(parsed.user.createdAt) }
        };
        return transformed;
    } catch (e) {
        logger.error('Failed to decode session payload', e);
        return null;
    }
}

// [HARDENING] Updated to accept fingerprint for validation
export async function getSessionPayload(expectedFp?: string): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (!sessionCookie) return null;
    return decodeSession(sessionCookie.value, expectedFp);
}

export async function getSessionUser(expectedFp?: string): Promise<User | null> {
    const value = (await cookies()).get(COOKIE_NAME)?.value;
    if (!value) return null;
    try {
        const payload = await decodeSession(value, expectedFp);
        return payload ? payload.user : null;
    } catch {
        return null;
    }
}

export async function setSessionUser(user: User, fingerprint: string) {
    const value = encodeSession(user, fingerprint);
    (await cookies()).set(COOKIE_NAME, value, sessionCookieOptions(SESSION_TTL_SECONDS));
}

export async function clearSessionUser() {
    (await cookies()).set(COOKIE_NAME, '', sessionCookieOptions(0));
}
