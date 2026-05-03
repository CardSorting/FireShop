import { adminDb } from './src/infrastructure/firebase/admin.ts';

async function seedAdmin() {
    const adminEmail = "alchemist@dreambeesai.com";
    const adminUid = "alchemist-prod-admin"; // We can set a custom UID or find it if we had auth access

    console.log(`Seeding admin role for ${adminEmail}...`);

    // In a real scenario, we'd find the user by email in Firebase Auth first.
    // But since we are using Firestore repositories, we just need the record in the 'users' collection.
    
    const userRef = adminDb.collection('users').doc(adminUid);
    await userRef.set({
        id: adminUid,
        email: adminEmail,
        role: 'admin',
        displayName: 'Production Admin',
        createdAt: new Date(),
        updatedAt: new Date()
    }, { merge: true });

    console.log('Admin user seeded in Firestore successfully!');
}

seedAdmin().catch(console.error);
