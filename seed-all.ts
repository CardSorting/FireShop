
import { seedProducts, seedCustomers, seedOrders } from './src/infrastructure/services/SeedDataLoader';
import { logger } from './src/utils/logger';

async function main() {
  try {
    logger.info('Starting comprehensive seeding...');
    
    const products = await seedProducts();
    logger.info(`Seeded ${products} products.`);
    
    const customers = await seedCustomers();
    logger.info(`Seeded ${customers} customers.`);
    
    const orders = await seedOrders();
    logger.info(`Seeded ${orders} orders.`);
    
    logger.info('Seeding complete!');
    process.exit(0);
  } catch (err) {
    logger.error('Seeding failed:', err);
    process.exit(1);
  }
}

main();
