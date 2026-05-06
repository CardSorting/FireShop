import { adminDb } from '../src/infrastructure/firebase/admin';

async function checkArticles() {
  const snapshot = await adminDb.collection('knowledgebase_articles').get();
  console.log(`Found ${snapshot.size} articles.`);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}, Slug: ${data.slug}, Type: ${data.type}, Status: ${data.status}`);
  });
}

checkArticles().catch(console.error);
