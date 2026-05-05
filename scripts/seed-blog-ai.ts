import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * [LAYER: INFRASTRUCTURE]
 * Seeding Script for SEO-Hardened AI Blog Content, Series, and Meme Culture
 */

const BLOG_SERIES = [
  {
    id: 'series-lore-legends',
    title: 'TCG Lore & Legends: The Meme-Verse',
    slug: 'tcg-lore-legends-meme-verse',
    description: 'A deep-dive into the iconic inside jokes, memes, and community legends that define the TCG "In-Crowd".',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fpot_of_greed_meme_feature.png?alt=media',
    categoryIds: ['memes', 'yugioh', 'mtg'],
    articleCount: 3,
    difficulty: 'beginner',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const BLOG_POSTS = [
  {
    id: 'ai-post-1',
    categoryId: 'pokemon',
    title: 'PSA vs BGS: Which is Better for Pokémon Card Grading? A Comparative Review',
    slug: 'psa-vs-bgs-pokemon-grading-review',
    excerpt: 'In this deep-dive review, we compare the two giants of card grading—PSA and BGS—to determine which offers the best ROI for your Pokémon collection.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fpsa_vs_bgs_feature.png?alt=media',
    featuredImageAlt: 'PSA and BGS graded Pokémon cards side by side',
    tags: ['pokemon', 'grading', 'psa', 'bgs', 'investment'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 154,
    helpfulCount: 22,
    notHelpfulCount: 0,
    metaTitle: 'PSA vs BGS: Pokémon Card Grading Comparison (2026)',
    metaDescription: 'Should you grade your Pokémon cards with PSA or BGS? We analyze turnaround times, grading standards, and resale value to find the winner.',
    content: `# PSA vs BGS: Which is Better for Pokémon Card Grading? ...`,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-post-4',
    categoryId: 'memes',
    seriesId: 'series-lore-legends',
    seriesPosition: 1,
    title: 'The Forbidden Knowledge: What Does Pot of Greed Actually Do?',
    slug: 'what-does-pot-of-greed-actually-do-meme',
    excerpt: 'It is the most legendary inside joke in Yu-Gi-Oh! history. We explain the "mystery" of Pot of Greed and why it became the hobby\'s favorite meme.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fpot_of_greed_meme_feature.png?alt=media',
    featuredImageAlt: 'Iconic Pot of Greed glowing with green energy',
    tags: ['yugioh', 'memes', 'inside-jokes', 'lore'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 420,
    helpfulCount: 69,
    notHelpfulCount: 0,
    metaTitle: 'The Mystery of Pot of Greed: Yu-Gi-Oh! Meme Explained',
    metaDescription: 'Learn the legendary history of the Pot of Greed meme and why "drawing two cards" became a community obsession.',
    content: `# The Forbidden Knowledge: What Does Pot of Greed Actually Do? ...`,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-post-5',
    categoryId: 'memes',
    seriesId: 'series-lore-legends',
    seriesPosition: 2,
    title: 'Reading the Card Explains the Card: A History of TCG Literacy',
    slug: 'reading-the-card-explains-the-card-meme',
    excerpt: 'The most passive-aggressive yet accurate advice in all of Magic: The Gathering. We explore the origins of the "RTCETC" mantra.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Freading_card_meme_feature.png?alt=media',
    featuredImageAlt: 'Frustrated player pointing at card text',
    tags: ['mtg', 'memes', 'inside-jokes', 'community'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 231,
    helpfulCount: 45,
    notHelpfulCount: 2,
    metaTitle: 'Reading the Card Explains the Card: MTG Meme Origin',
    metaDescription: 'Discover the origins of the most famous phrase in Magic: The Gathering and why reading is a competitive advantage.',
    content: `# Reading the Card Explains the Card: A History of TCG Literacy ...`,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-post-6',
    categoryId: 'memes',
    seriesId: 'series-lore-legends',
    seriesPosition: 3,
    title: 'The 4th Blue-Eyes: Why Collector Scarcity Drives the Market',
    slug: 'the-fourth-blue-eyes-scarcity-meme',
    excerpt: 'Seto Kaiba knew something we didn\'t. We explore the "4th Blue-Eyes" incident and how intentional scarcity shapes the modern TCG investment landscape.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Ffourth_blue_eyes_meme_feature.png?alt=media',
    featuredImageAlt: 'Seto Kaiba holding a ripped Blue-Eyes card',
    tags: ['yugioh', 'memes', 'scarcity', 'investment'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 312,
    helpfulCount: 52,
    notHelpfulCount: 1,
    metaTitle: 'The 4th Blue-Eyes: TCG Scarcity & Market Psychology',
    metaDescription: 'Analyze the "4th Blue-Eyes" meme and its relationship to modern card scarcity, grading, and investment psychology.',
    content: `
# The 4th Blue-Eyes: Why Collector Scarcity Drives the Market

### Key Takeaways (The Scarcity Loop)
- **The Incident**: Seto Kaiba tearing up the 4th Blue-Eyes White Dragon.
- **The Psychology**: A card is worth more if your opponent *cannot* have it.
- **The Market**: How "Pop Counts" in grading mimic Kaiba's scarcity strategy.

## Introduction
In the very first episode of *Yu-Gi-Oh!*, Seto Kaiba does something that made every collector in the room scream: he tears a near-mint Blue-Eyes White Dragon in half. His reasoning? "This card will never be used against me!"

## The Verdict
The 4th Blue-Eyes is a meme about an over-the-top anime villain, but it's also a masterclass in market psychology. Scarcity drives desire, and desire drives the price.

## FAQ
**Q: Are there actually only 4 Blue-Eyes in the lore?**
A: In the original manga and anime, yes. There were only four copies ever printed, and Kaiba tracked them all down.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  }
];

async function seedBlog() {
  console.log('--- Starting Advanced Blog Seeding (Series + Meme Culture) ---');
  let createdSeries = 0;
  let createdPosts = 0;

  // Seed Series
  for (const series of BLOG_SERIES) {
    const seriesRef = adminDb.collection('blog_series').doc(series.id);
    await seriesRef.set({
      ...series,
      createdAt: Timestamp.fromDate(series.createdAt),
      updatedAt: Timestamp.fromDate(series.updatedAt),
    }, { merge: true });
    console.log(`✓ Series Seeded: ${series.title}`);
    createdSeries++;
  }

  // Seed Posts
  for (const post of BLOG_POSTS) {
    const postRef = adminDb.collection('knowledgebase_articles').doc(post.id);
    await postRef.set({
      ...post,
      createdAt: Timestamp.fromDate(post.createdAt),
      updatedAt: Timestamp.fromDate(post.updatedAt),
      publishedAt: post.publishedAt ? Timestamp.fromDate(post.publishedAt) : null,
    }, { merge: true });
    console.log(`✓ Post Seeded: ${post.title}`);
    createdPosts++;
  }

  console.log(`--- Seeding Complete! ${createdSeries} Series, ${createdPosts} Posts. ---`);
}

seedBlog().catch(console.error);
