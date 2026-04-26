import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { User } from '@domain/models';

const COOKIE_NAME = 'pm_tcg_session';
const SESSION_VERSION = 1;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

type SessionPayload = {
    version: typeof SESSION_VERSION;
    issuedAt: number;
    expiresAt: number;
    user: Omit<User, 'createdAt'> & { createdAt: string };
};

function getSessionSecret(): string {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('SESSION_SECRET must be configured to at least 32 characters in production.');
        }
        return 'development-only-session-secret-change-before-production';
    }
    return secret;
}

function signPayload(payload: string): string {
    return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

function isValidSessionPayload(value: unknown): value is SessionPayload {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<SessionPayload>;
    const user = candidate.user as Partial<SessionPayload['user']> | undefined;
    return candidate.version === SESSION_VERSION
        && typeof candidate.issuedAt === 'number'
        && typeof candidate.expiresAt === 'number'
        && Number.isFinite(candidate.issuedAt)
        && Number.isFinite(candidate.expiresAt)
        && candidate.issuedAt > 0
        && candidate.expiresAt > candidate.issuedAt
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
        version: SESSION_VERSION,
        issuedAt,
        expiresAt: issuedAt + SESSION_TTL_SECONDS * 1000,
        user: { ...user, createdAt: user.createdAt.toISOString() },
    } satisfies SessionPayload)).toString('base64url');
    return `${payload}.${signPayload(payload)}`;
}

function decodeSession(value: string): User | null {
    const [payload, signature] = value.split('.');
    if (!payload || !signature) return null;
    const expected = signPayload(payload);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return null;
    }

    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as unknown;
    if (!isValidSessionPayload(parsed)) return null;
    return { ...parsed.user, createdAt: new Date(parsed.user.createdAt) };
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
    (await cookies()).set(COOKIE_NAME, value, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: SESSION_TTL_SECONDS,
    });
}

export async function clearSessionUser() {
    (await cookies()).set(COOKIE_NAME, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
    });
}
