
import { adminDb } from '../src/infrastructure/firebase/admin.ts';

async function checkProductCategories() {
  const snapshot = await adminDb.collection('products').limit(10).get();
  snapshot.forEach(doc => {
    console.log(`Product: ${doc.data().name} -> Category: ${doc.data().category}`);
  });
}

checkProductCategories().catch(console.error);
