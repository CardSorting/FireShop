
import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import fs from 'fs';

/**
 * [LAYER: INFRASTRUCTURE]
 * Script to regenerate and enrich the Shopify CSV from Firestore data.
 * Fixes missing columns and improves data quality.
 */

const VENDOR_MAP: Record<string, string> = {
  'Bicycle': 'Bicycle',
  'Mattel': 'Mattel',
  'UNO': 'Mattel',
  'Skip-Bo': 'Mattel',
  'Phase 10': 'Mattel',
  'Hasbro': 'Hasbro',
  'Monopoly': 'Hasbro',
  'Cyanide & Happiness': 'Cyanide & Happiness',
  'Joking Hazard': 'Cyanide & Happiness',
  'Exploding Kittens': 'Exploding Kittens',
  'Relatable': 'Relatable',
  'What Do You Meme': 'Relatable',
  'Regal Games': 'Regal Games',
  'Winning Moves': 'Winning Moves',
  'Dolphin Hat': 'Dolphin Hat Games',
  'Taco Cat': 'Dolphin Hat Games',
  'Pandasaurus': 'Pandasaurus Games',
  'Asmodee': 'Asmodee',
  'Spot It': 'Asmodee',
  'Secret Hitler': 'Goat, Wolf, & Cabbage',
  'Grandpa Beck': 'Grandpa Beck\'s Games'
};

function inferVendor(name: string): string {
  for (const [key, vendor] of Object.entries(VENDOR_MAP)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return vendor;
    }
  }
  return 'DreamBees Art'; // Default
}

function generateTags(name: string, productType: string): string[] {
  const tags = new Set<string>();
  tags.add('Card Game');
  tags.add('Tabletop');
  
  if (name.toLowerCase().includes('family')) tags.add('Family');
  if (name.toLowerCase().includes('party')) tags.add('Party');
  if (name.toLowerCase().includes('kids') || name.toLowerCase().includes('child')) tags.add('Kids');
  if (name.toLowerCase().includes('adult')) tags.add('Adult');
  if (name.toLowerCase().includes('travel')) tags.add('Travel');
  if (name.toLowerCase().includes('strategy')) tags.add('Strategy');
  if (name.toLowerCase().includes('educational')) tags.add('Educational');
  
  return Array.from(tags);
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

async function exportToCsv() {
  console.log('--- Regenerating enriched Shopify CSV ---');
  
  const productsSnap = await adminDb.collection('products').get();
  console.log(`Processing ${productsSnap.size} products from database...`);

  const headers = [
    'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Standardized Product Type', 'Custom Product Type',
    'Tags', 'Published', 'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value',
    'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
    'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price',
    'Variant Requires Shipping', 'Variant Taxable', 'Variant Barcode', 'Image Src', 'Image Position',
    'Image Alt Text', 'Gift Card', 'SEO Title', 'SEO Description'
  ];

  let csvRows = [headers.join(',')];

  for (const doc of productsSnap.docs) {
    const data = doc.data();
    
    // Only export products that came from our original set (avoid mocks if possible)
    // Actually, export everything currently in DB to be complete.
    
    const handle = data.handle || '';
    const title = data.name || '';
    const body = data.description || '';
    const vendor = data.vendor || inferVendor(title);
    const standardizedType = 'Games & Puzzles > Games > Card Games';
    
    // Improved Product Type logic
    let customType = data.productType;
    if (!customType || customType === 'General' || customType === 'general') {
      customType = 'Card Games';
    }
    
    const tags = (data.tags && data.tags.length > 0) ? data.tags : generateTags(title, customType);
    const published = data.status === 'active' ? 'TRUE' : 'FALSE';
    
    // Clean garbage SKUs
    let sku = data.sku || '';
    if (sku.toLowerCase().includes('description') || sku.toLowerCase().includes('age range') || sku.length > 50) {
      // Generate a cleaner SKU based on handle or vendor
      const prefix = vendor.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'DB');
      sku = `${prefix}-${handle.substring(0, 8).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    }
    
    // Price conversion back to dollars
    const price = (data.price / 100).toFixed(2);
    const compareAtPrice = data.compareAtPrice ? (data.compareAtPrice / 100).toFixed(2) : '';
    
    const row = [
      escapeCsv(handle),
      escapeCsv(title),
      escapeCsv(body),
      escapeCsv(vendor),
      escapeCsv(standardizedType),
      escapeCsv(customType),
      escapeCsv(tags.join(', ')),
      published,
      'Title',
      'Default Title',
      '', // Option2 Name
      '', // Option2 Value
      escapeCsv(sku),
      data.weightGrams || 0,
      data.trackQuantity ? 'shopify' : '',
      data.stock || 0,
      'deny',
      'manual',
      price,
      compareAtPrice,
      data.physicalItem ? 'TRUE' : 'FALSE',
      data.taxable ? 'TRUE' : 'FALSE',
      escapeCsv(data.barcode || ''),
      escapeCsv(data.imageUrl || ''),
      1, // Image Position
      escapeCsv(data.name || ''),
      'FALSE',
      escapeCsv(data.seoTitle || title),
      escapeCsv(data.seoDescription || body.replace(/<[^>]*>/g, '').substring(0, 160))
    ];

    csvRows.push(row.join(','));
  }

  const csvContent = csvRows.join('\n');
  const csvPath = '/Users/bozoegg/Desktop/DreamBeesArt/Untitled spreadsheet - Sheet1.csv';
  
  fs.writeFileSync(csvPath, csvContent);
  console.log(`✓ CSV successfully regenerated at ${csvPath}`);
}

exportToCsv().catch(console.error);
