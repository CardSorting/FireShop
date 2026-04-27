import { NextResponse } from 'next/server';
import { DomainError } from '@domain/errors';
import { jsonError, readJsonObject, requireAdminSession } from '@infrastructure/server/apiGuards';
import { getServerServices } from '@infrastructure/server/services';
import type { JsonValue, UserRole } from '@domain/models';

const USER_ROLES = new Set<UserRole>(['customer', 'admin']);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdminSession();
        const { id } = await params;
        const body = await readJsonObject(request);

        const updates: {
            displayName?: string;
            role?: UserRole;
            notes?: string;
            metadata?: Record<string, JsonValue>;
        } = {};

        if ('displayName' in body) {
            if (typeof body.displayName !== 'string' || !body.displayName.trim()) {
                throw new DomainError('Display name is required.');
            }
            updates.displayName = body.displayName.trim();
        }

        if ('role' in body) {
            if (typeof body.role !== 'string' || !USER_ROLES.has(body.role as UserRole)) {
                throw new DomainError('Role is invalid.');
            }
            updates.role = body.role as UserRole;
        }

        if ('notes' in body) {
            if (body.notes !== null && typeof body.notes !== 'string') {
                throw new DomainError('Notes must be text.');
            }
            updates.notes = typeof body.notes === 'string' ? body.notes : '';
        }

        if ('metadata' in body) {
            if (!body.metadata || typeof body.metadata !== 'object' || Array.isArray(body.metadata)) {
                throw new DomainError('Metadata must be a JSON object.');
            }
            updates.metadata = body.metadata as Record<string, JsonValue>;
        }

        if (Object.keys(updates).length === 0) {
            throw new DomainError('No supported user updates were provided.');
        }

        const services = await getServerServices();
        const updated = await services.authService.updateUser(id, updates);
        return NextResponse.json(updated);
    } catch (error) {
        return jsonError(error, 'Failed to update user');
    }
}