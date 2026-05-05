import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * [LAYER: INFRASTRUCTURE]
 * Seeding Script for Smash Bros. Heritage Content
 */

const BLOG_SERIES = [
  {
    id: 'series-smash-chronicles',
    title: 'The Smash Chronicles: Rumors, Tech, and Triumphs',
    slug: 'the-smash-chronicles-rumors-tech-triumphs',
    description: 'A deep-dive into the competitive history, legendary myths, and evolving meta of the Super Smash Bros. franchise.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fmelee_competitive_feature.png?alt=media',
    categoryIds: ['smash'],
    articleCount: 3,
    difficulty: 'intermediate',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const BLOG_POSTS = [
  {
    id: 'ai-smash-1',
    categoryId: 'smash',
    seriesId: 'series-smash-chronicles',
    seriesPosition: 1,
    title: 'Melee is Forever: Why the 2001 Game Still Dominates the Competitive Scene',
    slug: 'why-smash-melee-is-forever-competitive-scene',
    excerpt: 'Released in 2001, Super Smash Bros. Melee refuses to die. We analyze the technical depth and community passion that keeps this GameCube classic at the top of esports.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fmelee_competitive_feature.png?alt=media',
    featuredImageAlt: 'Melee tournament setup with CRT television and GameCube controller',
    tags: ['smash', 'melee', 'esports', 'gaming-history'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 654,
    helpfulCount: 92,
    notHelpfulCount: 1,
    metaTitle: 'Why Smash Melee is Forever: Competitive Analysis (2026)',
    metaDescription: 'Discover the technical secrets of Super Smash Bros. Melee. From Wavedashing to L-canceling, learn why the 2001 classic is still a competitive titan.',
    content: `# Melee is Forever: Why the 2001 Game Still Dominates ...`,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-smash-2',
    categoryId: 'smash',
    seriesId: 'series-smash-chronicles',
    seriesPosition: 2,
    title: 'The Legend of Sonic in Melee: Debunking the Most Famous Rumor in Gaming',
    slug: 'sonic-in-melee-rumor-debunked',
    excerpt: 'Before the internet was a reliable source, gaming rumors were legendary. We revisit the "Sonic in Melee" myth and why we all believed it in 2002.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fsonic_melee_rumor_feature.png?alt=media',
    featuredImageAlt: 'Fake Sonic the Hedgehog unlock screen in Smash Melee',
    tags: ['smash', 'rumors', 'gaming-myths', 'sonic'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 812,
    helpfulCount: 134,
    notHelpfulCount: 0,
    metaTitle: 'Sonic in Smash Melee: Debunking the Legendary Myth',
    metaDescription: 'Revisit the most famous gaming rumor of the early 2000s. Learn how the Sonic in Melee myth started and why it captured our imaginations.',
    content: `# The Legend of Sonic in Melee: Debunking the Myth ...`,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-smash-3',
    categoryId: 'smash',
    seriesId: 'series-smash-chronicles',
    seriesPosition: 3,
    title: 'Smash 64 to Ultimate: The Evolution of the Competitive Meta',
    slug: 'smash-64-to-ultimate-evolution-competitive-meta',
    excerpt: 'From the "hitstun" of 64 to the "everyone is here" chaos of Ultimate, we track the evolution of the Super Smash Bros. meta across five console generations.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fsmash_evolution_feature.png?alt=media',
    featuredImageAlt: 'Evolution of Mario in Super Smash Bros across four eras',
    tags: ['smash', 'gaming-history', 'evolution', 'competitive'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 942,
    helpfulCount: 156,
    notHelpfulCount: 2,
    metaTitle: 'The Evolution of Smash Bros. Meta: 64 to Ultimate',
    metaDescription: 'Trace the history of Super Smash Bros. competitive play. Learn how mechanics shifted from the N64 original to the Nintendo Switch masterpiece.',
    content: `
# Smash 64 to Ultimate: The Evolution of the Meta

### Key Takeaways (The Era Breakdown)
- **N64 Era**: High hitstun, massive combos, Z-canceling.
- **GameCube Era**: Precision movement, accidental mechanics (Wavedashing).
- **Wii/WiiU Era**: Slower pace, defensive play, Brawl's "tripping" controversy.
- **Switch Era**: The perfect balance, massive roster, ultra-polished mechanics.

## Introduction
Super Smash Bros. is more than just a fighting game; it's a living history of Nintendo's design philosophy. Each entry in the series reflects the hardware it was built for and the community sentiment of its time.

## From 64 to Melee: The Speed Revolution
The original Smash on N64 was a proof-of-concept that leaned heavily on combo depth. But Melee changed everything by introducing a physics engine that rewarded high-speed technicality.

## The Brawl Controversy
*Super Smash Bros. Brawl* on the Wii is often remembered for "tripping"—a random mechanic that caused characters to fall over. This was a deliberate attempt by Sakurai to make the game less competitive, which sparked the creation of *Project M*, a community-driven mod to bring back Melee physics.

## Ultimate: The Final Form
*Super Smash Bros. Ultimate* successfully merged the speed of the older titles with the balance and polish of the new ones. With "Everyone is Here," it became the definitive celebration of gaming history.

## The Verdict
The meta will continue to shift, but the core of Smash remains the same: a celebration of gaming's greatest icons clashing in a beautiful, chaotic arena.

## FAQ
**Q: Which game has the most characters?**
A: *Super Smash Bros. Ultimate*, with a staggering 89 playable fighters (including DLC).

**Q: Is Smash 4 still played?**
A: While mostly eclipsed by Ultimate, some niche communities still enjoy the specific mechanics of the Wii U era.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  }
];

async function seedSmash() {
  console.log('--- Starting Advanced Smash Bros. Heritage Seeding ---');
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
    console.log(`✓ Smash Post Seeded: ${post.title}`);
    createdPosts++;
  }

  console.log(`--- Seeding Complete! ${createdSeries} Series, ${createdPosts} Smash Posts. ---`);
}

seedSmash().catch(console.error);
