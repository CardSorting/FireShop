
import { adminDb } from '../src/infrastructure/firebase/admin.ts';

async function listCollections() {
  const snapshot = await adminDb.collection('collections').get();
  console.log(`Found ${snapshot.size} collections.`);
  snapshot.forEach(doc => {
    console.log(`- ${doc.id} (Handle: ${doc.data().handle}, Name: ${doc.data().name})`);
  });
}

listCollections().catch(console.error);
