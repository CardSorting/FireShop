import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * [LAYER: INFRASTRUCTURE]
 * Seeding Script for TCG Care, Preservation, and Tech Series
 */

const BLOG_SERIES = [
  {
    id: 'series-tcg-care',
    title: 'The Preserved Collection: Mastering TCG Care',
    slug: 'preserved-collection-tcg-care-tech',
    description: 'Expert guides on digital archiving, archival storage, and museum-grade display techniques for high-value card collections.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fuv_display_feature.png?alt=media',
    categoryIds: ['tech', 'preservation'],
    articleCount: 2,
    difficulty: 'intermediate',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const BLOG_POSTS = [
  {
    id: 'ai-tech-1',
    categoryId: 'tech',
    seriesId: 'series-tcg-care',
    seriesPosition: 1,
    title: 'Digital Archiving: The Best High-DPI Scanners for Holo Cards (2026)',
    slug: 'best-high-dpi-scanners-pokemon-yugioh-2026',
    excerpt: 'Capturing the perfect scan of a holographic card requires more than just a smartphone. We review the top high-DPI flatbed scanners for digital collectors.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Ftcg_scanner_feature.png?alt=media',
    featuredImageAlt: 'Holographic Charizard card being scanned on a high-DPI flatbed scanner',
    tags: ['tech', 'archiving', 'scanners', 'digital-collection'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 892,
    helpfulCount: 124,
    notHelpfulCount: 1,
    metaTitle: 'Best TCG Scanners 2026: High-DPI Archiving Guide',
    metaDescription: 'Stop using your phone for card scans. We review the best Epson and Canon scanners for capturing the perfect holographic depth in your TCG collection.',
    content: `
# Digital Archiving: The Best High-DPI Scanners for Holo Cards

### Key Takeaways (The Pro Specs)
- **Primary Goal**: Capturing surface texture and holographic "depth" without glare.
- **Recommended Model**: Epson Perfection V600 (The industry standard).
- **Settings**: 600-1200 DPI, 48-bit color depth, and specialized "Holographic" color profiles.

## Introduction
In 2026, a high-quality digital scan is as important as the physical card itself. Whether you're selling on a high-end marketplace or building a digital archive of your "Grails," a smartphone photo simply won't cut it. To capture the precise centration and surface condition of a Gem Mint 10, you need the steady, uniform light of a high-DPI flatbed scanner.

## Why Flatbeds Win Over Smartphones
Smartphones introduce "keystone" distortion and uneven lighting. A flatbed scanner ensures the card is perfectly parallel to the sensor, allowing for pixel-perfect measurements of borders. For holographic cards, the CCD sensor in higher-end scanners (like the Epson V600) handles the "rainbow" effect much better than the CMOS sensors in phones.

## Top 3 Scanners for 2026
1. **Epson Perfection V600**: The gold standard. Incredible depth of field for graded slabs.
2. **Canon CanoScan 9000F Mark II**: Exceptional color accuracy for Pokémon "Full Art" cards.
3. **Epson Expression 12000XL**: For the professional high-volume archiver.

## The Verdict
If you are serious about TCG investment, a dedicated scanner is your best friend. It provides the transparency and professionalism that buyers expect in 2026.

## FAQ
**Q: Should I scan in the slab?**
A: Yes, but ensure your scanner has a high enough depth of field to focus through the plastic.

**Q: What DPI is best?**
A: 600 DPI is standard for web use; 1200 DPI is required for high-resolution archival and print.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-tech-2',
    categoryId: 'preservation',
    seriesId: 'series-tcg-care',
    seriesPosition: 2,
    title: 'UV Protection: How to Display Your Grails Without Fading',
    slug: 'uv-protection-tcg-display-guide',
    excerpt: 'Sunlight is the enemy of rare cards. We explore the science of UV protection and the best museum-grade display cases for your collection.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fuv_display_feature.png?alt=media',
    featuredImageAlt: 'Luxury LED-lit card display case with UV-protected glass',
    tags: ['preservation', 'display', 'uv-protection', 'collecting'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 1205,
    helpfulCount: 189,
    notHelpfulCount: 3,
    metaTitle: 'TCG UV Protection: How to Display Rare Cards Safely',
    metaDescription: 'Don\'t let your Charizard fade. Learn about museum-grade UV protection, LED lighting, and archival display cases for high-end TCG collections.',
    content: `
# UV Protection: How to Display Your Grails Safely

### Quick Stats (The UV Factor)
- **Main Threat**: UV-A and UV-B rays (from both sun and cheap bulbs).
- **The Result**: Pigment breakdown, paper yellowing, and "Sun-Bleached" errors.
- **The Solution**: 99% UV-Filtering glass/acrylic and UV-free LED lighting.

## The Silent Killer: Sunlight
We’ve all seen it: a once-vibrant Base Set Charizard that now looks like a pale ghost. UV damage is irreversible. If you want to display your cards, "standard" glass or acrylic is not enough. Most standard cases only filter about 60-70% of UV rays, which still allows for significant fading over a few years.

## Museum-Grade Display Techniques
Professional museums use **Conservation Grade** materials. For collectors, this means looking for cases labeled with "99% UV Protection." Brands like *Ultra Pro* and *Ultimate Guard* offer specific UV-resistant slabs, but for wall displays, you should look for museum-grade acrylic (like Optium).

## Lighting Your Collection
Never use incandescent or fluorescent bulbs near your cards. They emit UV radiation. Use high-CRI (90+) LED strips. They provide beautiful, uniform light without the heat or UV output that degrades card stock.

## The Verdict
Displaying your cards is the best way to enjoy them, but do it right. Invest in UV protection now, or pay the price in lost resale value later.

## FAQ
**Q: Can I display cards in a room with a window?**
A: Only if you have UV-filtering film on the window or the card is in a 99% UV-protected case.

**Q: Do graded slabs (PSA/BGS) have UV protection?**
A: Standard slabs offer some protection, but they are not 99% UV-filtering. Always add an extra layer of protection if displaying in light.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  }
];

async function seedTech() {
  console.log('--- Starting TCG Tech & Care Seeding ---');
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
    console.log(`✓ Tech Post Seeded: ${post.title}`);
    createdPosts++;
  }

  console.log(`--- Seeding Complete! ${createdSeries} Series, ${createdPosts} Tech Posts. ---`);
}

seedTech().catch(console.error);
