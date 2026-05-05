import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * [LAYER: INFRASTRUCTURE]
 * Seeding Script for Anime-Inspired Deck Lists and Series
 */

const BLOG_SERIES = [
  {
    id: 'series-anime-decks',
    title: 'From Screen to Sleeve: Anime-Inspired Decks',
    slug: 'from-screen-to-sleeve-anime-decks',
    description: 'Transforming iconic anime strategies into playable, modern TCG decklists for 2026.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fblue_eyes_deck_feature.png?alt=media',
    categoryIds: ['yugioh-decks', 'yugioh'],
    articleCount: 3,
    difficulty: 'intermediate',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const BLOG_POSTS = [
  {
    id: 'ai-deck-1',
    categoryId: 'yugioh-decks',
    seriesId: 'series-anime-decks',
    seriesPosition: 1,
    title: 'The Ultimate Blue-Eyes Deck: A Kaiba-Inspired Build for 2026',
    slug: 'ultimate-blue-eyes-kaiba-deck-2026',
    excerpt: 'Step into the shoes of Seto Kaiba with this high-performance Blue-Eyes White Dragon decklist, modernized for the current 2026 meta.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fblue_eyes_deck_feature.png?alt=media',
    featuredImageAlt: 'Premium Blue-Eyes White Dragon deck on a Kaiba-tech desk',
    tags: ['yugioh', 'decklist', 'kaiba', 'blue-eyes'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 567,
    helpfulCount: 88,
    notHelpfulCount: 2,
    metaTitle: 'Modern Blue-Eyes Decklist 2026: Kaiba Inspired',
    metaDescription: 'Unleash the power of the Blue-Eyes White Dragon with our 2026 decklist. Optimized for modern play while staying true to Kaiba\'s legacy.',
    content: `# The Ultimate Blue-Eyes Deck: A Kaiba-Inspired Build for 2026 ...`,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-deck-2',
    categoryId: 'yugioh-decks',
    seriesId: 'series-anime-decks',
    seriesPosition: 2,
    title: 'Joey Wheeler\'s Red-Eyes Legacy: Can Luck Win in the Modern Meta?',
    slug: 'joey-wheeler-red-eyes-deck-2026',
    excerpt: 'Joey Wheeler proved that heart and luck can take you to the top. We analyze the Red-Eyes Black Dragon strategy for the 2026 season.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fred_eyes_deck_feature.png?alt=media',
    featuredImageAlt: 'Red-Eyes Black Dragon breathing fire with Joey Wheeler',
    tags: ['yugioh', 'decklist', 'joey-wheeler', 'red-eyes'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 432,
    helpfulCount: 65,
    notHelpfulCount: 3,
    metaTitle: 'Red-Eyes Black Dragon Decklist 2026: Joey Wheeler Style',
    metaDescription: 'Master the Red-Eyes Black Dragon with our Joey Wheeler-inspired 2026 decklist. Burn damage and fusion power combined.',
    content: `# Joey Wheeler's Red-Eyes Legacy: Can Luck Win? ...`,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-deck-3',
    categoryId: 'yugioh-decks',
    seriesId: 'series-anime-decks',
    seriesPosition: 3,
    title: 'Dark Magician Modernized: Yami Yugi\'s Strategy in the Fiendsmith Era',
    slug: 'dark-magician-yugi-deck-2026',
    excerpt: 'The ultimate wizard in terms of both attack and defense. We update Yami Yugi\'s iconic Dark Magician deck for the 2026 Fiendsmith meta.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fdark_magician_deck_feature.png?alt=media',
    featuredImageAlt: 'Dark Magician surrounded by mystical purple circles',
    tags: ['yugioh', 'decklist', 'yugi', 'dark-magician'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 789,
    helpfulCount: 124,
    notHelpfulCount: 1,
    metaTitle: 'Modern Dark Magician Decklist 2026: Yami Yugi Inspired',
    metaDescription: 'Update your Dark Magician strategy for 2026. This Yugi-inspired build balances nostalgia with high-level competitive protection.',
    content: `
# Dark Magician Modernized: Yami Yugi's Strategy in 2026

### Key Takeaways (Deck Overview)
- **Primary Strategy**: Control & Spell/Trap Negation.
- **Iconic Card**: Dark Magician (The ultimate wizard).
- **Modern Twist**: Using *Eternal Soul* and *Dark Magical Circle* to control the board while utilizing *Illusion of Chaos* for consistency.

## Introduction
"I believe in the Heart of the Cards!" Yami Yugi’s deck was built on a foundation of trust and magical prowess. In 2026, the "Dark Magician" engine has become a master of the "Grind Game," outlasting opponents through constant resurrection and targeted banishing.

## The 2026 Core Decklist (Sample)

**Main Deck (40 Cards)**
- 3x Dark Magician
- 3x Magicians' Souls (The ultimate engine piece)
- 3x Magician's Rod
- 3x Illusion of Chaos
- 3x Dark Magical Circle
- 3x Eternal Soul
- 1x Dark Magician Girl (For the *Bond Between Teacher and Student* tech)

**Extra Deck**
- 2x The Dark Magicians (The Fusion glue)
- 1x Red-Eyes Dark Dragoon (The ultimate boss monster)
- 1x Ebon High Magician

## Strategy Guide
The goal is to establish *Dark Magical Circle* and *Eternal Soul* as early as possible. This creates a loop where you can banish one card your opponent controls every time you summon *Dark Magician*. In the 2026 meta, this non-destruction removal is vital for bypassing high-protection threats.

## The Verdict
Dark Magician remains the fan-favorite for a reason. Its ability to control the pace of the game is unparalleled for an anime-inspired build. If you want to outsmart your opponent with "Arcane Strategy," this is the deck for you.

## FAQ
**Q: Is Dark Magician Girl necessary?**
A: Not strictly, but she enables some powerful Fusion and Trap synergies that can catch an opponent off guard.

**Q: How do you protect Eternal Soul from being destroyed?**
A: We run a heavy "Solemn" package and *Dark Magician the Dragon Knight* to ensure our backrow stays safe.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  }
];

async function seedDecks() {
  console.log('--- Starting Advanced Anime Deck List Seeding ---');
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
    console.log(`✓ Deck Post Seeded: ${post.title}`);
    createdPosts++;
  }

  console.log(`--- Seeding Complete! ${createdSeries} Series, ${createdPosts} Deck Posts. ---`);
}

seedDecks().catch(console.error);
