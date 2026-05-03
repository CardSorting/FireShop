import { adminDb } from './src/infrastructure/firebase/admin.ts';

async function seedAdmin() {
    const users = [
        {
            uid: "bjOlivy9O7cidn2GYQCAbeszBKF3",
            email: "alchemist@dreambeesai.com",
            displayName: "Alchemist Admin"
        },
        {
            uid: "W2KoCiJZ1uTjf60uEakV0Vv29mD2",
            email: "admin@dreambees.art",
            displayName: "System Admin"
        }
    ];

    for (const user of users) {
        console.log(`Seeding admin role for ${user.email} (UID: ${user.uid})...`);
        const userRef = adminDb.collection('users').doc(user.uid);
        await userRef.set({
            id: user.uid,
            email: user.email,
            role: 'admin',
            displayName: user.displayName,
            createdAt: new Date(),
            updatedAt: new Date()
        }, { merge: true });
    }

    // Cleanup old incorrect record
    console.log('Cleaning up old incorrect record...');
    await adminDb.collection('users').doc('alchemist-prod-admin').delete();

    console.log('Admin users seeded in Firestore successfully with correct UIDs!');
}

seedAdmin().catch(console.error);
