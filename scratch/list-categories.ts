
import { adminDb } from '../src/infrastructure/firebase/admin.ts';

async function listCategories() {
  const snapshot = await adminDb.collection('categories').get();
  console.log(`Found ${snapshot.size} categories.`);
  snapshot.forEach((doc: any) => {
    console.log(`- ${doc.id} (Slug: ${doc.data().slug}, Name: ${doc.data().name})`);
  });
}

listCategories().catch(console.error);
