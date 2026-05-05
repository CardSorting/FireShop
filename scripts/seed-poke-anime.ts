import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * [LAYER: INFRASTRUCTURE]
 * Seeding Script for Pokémon Anime-Inspired Deck Lists
 */

const BLOG_SERIES = [
  {
    id: 'series-anime-pokemon-decks',
    title: 'Anime Battle Royale: Decks of the Champions',
    slug: 'anime-battle-royale-pokemon-champions-decks',
    description: 'Bringing the legendary teams of the Pokémon anime to life with modern, competitive TCG deck lists.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fanime_pikachu_deck_feature.png?alt=media',
    categoryIds: ['pokemon-decks', 'anime'],
    articleCount: 2,
    difficulty: 'intermediate',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const BLOG_POSTS = [
  {
    id: 'ai-poke-anime-1',
    categoryId: 'pokemon-decks',
    seriesId: 'series-anime-pokemon-decks',
    seriesPosition: 1,
    title: 'Ash’s Pikachu: How to Build a Competitive Lightning Deck in 2026',
    slug: 'ash-ketchum-pikachu-competitive-lightning-deck-2026',
    excerpt: 'Pikachu isn\'t just a mascot—it\'s a powerhouse. We build a competitive 2026-legal Lightning deck inspired by Ash Ketchum’s greatest victories.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fanime_pikachu_deck_feature.png?alt=media',
    featuredImageAlt: 'Heroic Pikachu in a Pokémon arena with glowing Lightning energy',
    tags: ['pokemon', 'pikachu', 'ash-ketchum', 'deck-list'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 5678,
    helpfulCount: 742,
    notHelpfulCount: 12,
    metaTitle: 'Ash’s Pikachu Deck Guide: Competitive 2026 Pokémon TCG',
    metaDescription: 'Unleash the thunder. Build a competitive Pokémon TCG deck around Pikachu ex, inspired by Ash Ketchum’s legendary anime journey.',
    content: `
# Ash’s Pikachu: Building a Competitive 2026 Deck

### Key Takeaways (The Champion's Build)
- **Core Card**: Pikachu ex (Scarlet & Violet: Paldea Evolved).
- **Strategy**: High-speed energy acceleration and "Lightning Strike" burst damage.
- **Support**: Raichu V for late-game cleanup.

## Introduction
"Pikachu, I choose you!" For over 25 years, these words have defined the Pokémon franchise. But in the 2026 TCG meta, Pikachu is more than just a companion—it’s a Tier 1 threat. This deck list takes inspiration from Ash’s "Never Give Up" spirit, utilizing high-velocity energy movement and explosive attacks to overwhelm your opponent.

## The Strategy: Volt Velocity
The key to Ash’s success was always speed and agility. In the TCG, this translates to **Energy Acceleration**. We use "Magical Leaf" Celebi (as a tribute to the 4th movie) and "Electric Generator" to pile Lightning energy onto Pikachu ex as early as Turn 1.

## The Deck List (2026 Standard)
- **3x Pikachu ex** (Main Attacker)
- **2x Raichu V** (Secondary Hitter)
- **4x Electric Generator** (Energy Accel)
- **2x Boss's Orders** (Targeting)
- **3x Rare Candy** (Fast Evolution)

## The Verdict
Building an anime-inspired deck doesn't mean sacrificing competitive viability. This Pikachu build is fast, consistent, and carries the legacy of the World Champion.

## FAQ
**Q: Can I use the original Base Set Pikachu?**
A: Not in the 2026 Standard format, but it’s a great choice for "Vintage Retro" play!

**Q: What is Pikachu’s biggest counter?**
A: Fighting-type decks (like Machamp ex) remain the primary threat due to type weakness.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-poke-anime-2',
    categoryId: 'pokemon-decks',
    seriesId: 'series-anime-pokemon-decks',
    seriesPosition: 2,
    title: 'The Rival’s Edge: A Blastoise Deck List Inspired by Gary Oak',
    slug: 'gary-oak-blastoise-competitive-water-deck-2026',
    excerpt: 'Gary Oak always stayed one step ahead. We build a high-pressure Water-type deck that mirrors the tactical dominance of Ash’s original rival.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fanime_blastoise_deck_feature.png?alt=media',
    featuredImageAlt: 'Blastoise unleashing water cannons in a dramatic stadium setting',
    tags: ['pokemon', 'blastoise', 'gary-oak', 'rivals', 'deck-list'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 4231,
    helpfulCount: 512,
    notHelpfulCount: 5,
    metaTitle: 'Gary Oak Blastoise Deck Guide: Competitive 2026 Water Meta',
    metaDescription: 'Dominate the field like Gary Oak. This Blastoise ex deck list focuses on board control and massive "Hydro Pump" damage in the 2026 meta.',
    content: `
# The Rival’s Edge: A Blastoise Deck List Inspired by Gary Oak

### Quick Stats (The Rival's Strategy)
- **Core Card**: Blastoise ex (S&V: 151).
- **Strategy**: Board control, high HP tanking, and massive "Hydro Pump" scaling.
- **Style**: Tactical, arrogant (in a good way), and dominant.

## Introduction
Gary Oak (Blue) was the ultimate challenge. He didn't just want to win; he wanted to dominate. This deck mirrors that philosophy. Built around the sheer defensive and offensive power of Blastoise ex, this list is designed to out-resource and out-tank anything the meta can throw at you.

## The Strategy: Shell Defense
Blastoise ex has one of the highest HP pools in the 2026 Standard format. By using "Energy Retrieval" and "Baxcalibur" (as a modern engine), you can dump infinite Water energy onto Blastoise, making his attack damage practically uncapped.

## The Deck List (2026 Standard)
- **3x Blastoise ex** (The Tank)
- **3x Baxcalibur** (Energy Engine)
- **4x Irida** (Search Utility)
- **2x Lake Acuity** (Defensive Stadium)
- **4x Superior Energy Retrieval** (Infinite Fuel)

## The Verdict
This is a deck for players who enjoy control. Like Gary, you want to force your opponent to play your game. With 330 HP and massive damage output, Blastoise ex is the perfect vessel for that tactical arrogance.

## FAQ
**Q: Is Blastoise better than Charizard in the current meta?**
A: Charizard has more raw speed, but Blastoise has better survivability and energy-scaling potential.

**Q: Can I run Squirtle with sunglasses?**
A: If you have the promo card, absolutely! It’s the ultimate style flex.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  }
];

async function seedPokeAnime() {
  console.log('--- Starting Pokémon Anime Deck Seeding ---');
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
    console.log(`✓ PokeAnime Post Seeded: ${post.title}`);
    createdPosts++;
  }

  console.log(`--- Seeding Complete! ${createdSeries} Series, ${createdPosts} PokeAnime Posts. ---`);
}

seedPokeAnime().catch(console.error);
