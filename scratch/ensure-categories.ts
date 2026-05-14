
import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';

async function ensureCategories() {
  const now = Timestamp.now();
  const categories = [
    { name: 'Card Games', slug: 'card-games' },
    { name: 'Board Games', slug: 'board-games' },
    { name: 'Accessories', slug: 'accessories' },
  ];

  for (const cat of categories) {
    const snap = await adminDb.collection('categories').where('slug', '==', cat.slug).get();
    if (snap.empty) {
      console.log(`Creating category: ${cat.name}...`);
      await adminDb.collection('categories').add({
        ...cat,
        description: `Explore our collection of ${cat.name}.`,
        createdAt: now,
        updatedAt: now
      });
    } else {
      console.log(`Category exists: ${cat.name}`);
    }
  }

  // Also ensure collections match handles used in navigation
  const collections = [
    { name: 'TCG Accessories', handle: 'accessories' },
    { name: 'Bestsellers', handle: 'bestsellers' },
    { name: 'Artist Trading Cards', handle: 'artist-cards' },
    { name: 'New Drops', handle: 'new' },
    { name: 'Art Prints', handle: 'prints' },
    { name: 'Sale', handle: 'sale' },
    { name: 'Card Games', handle: 'card-games' },
  ];

  for (const coll of collections) {
    const snap = await adminDb.collection('collections').where('handle', '==', coll.handle).get();
    if (snap.empty) {
      console.log(`Creating collection: ${coll.name}...`);
      await adminDb.collection('collections').add({
        ...coll,
        status: 'active',
        productCount: 0,
        description: `Discover ${coll.name} at DreamBeesArt.`,
        createdAt: now,
        updatedAt: now
      });
    } else {
      console.log(`Collection exists: ${coll.name}`);
    }
  }
}

ensureCategories().catch(console.error);
