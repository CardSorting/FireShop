
import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';
import crypto from 'crypto';

async function fixTaxonomy() {
    console.log('--- Fixing Taxonomy and Collections ---');
    const now = Timestamp.now();

    // 1. Sync 'categories' to 'product_categories'
    console.log('Syncing "categories" to "product_categories"...');
    const oldCatsSnap = await adminDb.collection('categories').get();
    for (const doc of oldCatsSnap.docs) {
        const data = doc.data();
        // Ensure it has required fields for ProductCategory
        const newCat = {
            id: doc.id,
            name: data.name || 'Unknown',
            slug: data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'unknown',
            description: data.description || null,
            createdAt: data.createdAt || now,
            updatedAt: now
        };
        await adminDb.collection('product_categories').doc(doc.id).set(newCat);
        console.log(`  ✓ Synced category: ${newCat.name} (${newCat.slug})`);
    }

    // 2. Ensure 'card-game' and 'card-games' exist in product_categories
    const targetSlugs = ['card-game', 'card-games'];
    for (const slug of targetSlugs) {
        const snap = await adminDb.collection('product_categories').where('slug', '==', slug).get();
        if (snap.empty) {
            console.log(`Creating missing category: ${slug}...`);
            const id = crypto.randomUUID();
            await adminDb.collection('product_categories').doc(id).set({
                id,
                name: slug === 'card-game' ? 'Card Game' : 'Card Games',
                slug,
                description: `Explore our collection of ${slug === 'card-game' ? 'Card Game' : 'Card Games'}.`,
                createdAt: now,
                updatedAt: now
            });
        }
    }

    // 3. Ensure 'card-game' and 'card-games' exist in collections
    const targetHandles = ['card-game', 'card-games'];
    for (const handle of targetHandles) {
        const snap = await adminDb.collection('collections').where('handle', '==', handle).get();
        if (snap.empty) {
            console.log(`Creating missing collection: ${handle}...`);
            const id = crypto.randomUUID();
            await adminDb.collection('collections').doc(id).set({
                id,
                name: handle === 'card-game' ? 'Card Game' : 'Card Games',
                handle,
                status: 'active',
                productCount: 0,
                description: `Discover ${handle === 'card-game' ? 'Card Game' : 'Card Games'} at DreamBeesArt.`,
                createdAt: now,
                updatedAt: now
            });
        }
    }

    // 4. Update products that might be using the wrong category string
    console.log('Updating product categories to match slugs...');
    const productsSnap = await adminDb.collection('products').get();
    for (const doc of productsSnap.docs) {
        const data = doc.data();
        if (data.category === 'card-games' || data.category === 'Card Games' || data.category === 'Card Game') {
            // Normalize to 'card-game' if the user is using that
            await adminDb.collection('products').doc(doc.id).update({
                category: 'card-game'
            });
        }
    }

    console.log('--- Taxonomy Fix Complete ---');
}

fixTaxonomy().catch(console.error);
