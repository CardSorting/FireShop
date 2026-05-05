import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * [LAYER: INFRASTRUCTURE]
 * Seeding Script for Geek Aesthetics & Battle Station Series
 */

const BLOG_SERIES = [
  {
    id: 'series-geek-aesthetics',
    title: 'Geek Aesthetics: The Ultimate Battle Station',
    slug: 'geek-aesthetics-ultimate-battle-station',
    description: 'Elevating your gaming and collecting environment with custom tech, premium peripherals, and immersive ambient design.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fcustom_keyboard_battle_station_feature.png?alt=media',
    categoryIds: ['tech', 'gaming-setup'],
    articleCount: 2,
    difficulty: 'beginner',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const BLOG_POSTS = [
  {
    id: 'ai-aesthetics-1',
    categoryId: 'tech',
    seriesId: 'series-geek-aesthetics',
    seriesPosition: 1,
    title: 'Custom Keyboards: The Best Linear Switches for High-Speed Gaming (2026)',
    slug: 'best-linear-switches-custom-keyboards-gaming-2026',
    excerpt: 'Mechanical keyboards are the heart of any battle station. We review the top linear switches of 2026 for that perfect "thock" and lightning-fast response.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fcustom_keyboard_battle_station_feature.png?alt=media',
    featuredImageAlt: 'Premium custom mechanical keyboard with glowing RGB and Japanese keycaps',
    tags: ['keyboards', 'tech', 'gaming', 'peripherals'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 3120,
    helpfulCount: 456,
    notHelpfulCount: 4,
    metaTitle: 'Best Linear Switches 2026: Custom Keyboard Guide',
    metaDescription: 'Upgrade your typing experience. We review the best custom mechanical keyboard switches for gamers and collectors who value aesthetics and performance.',
    content: `
# Custom Keyboards: The Best Linear Switches for 2026

### Key Takeaways (The Switch Specs)
- **Top Pick**: "DreamBees Silks" (Ultra-smooth factory lubed).
- **Material**: POM stems for long-term durability and sound profile.
- **Actuation**: 45g for the perfect balance of speed and accidental-press prevention.

## Introduction
A collector's desk is a temple. And at the center of that temple sits the mechanical keyboard. In 2026, we've moved beyond standard "off-the-shelf" boards. The community has embraced custom builds that sound as good as they look. If you're tired of the "clack" and want that deep, satisfying "thock," the choice of switch is everything.

## Why Linear?
For gamers and high-velocity workers, linear switches are king. They provide a smooth, consistent keystroke without the tactile "bump" of Browns or the "click" of Blues. This allows for faster double-taps and a cleaner sound profile that doesn't distract from your gaming immersion.

## The 2026 Top Picks
1. **DreamBees Silks**: Our custom-designed switch featuring a long-pole stem for a snappier return.
2. **Gateron Oil Kings**: The refined classic, still dominating in smoothness.
3. **NovelKeys Creams (V3)**: For those who love the self-lubricating properties of full POM housing.

## The Verdict
Your keyboard is the primary touchpoint of your digital life. Don't settle for scratchy, hollow switches. Invest in a linear build that makes every keystroke feel like a premium experience.

## FAQ
**Q: Do I need to lube my switches?**
A: In 2026, many high-end switches come "factory lubed" with incredible precision. Only manual-lube if you are looking for a very specific, ultra-muted sound.

**Q: What is "Thock"?**
A: It's the deep, low-frequency sound of a well-built mechanical keyboard, usually achieved through a combination of switch choice, plate material, and case foam.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-aesthetics-2',
    categoryId: 'gaming-setup',
    seriesId: 'series-geek-aesthetics',
    seriesPosition: 2,
    title: 'Ambient Lighting: How to Sync Your RGB with Your Card Collection',
    slug: 'rgb-ambient-lighting-sync-tcg-collection',
    excerpt: 'Your battle station shouldn\'t just glow—it should respond. We show you how to use smart lighting to highlight your TCG grails and sync with your games.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Frgb_lighting_setup_feature.png?alt=media',
    featuredImageAlt: 'Gaming battle station with purple and teal ambient RGB lighting synced to a card display',
    tags: ['lighting', 'rgb', 'gaming-setup', 'interior-design'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 2150,
    helpfulCount: 289,
    notHelpfulCount: 8,
    metaTitle: 'TCG Lighting Guide: Syncing RGB with Your Collection',
    metaDescription: 'Create the ultimate immersive environment. Learn how to use Philips Hue and Govee to sync your gaming lights with your rare card displays.',
    content: `
# Ambient Lighting: Sync Your RGB with Your Collection

### Quick Stats (The Glow Specs)
- **Best Ecosystem**: Philips Hue (for reliability) or Govee (for affordability).
- **The Technique**: Using "Area Sync" to reflect the colors of your cards onto the surrounding walls.
- **The Rule**: Cool tones for modern tech; Warm tones for vintage TCG grails.

## The Immersive Environment
A battle station is more than a desk—it's a portal. In 2026, the trend has shifted from "rainbow vomit" to "Dynamic Thematic Lighting." This means your lights respond to what's happening on your screen or the physical assets on your desk.

## Highlighting the Grails
If you have a PSA 10 Charizard on your shelf, why is it in the dark? We recommend using focused, UV-free LED spotlights that integrate with your smart home. By setting a "Display Scene," you can dim the room and have a subtle amber glow hit your vintage cards, making the holographic foil pop.

## Software Integration
Using tools like SignalRGB or Corsair iCUE, you can create custom "Profiles" for specific games or TCG themes. Playing Pokémon? Your whole room can shift to a vibrant red and white. Diving into the dark lore of Elden Ring? Deep purples and blacks will fill your peripheral vision.

## The Verdict
Lighting is the most underrated part of a gaming setup. It’s the "vibe" that ties everything together. Spend the time to configure your zones, and your battle station will feel like a professional studio.

## FAQ
**Q: Does RGB use a lot of electricity?**
A: Modern LED strips are incredibly efficient. Running a full room setup costs less than a few dollars a month.

**Q: Can I control my lights with my voice?**
A: Absolutely. Integrating with Alexa or Google Home allows for "Voice Scenes" like "Alexa, it's Game Time."
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  }
];

async function seedAesthetics() {
  console.log('--- Starting Geek Aesthetics Seeding ---');
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
    console.log(`✓ Aesthetics Post Seeded: ${post.title}`);
    createdPosts++;
  }

  console.log(`--- Seeding Complete! ${createdSeries} Series, ${createdPosts} Aesthetics Posts. ---`);
}

seedAesthetics().catch(console.error);
