
import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';
import crypto from 'crypto';

async function seedReviews() {
  const productsSnap = await adminDb.collection('products').limit(10).get();
  const now = Timestamp.now();

  const reviewers = [
    { name: 'Sarah J.', title: 'Pure Joy!', content: 'My kids absolutely love this game. The quality is top-notch and it is so easy to learn.' },
    { name: 'Michael R.', title: 'Excellent Addition', content: 'As a collector, I am very picky. This exceeded my expectations in every way.' },
    { name: 'David L.', title: 'Great for Family Night', content: 'Fast-paced and hilarious. We have played it every night this week!' },
    { name: 'Emma W.', title: 'Beautiful Art', content: 'The illustrations are stunning. It is a work of art as much as a game.' },
    { name: 'Alex K.', title: 'Worth Every Penny', content: 'High replay value and very durable components. Highly recommended!' }
  ];

  for (const productDoc of productsSnap.docs) {
    console.log(`Seeding reviews for ${productDoc.data().name}...`);
    
    for (const reviewer of reviewers) {
      await adminDb.collection('reviews').add({
        productId: productDoc.id,
        userName: reviewer.name,
        rating: 5,
        title: reviewer.title,
        content: reviewer.content,
        isVerified: true,
        helpfulCount: Math.floor(Math.random() * 25),
        status: 'published',
        createdAt: now,
        updatedAt: now,
        replies: []
      });
    }
  }
}

seedReviews().catch(console.error);
