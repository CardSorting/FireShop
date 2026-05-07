import { adminAuth, adminDb, FieldValue, withAdminFirestoreRetry } from '@infrastructure/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { User, UserRole } from '@domain/models';
import { mapTimestamp } from '@infrastructure/repositories/firestore/utils';

function displayNameFromToken(decodedToken: DecodedIdToken, fallback?: string): string {
    return fallback || decodedToken.name || decodedToken.email?.split('@')[0] || 'User';
}

export async function userFromVerifiedIdToken(
    idToken: string,
    options: { displayName?: string } = {}
): Promise<User> {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email || '';
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc: any = await withAdminFirestoreRetry(
        () => userRef.get(),
        { operationName: 'firebaseSession.user.get' }
    );

    if (!userDoc.exists) {
        const user: User = {
            id: uid,
            email,
            displayName: displayNameFromToken(decodedToken, options.displayName),
            role: 'customer',
            createdAt: new Date(),
        };

        await withAdminFirestoreRetry(
            () => userRef.set({
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                createdAt: FieldValue.serverTimestamp(),
            }),
            { operationName: 'firebaseSession.user.create' }
        );

        return user;
    }

    const data = userDoc.data() || {};
    const updates: Record<string, unknown> = {};
    if (email && data.email !== email) updates.email = email;
    if (options.displayName && data.displayName !== options.displayName) updates.displayName = options.displayName;
    if (Object.keys(updates).length > 0) {
        updates.updatedAt = FieldValue.serverTimestamp();
        await withAdminFirestoreRetry(
            () => userRef.update(updates),
            { operationName: 'firebaseSession.user.update' }
        );
    }

    return {
        id: uid,
        email: email || data.email || '',
        displayName: options.displayName || data.displayName || displayNameFromToken(decodedToken),
        role: (data.role as UserRole) || 'customer',
        createdAt: mapTimestamp(data.createdAt),
    };
}
