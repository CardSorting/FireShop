
import { adminDb, adminStorage } from '../src/infrastructure/firebase/admin.ts';
import crypto from 'crypto';

/**
 * [LAYER: INFRASTRUCTURE]
 * Migration Script to move product images from Amazon to Firebase Storage.
 */

async function migrateImages() {
  console.log('--- Starting Image Migration to Firebase Storage ---');
  
  const bucket = adminStorage.bucket();
  const productsSnap = await adminDb.collection('products').get();
  
  console.log(`Found ${productsSnap.size} products to check.`);
  
  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const doc of productsSnap.docs) {
    const data = doc.data();
    const handle = data.handle;
    const currentImageUrl = data.imageUrl;

    if (!currentImageUrl) {
      skippedCount++;
      continue;
    }

    // Only migrate if it's an external URL (specifically Amazon in this case)
    if (!currentImageUrl.includes('amazon.com') && !currentImageUrl.includes('m.media-amazon')) {
      skippedCount++;
      continue;
    }

    console.log(`Migrating: ${handle} (${currentImageUrl})`);

    try {
      const response = await fetch(currentImageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const extension = contentType.split('/')[1]?.split(';')[0] || 'jpg';
      
      // Clean handle for filename
      const safeHandle = handle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${safeHandle}_${Date.now()}.${extension}`;
      const destination = `products/${handle}/${filename}`;

      const file = bucket.file(destination);
      
      // Save to Firebase Storage
      await file.save(buffer, {
        metadata: {
          contentType: contentType,
          metadata: {
            originalUrl: currentImageUrl,
            migratedAt: new Date().toISOString(),
            productHandle: handle
          }
        }
      });

      // Construct the public URL
      // Format: https://storage.googleapis.com/[BUCKET_NAME]/[PATH]
      // Or: https://firebasestorage.googleapis.com/v0/b/[BUCKET_NAME]/o/[PATH]?alt=media
      const newUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;

      // Update the product document
      const updatedMedia = (data.media || []).map((m: any) => {
        if (m.url === currentImageUrl) {
          return { ...m, url: newUrl };
        }
        return m;
      });

      await adminDb.collection('products').doc(doc.id).update({
        imageUrl: newUrl,
        media: updatedMedia,
        updatedAt: new Date()
      });

      console.log(`✓ Successfully migrated ${handle} to Firebase.`);
      migratedCount++;
    } catch (err) {
      console.error(`✗ Error migrating ${handle}:`, err);
      errorCount++;
    }
  }

  console.log('--- Migration Summary ---');
  console.log(`Migrated: ${migratedCount}`);
  console.log(`Skipped:  ${skippedCount}`);
  console.log(`Errors:   ${errorCount}`);
  console.log('---------------------------');
}

migrateImages().catch(console.error);
