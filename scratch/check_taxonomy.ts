
import { getInitialServices } from '../src/core/container';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkTaxonomy() {
    try {
        const services = getInitialServices();
        const categories = await services.taxonomyService.getAllCategories();
        console.log('Categories:', categories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })));
        
        const collections = await services.collectionService.list();
        console.log('Collections:', collections.map((c: any) => ({ id: c.id, name: c.name, handle: c.handle })));
    } catch (err) {
        console.error('Error checking taxonomy:', err);
    }
}

checkTaxonomy();
