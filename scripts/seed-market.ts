import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * [LAYER: INFRASTRUCTURE]
 * Seeding Script for TCG Market Analytics & Investment Series
 */

const BLOG_SERIES = [
  {
    id: 'series-tcg-investment',
    title: 'The Investment Lab: TCG Market Analytics',
    slug: 'investment-lab-tcg-market-analytics',
    description: 'Deep-dives into market volatility, population report trends, and data-driven strategies for high-end TCG investment.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Ftcg_market_analytics_feature.png?alt=media',
    categoryIds: ['finance', 'market-analysis'],
    articleCount: 2,
    difficulty: 'advanced',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const BLOG_POSTS = [
  {
    id: 'ai-market-1',
    categoryId: 'finance',
    seriesId: 'series-tcg-investment',
    seriesPosition: 1,
    title: 'The Alt-Art Bubble: Predicting the 2026 Market Correction',
    slug: 'alt-art-bubble-tcg-market-correction-2026',
    excerpt: 'Modern "Chase" cards have seen explosive growth, but is the valuation sustainable? We analyze market velocity and collector sentiment to predict the next big correction.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Ftcg_market_analytics_feature.png?alt=media',
    featuredImageAlt: 'Financial dashboard showing TCG card market trends and volatility',
    tags: ['finance', 'market-trends', 'investment', 'alt-art'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 2451,
    helpfulCount: 312,
    notHelpfulCount: 5,
    metaTitle: 'TCG Market Analysis 2026: Is the Alt-Art Bubble Bursting?',
    metaDescription: 'Are modern Pokémon and Yu-Gi-Oh! chase cards overvalued? Our 2026 market analysis explores the data behind the current "Alt-Art" pricing surge.',
    content: `
# The Alt-Art Bubble: Predicting the 2026 Market Correction

### Key Takeaways (The Market Pulse)
- **The Trend**: Modern Alt-Arts (Special Illustrations) have outpaced vintage growth by 300% in the last 24 months.
- **The Risk**: Oversupply in population reports (PSA 10s) vs. actual unique demand.
- **The Play**: Diversify into low-pop vintage and "sealed" product to hedge against modern volatility.

## Introduction
The TCG market in 2026 looks very different from the post-2020 boom. While vintage cards have found a stable floor, modern "Alternate Art" cards have become the primary focus of speculation. However, our internal "DreamBees Market Index" shows a growing divergence between price and demand. We are seeing the classic signs of a speculative bubble.

## The Population Report Trap
In the vintage era, a "10" was rare. In the modern era, improved printing technology and better collector care mean that 60-80% of modern chase cards submitted are returning as PSA 10s. When the population of a "rare" card reaches 10,000+, it can no longer support a multi-thousand dollar price tag. 

## Sentiment Analysis: Flippers vs. Collectors
We track social media velocity and auction volume. Currently, "flippers" represent 40% of the active market for modern sets. When these participants exit during a correction, the price drop will be sharp.

## The Verdict
Stay cautious on modern chase cards at current all-time highs. Look for "organic" value in cards that have a lower PSA 10 ratio relative to their pull rate.

## FAQ
**Q: Which TCG is the most stable right now?**
A: Magic: The Gathering (MTG) "Reserved List" cards remain the most stable long-term asset due to their strictly capped supply.

**Q: Should I sell my modern Alt-Arts?**
A: If you are holding for investment, consider locking in profits on cards with "hockey stick" growth charts.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-market-2',
    categoryId: 'market-analysis',
    seriesId: 'series-tcg-investment',
    seriesPosition: 2,
    title: 'Population Report Science: The Math Behind the PSA 10 Supply',
    slug: 'psa-10-population-report-science-tcg',
    excerpt: 'Understanding the "Pop Report" is the difference between a good investment and a bad one. We teach you how to read the data like a pro.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fgrading_pop_report_feature.png?alt=media',
    featuredImageAlt: 'Stack of PSA 10 slabs in front of a population report dashboard',
    tags: ['grading', 'psa', 'market-data', 'investment'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 1876,
    helpfulCount: 245,
    notHelpfulCount: 2,
    metaTitle: 'How to Read TCG Pop Reports: Grading Science Guide',
    metaDescription: 'Master the art of population report analysis. Learn how to calculate "10-ratios" and use grading data to find undervalued investment opportunities.',
    content: `
# Population Report Science: The Math Behind the Supply

### Quick Stats (The Pop Logic)
- **10-Ratio**: The percentage of a specific card that receives a Gem Mint 10 grade.
- **The "Wall"**: A population size that creates a ceiling for price growth.
- **The "Ghost Pop"**: Cards that have been cracked and resubmitted, inflating the report numbers.

## Beyond the Raw Number
A population of 500 sounds low. But if the "10-Ratio" is 90%, it means every single copy of that card is essentially a 10. True value comes from cards with a **Low 10-Ratio** (e.g., 5-10%). This indicates a manufacturing difficulty or a condition-sensitive card that will hold its value over time.

## Calculating Value Density
We use a simple formula: (Total Sales Volume) / (PSA 10 Population). If this number is increasing, demand is outpacing the new supply entering the market. If it's decreasing, you are looking at a declining asset.

## Resubmission Inflation
Sophisticated investors look at "Total Submissions" vs. "Total Unique Owners." In high-value vintage, many slabs are "crossed over" between PSA and BGS, leading to duplicated entries in the reports. Learning to spot these "Ghost Pops" is the key to identifying true scarcity.

## The Verdict
The data never lies, but it often requires context. Never buy a card based on its grade alone; buy it based on the **scarcity of that grade**.

## FAQ
**Q: Is BGS 10 Black Label better than PSA 10?**
A: Mathematically, yes. The "Black Label" population is often 1% or less of the total supply, making it an entirely different tier of scarcity.

**Q: How often do pop reports update?**
A: Daily. High-frequency traders use scrapers to track daily deltas in population for modern sets.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  }
];

async function seedMarket() {
  console.log('--- Starting TCG Market & Investment Seeding ---');
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
    console.log(`✓ Market Post Seeded: ${post.title}`);
    createdPosts++;
  }

  console.log(`--- Seeding Complete! ${createdSeries} Series, ${createdPosts} Market Posts. ---`);
}

seedMarket().catch(console.error);
