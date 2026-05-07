import { NextResponse } from 'next/server';
import { DomainError } from '@domain/errors';
import { adminAuth, adminDb, FieldValue } from '@infrastructure/firebase/admin';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, readJsonObject, requireAdminSession, requireString } from '@infrastructure/server/apiGuards';
import type { User, UserRole } from '@domain/models';
export const dynamic = 'force-dynamic';

const USER_ROLES = new Set<UserRole>(['customer', 'admin']);

export async function GET(request: Request) {
    try {
        await requireAdminSession(request);
        const services = await getServerServices();
        const users = await services.authService.getAllUsers();
        return Response.json(users);
    } catch (error) {
        return jsonError(error, 'Failed to fetch users');
    }
}

export async function POST(request: Request) {
    try {
        await requireAdminSession(request);
        const body = await readJsonObject(request);
        const email = requireString(body.email, 'email').trim().toLowerCase();
        const displayName = requireString(body.displayName, 'displayName').trim();
        const role = typeof body.role === 'string' && USER_ROLES.has(body.role as UserRole)
            ? body.role as UserRole
            : 'customer';

        if (!displayName) throw new DomainError('Display name is required.');

        const record = await adminAuth.createUser({
            email,
            displayName,
            emailVerified: false,
            disabled: false,
        });

        const user: User = {
            id: record.uid,
            email,
            displayName,
            role,
            createdAt: new Date(),
        };

        await adminDb.collection('users').doc(record.uid).set({
            email,
            displayName,
            role,
            createdAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        return jsonError(error, 'Failed to create user');
    }
}
