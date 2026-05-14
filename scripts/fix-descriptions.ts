
import { adminDb } from '../src/infrastructure/firebase/admin.ts';

/**
 * [LAYER: INFRASTRUCTURE]
 * Script to fix empty product descriptions using local templates (No API).
 */

const TEMPLATES = [
  (name: string, vendor: string, tags: string) => `
    <p>Elevate your game night with <strong>${name}</strong> by <strong>${vendor}</strong>. 
    Expertly crafted for enthusiasts, this premium selection is a must-have for anyone interested in ${tags}.</p>
    <p><strong>Why You'll Love It:</strong></p>
    <ul>
      <li>High-quality materials for long-lasting play.</li>
      <li>Professional design that appeals to serious collectors and casual players alike.</li>
      <li>Perfect for gifting or expanding your personal library.</li>
    </ul>
    <p>Add <strong>${name}</strong> to your collection today and experience the boutique quality that DreamBees Art is known for.</p>
  `,
  (name: string, vendor: string, tags: string) => `
    <p>Discover the thrill of <strong>${name}</strong>, a standout choice from <strong>${vendor}</strong>. 
    This product is highly recommended for ${tags}, offering a perfect blend of strategy and entertainment.</p>
    <p><strong>Key Features:</strong></p>
    <ul>
      <li>Classic mechanics with a modern twist.</li>
      <li>Compact and portable for fun on the go.</li>
      <li>Engaging gameplay that brings people together.</li>
    </ul>
    <p>Don't miss out on adding this essential <strong>${vendor}</strong> piece to your tabletop rotation.</p>
  `,
  (name: string, vendor: string, tags: string) => `
    <p><strong>${name}</strong> brings a new level of excitement to your collection. 
    Produced by <strong>${vendor}</strong>, it carries a reputation for excellence in the world of ${tags}.</p>
    <p><strong>The DreamBees Difference:</strong></p>
    <ul>
      <li>Curated for collectors who demand the best.</li>
      <li>Stunning aesthetics that look great on any shelf or table.</li>
      <li>Intuitive play patterns for ages young and old.</li>
    </ul>
    <p>Secure your <strong>${name}</strong> now and join the community of elite tabletop enthusiasts.</p>
  `
];

async function fixDescriptionsLocal() {
  console.log('--- Starting Local Description Generation ---');
  
  const productsSnap = await adminDb.collection('products')
    .where('description', '==', '<p></p>')
    .get();

  console.log(`Found ${productsSnap.size} products with missing descriptions.`);

  let fixedCount = 0;

  for (const doc of productsSnap.docs) {
    const data = doc.data();
    const title = data.name;
    const vendor = data.vendor || 'DreamBees Art';
    const tags = data.tags?.join(', ') || 'Card Games, Tabletop';

    // Pick a template based on the hash of the title to ensure consistency but variety
    const hash = title.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const templateIndex = hash % TEMPLATES.length;
    
    const html = TEMPLATES[templateIndex](title, vendor, tags).trim();

    await adminDb.collection('products').doc(doc.id).update({
      description: html,
      updatedAt: new Date()
    });
    
    console.log(`✓ Generated Local Description: ${title}`);
    fixedCount++;
  }

  console.log('--- Local Fix Summary ---');
  console.log(`Fixed:  ${fixedCount}`);
  console.log('-------------------------');
  console.log('TIP: Run scripts/repopulate-csv.ts now to sync your local CSV file.');
}

fixDescriptionsLocal().catch(console.error);
