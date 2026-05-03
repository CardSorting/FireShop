import { adminDb } from './src/infrastructure/firebase/admin.ts';

async function listUsers() {
    const snapshot = await adminDb.collection('users').get();
    console.log(`Found ${snapshot.size} users:`);
    snapshot.forEach(doc => {
        console.log(`- ${doc.id}: ${doc.data().email} (${doc.data().role})`);
    });
}

listUsers().catch(console.error);
