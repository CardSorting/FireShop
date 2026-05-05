import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * [LAYER: INFRASTRUCTURE]
 * Seeding Script for Tabletop & Tactical Gaming Content
 */

const BLOG_SERIES = [
  {
    id: 'series-tabletop-tactical',
    title: 'The Tactical Table: Beyond the Grid',
    slug: 'the-tactical-table-beyond-the-grid',
    description: 'Exploring deep-mechanic board games and tactical miniatures that bridge the gap between TCGs and complex tabletop systems.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fgloomhaven_feature.png?alt=media',
    categoryIds: ['tabletop'],
    articleCount: 3,
    difficulty: 'advanced',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const BLOG_POSTS = [
  {
    id: 'ai-tabletop-1',
    categoryId: 'tabletop',
    seriesId: 'series-tabletop-tactical',
    seriesPosition: 1,
    title: 'Beyond D&D: Why Gloomhaven is the Ultimate TCG Player\'s Board Game',
    slug: 'beyond-dnd-gloomhaven-for-tcg-players',
    excerpt: 'Love the tactical depth of Magic or Yu-Gi-Oh!? Discover why Gloomhaven\'s card-driven combat is the perfect transition into high-end tabletop gaming.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fgloomhaven_feature.png?alt=media',
    featuredImageAlt: 'Gloomhaven board game setup with detailed miniatures and ability cards',
    tags: ['tabletop', 'gloomhaven', 'board-games', 'tactics'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 342,
    helpfulCount: 56,
    notHelpfulCount: 0,
    metaTitle: 'Gloomhaven for TCG Players: A Tactical Bridge Guide',
    metaDescription: 'Explore the card-driven mechanics of Gloomhaven and why it appeals to competitive card game enthusiasts. Move beyond D&D today.',
    content: `# Beyond D&D: Why Gloomhaven is the Ultimate TCG Player's Board Game ...`,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-tabletop-2',
    categoryId: 'tabletop',
    seriesId: 'series-tabletop-tactical',
    seriesPosition: 2,
    title: 'Warhammer 40k: The Collector\'s Guide to Painting & Play in 2026',
    slug: 'warhammer-40k-collector-guide-2026',
    excerpt: 'The grim darkness of the far future has never looked better. We break down the 2026 state of Warhammer 40,000 for the high-end collector.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fwarhammer_40k_feature.png?alt=media',
    featuredImageAlt: 'Perfectly painted Space Marine miniature with painting supplies',
    tags: ['warhammer', '40k', 'miniatures', 'painting', 'collecting'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 512,
    helpfulCount: 78,
    notHelpfulCount: 1,
    metaTitle: 'Warhammer 40,000 Collector Guide 2026: Painting & Strategy',
    metaDescription: 'Master the art of Warhammer 40k. From assembling your first army to advanced painting techniques, this is the 2026 guide for serious collectors.',
    content: `# Warhammer 40k: The Collector's Guide to Painting & Play ...`,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-tabletop-3',
    categoryId: 'tabletop',
    seriesId: 'series-tabletop-tactical',
    seriesPosition: 3,
    title: 'Kingdom Death: Monster – The Dark Souls of Tabletop Gaming',
    slug: 'kingdom-death-monster-kdm-review',
    excerpt: 'Explore the brutal, beautiful world of Kingdom Death: Monster. We review why this boutique board game has become the ultimate grail for serious tabletop collectors.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fkdm_feature.png?alt=media',
    featuredImageAlt: 'Highly detailed bone-white Lion miniature from Kingdom Death: Monster',
    tags: ['tabletop', 'kdm', 'boutique', 'miniatures', 'review'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 892,
    helpfulCount: 145,
    notHelpfulCount: 2,
    metaTitle: 'Kingdom Death: Monster Review 2026: The Ultimate Grail Game',
    metaDescription: 'Is Kingdom Death: Monster worth the investment? We analyze the mechanics, the miniatures, and the brutal difficulty of the world\'s most expensive board game.',
    content: `
# Kingdom Death: Monster – The Dark Souls of Tabletop Gaming

### Key Takeaways (The Grail Specs)
- **Mechanic**: Tactical Boss Hunting & Settlement Management.
- **Vibe**: Dark, Surreal Horror.
- **Collector Value**: Extremely High (Limited boutique runs).

## Introduction
In the world of tabletop gaming, there are "board games," and then there is **Kingdom Death: Monster (KDM)**. Known for its jaw-dropping miniatures and notoriously brutal difficulty, KDM has earned its title as the "Dark Souls" of the tabletop world.

## The Boutique Experience
KDM isn't just a game; it's a piece of art. Each miniature is a high-end multi-part model that requires assembly and painting, similar to Warhammer but with a surreal, nightmarish aesthetic that is unique to creator Adam Poots.

## Why it Appeals to TCG Players
KDM features a deep "AI Deck" system for every boss. Each monster has its own deck of behaviors, and as a player, you must learn to "read the deck" to survive. This pattern recognition and tactical responding are exactly what TCG players excel at.

## The Verdict
KDM is a heavy investment of both time and money, but for the "Geek/Collector" who wants the ultimate tabletop experience, it is an absolute grail.

## FAQ
**Q: Why is it so expensive?**
A: The production value is off the charts. The core box weighs nearly 20 lbs and contains hundreds of hours of content and high-end plastics.

**Q: Can you play it solo?**
A: Yes! Many fans actually prefer the solo "settlement management" experience.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  }
];

async function seedTabletop() {
  console.log('--- Starting Advanced Tabletop Seeding ---');
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
    console.log(`✓ Tabletop Post Seeded: ${post.title}`);
    createdPosts++;
  }

  console.log(`--- Seeding Complete! ${createdSeries} Series, ${createdPosts} Tabletop Posts. ---`);
}

seedTabletop().catch(console.error);
