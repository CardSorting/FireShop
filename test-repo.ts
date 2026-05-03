
import { FirestoreProductRepository } from './src/infrastructure/repositories/firestore/FirestoreProductRepository';
import { logger } from './src/utils/logger';

async function testRepo() {
  const repo = new FirestoreProductRepository();
  try {
    const { products } = await repo.getAll({ limit: 10 });
    console.log(`Repo fetched ${products.length} products.`);
    if (products.length > 0) {
      console.log('Sample product date:', products[0].createdAt);
      console.log('Sample product date type:', typeof products[0].createdAt);
      console.log('Is valid date?', !isNaN(products[0].createdAt.getTime()));
    }
  } catch (err) {
    console.error('Repo fetch failed:', err);
  }
}

testRepo();
