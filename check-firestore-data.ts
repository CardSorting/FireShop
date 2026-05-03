
import { adminDb } from './src/infrastructure/firebase/admin';

async function checkProducts() {
  try {
    const snapshot = await adminDb.collection('products').get();
    console.log(`Found ${snapshot.size} products.`);
    if (snapshot.size > 0) {
      const firstProduct = snapshot.docs[0].data();
      console.log('First product sample:', JSON.stringify(firstProduct, null, 2));
      console.log('createdAt type:', typeof firstProduct.createdAt);
      console.log('is instance of Timestamp?', firstProduct.createdAt?.constructor?.name);
    }
  } catch (err) {
    console.error('Failed to fetch products:', err);
  }
}

checkProducts();
