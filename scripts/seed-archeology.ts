import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * [LAYER: INFRASTRUCTURE]
 * Seeding Script for Vintage Archeology & Authentication Series
 */

const BLOG_SERIES = [
  {
    id: 'series-card-archeology',
    title: 'The Card Archeologist: Unearthing Hidden Gems',
    slug: 'card-archeologist-unearthing-hidden-gems',
    description: 'Master the art of bulk hunting, estate sale navigation, and forensic authentication of vintage TCG treasures.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fvintage_card_hunting_feature.png?alt=media',
    categoryIds: ['vintage', 'authentication'],
    articleCount: 2,
    difficulty: 'advanced',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const BLOG_POSTS = [
  {
    id: 'ai-archeology-1',
    categoryId: 'vintage',
    seriesId: 'series-card-archeology',
    seriesPosition: 1,
    title: 'Bulk Hunting: 5 Signs of a Hidden Grail in Unsorted Collections',
    slug: 'bulk-hunting-tcg-hidden-gems-guide',
    excerpt: 'Finding a $1,000 card in a $10 bulk box is every collector\'s dream. We show you the subtle indicators that a stack of "trash" contains a treasure.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fvintage_card_hunting_feature.png?alt=media',
    featuredImageAlt: 'Collector using a magnifying glass to inspect vintage TCG cards in a dusty attic setting',
    tags: ['bulk-hunting', 'vintage', 'pokemon', 'tips'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 4567,
    helpfulCount: 612,
    notHelpfulCount: 3,
    metaTitle: 'TCG Bulk Hunting Guide: How to Find Hidden Gems',
    metaDescription: 'Learn how to spot misprints, shadowless borders, and rare 1st editions in unsorted bulk boxes. Our archeology guide for vintage TCG hunters.',
    content: `
# Bulk Hunting: 5 Signs of a Hidden Grail

### Key Takeaways (The Archeologist's Checklist)
- **The "Shadowless" Border**: Spotting the missing drop-shadow on Base Set Pokémon cards.
- **The Stamp Check**: Looking for the elusive "1st Edition" or "Promo" stamps in non-standard locations.
- **Surface Texture**: Modern fakes lack the "grain" of 90s cardboard.
- **Misprint Markers**: Ink hickeys, misalignment, and "crimped" edges.

## Introduction
"Bulk" is where the most significant discoveries are made. While graded slabs are the safe bet, the real thrill of the hobby lies in the unsorted boxes found at garage sales, estate auctions, and local card shops. But finding a grail requires more than luck—it requires a trained eye.

## 1. The Shadowless Silhouette
For Pokémon collectors, the "Shadowless" variant of the Base Set is a primary target. These cards were printed after the 1st Edition but before the "Unlimited" run. They lack the dark shadow on the right side of the character art box. In a pile of common bulk, these can easily be missed by the untrained eye.

## 2. Forensic Texture Inspection
In 2026, high-quality fakes are everywhere. However, authentic 90s cards have a specific paper stock and ink density that is difficult to replicate. Authentic cards have a "matte" finish with a very subtle vertical grain. If a card feels "waxy" or has a high-gloss sheen in a bulk box, it's likely a modern reprint or a counterfeit.

## 3. The Misprint Goldmine
Sometimes, a card's "error" is its greatest value. Look for "Crimped" cards where the foil wrapper was sealed over the card itself. These are rare manufacturing errors that carry a massive premium among niche collectors.

## The Verdict
Archeology is about patience. If you're willing to sort through thousands of commons, the rewards can be life-changing. Always carry a magnifying glass and a keen sense of history.

## FAQ
**Q: Where is the best place to find bulk?**
A: Estate sales and non-specialized antique malls are often overlooked by professional dealers.

**Q: Are Japanese bulk boxes worth it?**
A: Yes, Japanese "vending series" or "exclusive promo" cards are often mixed into generic Japanese bulk stacks.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-archeology-2',
    categoryId: 'authentication',
    seriesId: 'series-card-archeology',
    seriesPosition: 2,
    title: 'Authentication 101: Identifying Fake 1st Edition Base Set Cards',
    slug: 'pokemon-authentication-101-fake-1st-edition-guide',
    excerpt: 'The market is flooded with "Proxy" cards that look identical to the real thing. We provide a forensic guide to spotting the fakes before you buy.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Ffake_card_authentication_feature.png?alt=media',
    featuredImageAlt: 'Split screen comparison between an authentic and a fake 1st Edition Charizard',
    tags: ['authentication', 'fakes', 'grading', 'scams'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 3125,
    helpfulCount: 543,
    notHelpfulCount: 1,
    metaTitle: 'Spotting Fake Pokémon Cards: Authentication Guide 2026',
    metaDescription: 'Protect your investment. Our forensic guide shows you how to spot high-quality fakes using the "Light Test," "Dot Matrix Check," and "Weight Analysis."',
    content: `
# Authentication 101: Identifying Fake 1st Edition Cards

### Quick Stats (The Forensic Kit)
- **The Light Test**: Authentic cards have a black "core" layer that prevents light from passing through.
- **The Rosette Pattern**: Under 30x magnification, authentic ink forms a specific circular pattern.
- **The Font Check**: Fakes often fail on the "HP" font or the energy symbol spacing.

## The Rise of the "Super Fake"
In 2026, counterfeiters are using industrial-grade printers to create "proxies" that can fool even experienced collectors at a glance. To protect yourself, you need to move beyond "vibes" and into forensic analysis.

## 1. The Loupe Never Lies
A 30x jeweler's loupe is your most important tool. Authentic Pokémon cards are printed using a "half-tone" process that creates a rosette pattern (small circles of ink). Many fakes are printed using a standard digital process that creates a "dithered" or "smeared" look under magnification.

## 2. The Weight of Authenticity
Authentic Base Set cards weigh exactly 1.7 to 1.9 grams. Many high-quality fakes use a different paper core (blue or white) instead of the authentic black core, leading to a weight discrepancy. A simple jeweler's scale can save you thousands of dollars.

## 3. The Light Test
Hold the card up to a bright LED. Authentic cards should be almost entirely opaque. If you can clearly see the "Pokéball" on the back through the front of the card, the paper stock is too thin, and the card is a fake.

## The Verdict
In high-end TCG investment, "Trust but Verify" is the only rule. If a deal for a 1st Edition Charizard seems too good to be true, it almost certainly is.

## FAQ
**Q: Can fakes be graded?**
A: Occasionally, a very high-quality fake might slip through a lower-tier grading company, but PSA, BGS, and CGC have forensic labs specifically designed to catch these.

**Q: Does a "Proxy" have any value?**
A: No. Proxies are essentially sophisticated counterfeits and have zero resale value in the collector market.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  }
];

async function seedArcheology() {
  console.log('--- Starting Vintage Archeology Seeding ---');
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
    console.log(`✓ Archeology Post Seeded: ${post.title}`);
    createdPosts++;
  }

  console.log(`--- Seeding Complete! ${createdSeries} Series, ${createdPosts} Archeology Posts. ---`);
}

seedArcheology().catch(console.error);
