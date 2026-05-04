import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@infrastructure/firebase/admin';
import { setSessionUser } from '@infrastructure/server/session';
import { assertRateLimit, jsonError, readJsonObject, requireString } from '@infrastructure/server/apiGuards';
import type { User, UserRole } from '@domain/models';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        assertRateLimit(request, 'auth:google', 10, 60_000);
        const body = await readJsonObject(request);
        const idToken = requireString(body.idToken, 'idToken');

        // Verify the ID token
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Get or create user in Firestore
        const userDoc = await adminDb.collection('users').doc(uid).get();
        let user: User;

        if (!userDoc.exists) {
            user = {
                id: uid,
                email: decodedToken.email || '',
                displayName: decodedToken.name || 'User',
                role: 'customer',
                createdAt: new Date(),
            };

            await adminDb.collection('users').doc(uid).set({
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                createdAt: Timestamp.now(),
            });
        } else {
            const data = userDoc.data()!;
            user = {
                id: uid,
                email: data.email,
                displayName: data.displayName,
                role: data.role as UserRole,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            };
        }

        // Set session cookie
        await setSessionUser(user);

        return NextResponse.json(user);
    } catch (error) {
        console.error('Google Auth API Error:', error);
        return jsonError(error, 'Google sign in failed');
    }
}
