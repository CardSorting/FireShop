
import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import crypto from 'crypto';

/**
 * [LAYER: INFRASTRUCTURE]
 * Reseeding Script: Clears current products and repopulates from the enriched CSV.
 */

function parseLine(line: string) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(csvText: string) {
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0) return [];
  const result = [];
  const headers = parseLine(lines[0]);

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index];
    });
    result.push(obj);
  }
  return result;
}

async function clearCollection(collectionName: string) {
  console.log(`Clearing collection: ${collectionName}...`);
  const snapshot = await adminDb.collection(collectionName).get();
  const batchSize = 500;
  
  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = adminDb.batch();
    const chunk = snapshot.docs.slice(i, i + batchSize);
    chunk.forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit();
  }
  console.log(`✓ Collection ${collectionName} cleared.`);
}

async function reseedProducts() {
  const csvPath = '/Users/bozoegg/Desktop/DreamBeesArt/Untitled spreadsheet - Sheet1.csv';
  console.log(`--- Starting Product Reseed from Enriched CSV ---`);

  // 1. Clear existing products and inventory levels
  await clearCollection('products');
  await clearCollection('inventory_levels');

  // 2. Read Enriched CSV
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found at ${csvPath}`);
    return;
  }
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);
  console.log(`Read ${rows.length} products from enriched CSV.`);

  // 3. Populate Products
  const now = Timestamp.now();
  let created = 0;
  const productIds: string[] = [];

  for (const row of rows) {
    try {
      const id = crypto.randomUUID();
      const handle = row['Handle'];
      
      const productData = {
        id,
        name: row['Title'],
        description: row['Body (HTML)'],
        vendor: row['Vendor'],
        standardizedProductType: row['Standardized Product Type'],
        productType: row['Custom Product Type'],
        tags: row['Tags'] ? row['Tags'].split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        handle: handle,
        status: row['Published'] === 'TRUE' ? 'active' : 'draft',
        sku: row['Variant SKU'],
        weightGrams: parseFloat(row['Variant Grams'] || '0'),
        trackQuantity: row['Variant Inventory Tracker'] === 'shopify',
        stock: parseInt(row['Variant Inventory Qty'] || '0', 10),
        price: Math.round(parseFloat(row['Variant Price'] || '0') * 100),
        compareAtPrice: row['Variant Compare At Price'] ? Math.round(parseFloat(row['Variant Compare At Price']) * 100) : null,
        physicalItem: row['Variant Requires Shipping'] === 'TRUE',
        taxable: row['Variant Taxable'] === 'TRUE',
        barcode: row['Variant Barcode'],
        imageUrl: row['Image Src'],
        seoTitle: row['SEO Title'],
        seoDescription: row['SEO Description'],
        category: 'card-games',
        collections: [],
        createdAt: now,
        updatedAt: now,
        media: row['Image Src'] ? [{
          id: crypto.randomUUID(),
          url: row['Image Src'],
          altText: row['Image Alt Text'] || row['Title'],
          position: parseInt(row['Image Position'] || '1', 10),
          createdAt: now
        }] : []
      };

      await adminDb.collection('products').doc(id).set(productData);
      productIds.push(id);
      created++;
      
      if (created % 10 === 0) console.log(`  Processed ${created} products...`);
    } catch (err) {
      console.error(`Error seeding product ${row['Title']}:`, err);
    }
  }

  // 4. Populate Inventory Levels (standard logic from SeedDataLoader)
  console.log('Populating inventory levels for new products...');
  const locationsSnap = await adminDb.collection('inventory_locations').get();
  const locationIds = locationsSnap.docs.map((d: any) => d.id);
  
  if (locationIds.length === 0) {
    // Create a default location if none exists
    const locId = 'loc-main';
    await adminDb.collection('inventory_locations').doc(locId).set({
      id: locId,
      name: 'Main Warehouse',
      type: 'warehouse',
      isDefault: true,
      isActive: true,
      createdAt: now
    });
    locationIds.push(locId);
  }

  for (const prodId of productIds) {
    const prodDoc = await adminDb.collection('products').doc(prodId).get();
    const prod = prodDoc.data();
    for (const locId of locationIds) {
      const invId = `${prodId}_${locId}`;
      await adminDb.collection('inventory_levels').doc(invId).set({
        productId: prodId,
        locationId: locId,
        availableQty: prod?.stock || 0,
        reservedQty: 0,
        incomingQty: 0,
        reorderPoint: 5,
        reorderQty: 20,
        updatedAt: now
      });
    }
  }

  console.log(`--- Reseed Complete! ${created} products and their inventory levels have been repopulated. ---`);
}

reseedProducts().catch(console.error);
