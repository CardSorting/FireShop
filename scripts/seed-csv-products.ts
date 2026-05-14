
import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * [LAYER: INFRASTRUCTURE]
 * Seeding Script for Products from Shopify CSV
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

async function seedCsvProducts() {
  const csvPath = '/Users/bozoegg/Desktop/DreamBeesArt/Untitled spreadsheet - Sheet1.csv';
  console.log(`--- Starting CSV Product Seeding from ${csvPath} ---`);
  
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found at ${csvPath}`);
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);
  console.log(`Found ${rows.length} products in CSV.`);

  let created = 0;
  const now = Timestamp.now();

  for (const row of rows) {
    try {
      const handle = row['Handle'];
      if (!handle) {
        console.warn('Skipping row without handle:', row['Title']);
        continue;
      }

      const productData: any = {
        name: row['Title'] || 'Untitled Product',
        description: row['Body (HTML)'] || '',
        price: Math.round(parseFloat(row['Variant Price'] || '0') * 100),
        compareAtPrice: row['Variant Compare At Price'] ? Math.round(parseFloat(row['Variant Compare At Price']) * 100) : null,
        vendor: row['Vendor'] || '',
        productType: row['Custom Product Type'] || row['Standardized Product Type'] || 'General',
        tags: row['Tags'] ? row['Tags'].split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        handle: handle,
        stock: parseInt(row['Variant Inventory Qty'] || '0', 10),
        sku: row['Variant SKU'] || '',
        weightGrams: parseFloat(row['Variant Grams'] || '0'),
        imageUrl: row['Image Src'] || '',
        status: row['Published'] === 'TRUE' ? 'active' : 'draft',
        physicalItem: row['Variant Requires Shipping'] === 'TRUE',
        taxable: row['Variant Taxable'] === 'TRUE',
        barcode: row['Variant Barcode'] || '',
        seoTitle: row['SEO Title'] || row['Title'] || '',
        seoDescription: row['SEO Description'] || (row['Body (HTML)'] ? row['Body (HTML)'].replace(/<[^>]*>/g, '').substring(0, 160) : ''),
        category: 'general',
        collections: [],
        trackQuantity: row['Variant Inventory Tracker'] === 'shopify',
        createdAt: now,
        updatedAt: now,
        media: row['Image Src'] ? [{
          id: crypto.randomUUID(),
          url: row['Image Src'],
          altText: row['Image Alt Text'] || row['Title'] || '',
          position: parseInt(row['Image Position'] || '1', 10),
          createdAt: now
        }] : []
      };

      // Check for existing product with same handle
      const existing = await adminDb.collection('products').where('handle', '==', handle).get();
      
      if (!existing.empty) {
        // Update existing
        const docId = existing.docs[0].id;
        await adminDb.collection('products').doc(docId).update({
          ...productData,
          updatedAt: now
        });
        console.log(`✓ Updated Product: ${productData.name} (${handle})`);
      } else {
        // Create new
        const id = crypto.randomUUID();
        await adminDb.collection('products').doc(id).set({
          ...productData,
          id
        });
        console.log(`✓ Created Product: ${productData.name} (${handle})`);
      }
      
      created++;
    } catch (err) {
      console.error(`Error seeding product ${row['Title']}:`, err);
    }
  }

  console.log(`--- Seeding Complete! ${created} products processed. ---`);
}

seedCsvProducts().catch(console.error);
