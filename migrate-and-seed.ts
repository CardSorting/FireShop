import { seedAll } from './src/infrastructure/services/SeedDataLoader';
import { logger } from './src/utils/logger';

async function main() {
  try {
    logger.info('Starting DreamBeesArt Firestore Seeding...');
    
    // In Firestore, we don't have migrations in the same way as SQL.
    // We just run the seed data loader.
    
    await seedAll();

    logger.info('DreamBeesArt seeding complete!');
    process.exit(0);
  } catch (err) {
    logger.error('Seeding failed:', err);
    process.exit(1);
  }
}

main();
