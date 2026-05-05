import { adminDb } from '../src/infrastructure/firebase/admin.ts';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * [LAYER: INFRASTRUCTURE]
 * Seeding Script for SEO-Hardened AI Blog Content with Feature Images
 */

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
    content: `
# PSA vs BGS: Which is Better for Pokémon Card Grading?

### Key Takeaways
| Feature | PSA (Professional Sports Authenticator) | BGS (Beckett Grading Services) |
| :--- | :--- | :--- |
| **Resale Value** | Higher for standard 10s | Ultimate premium for Black Label 10s |
| **Grading Stricness** | High (focused on eye appeal) | Very High (sub-grades provide detail) |
| **Slab Aesthetic** | Sleek, stackable, iconic red label | Heavier, thicker, premium feel |
| **Turnaround** | Improved in 2026 | Steady, but premium pricing for speed |

## Introduction
In the high-stakes world of Pokémon TCG investing, the slab is everything. A single grade difference can mean thousands of dollars in market value. As collectors, we often find ourselves at a crossroads: **PSA or BGS?** 

## The Verdict
- **Grade with PSA if**: You want maximum liquidity and a clean, consistent look for your collection.
- **Grade with BGS if**: You have a card that is visually perfect and you are chasing the prestigious Black Label premium.
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-post-2',
    categoryId: 'yugioh',
    title: 'Infinite Forbidden: Yu-Gi-Oh! Meta Shift Analysis & Top 5 Budget Decks',
    slug: 'infinite-forbidden-meta-analysis-budget-decks',
    excerpt: 'Infinite Forbidden has arrived, and the meta is in chaos. We analyze the new power creep and provide 5 budget-friendly decklists to stay competitive.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Finfinite_forbidden_feature.png?alt=media',
    featuredImageAlt: 'Exodia emerging from a dark portal',
    tags: ['yugioh', 'meta', 'budget', 'infinite-forbidden'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 89,
    helpfulCount: 12,
    notHelpfulCount: 1,
    metaTitle: 'Infinite Forbidden Meta Analysis & Budget Decks (2026)',
    metaDescription: 'Master the new Yu-Gi-Oh! meta with our Infinite Forbidden deep-dive. Includes top-tier strategy and budget decklists.',
    content: `
# Infinite Forbidden: Yu-Gi-Oh! Meta Shift Analysis
... (truncated for brevity)
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  },
  {
    id: 'ai-post-3',
    categoryId: 'geek',
    title: 'The Rise of Custom Mechanical Keyboards: A Geek Culture Aesthetic Guide',
    slug: 'custom-mechanical-keyboards-geek-aesthetic-guide',
    excerpt: 'Custom mechanical keyboards have evolved from niche hobbyist tools to the ultimate geek culture aesthetic. We review why you need one for your setup.',
    featuredImageUrl: 'https://firebasestorage.googleapis.com/v0/b/shopmore-1e34b.firebasestorage.app/o/blog%2Fcustom_keyboard_feature.png?alt=media',
    featuredImageAlt: 'Minimalist custom mechanical keyboard setup',
    tags: ['geek', 'keyboards', 'desk-setup', 'aesthetic'],
    type: 'blog',
    status: 'published',
    authorId: 'bjOlivy9O7cidn2GYQCAbeszBKF3',
    viewCount: 112,
    helpfulCount: 15,
    notHelpfulCount: 0,
    metaTitle: 'Custom Mechanical Keyboards: Aesthetic & Performance Guide (2026)',
    metaDescription: 'Explore the world of custom mechanical keyboards. From switches to keycaps, discover how to build the perfect geek aesthetic desk setup.',
    content: `
# The Rise of Custom Mechanical Keyboards: A Geek Culture Aesthetic Guide
... (truncated for brevity)
    `,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date()
  }
];

async function seedBlog() {
  console.log('--- Starting Blog Seeding (SEO-Hardened AI Content with Images) ---');
  let created = 0;

  for (const post of BLOG_POSTS) {
    const postRef = adminDb.collection('knowledgebase_articles').doc(post.id);
    
    await postRef.set({
      ...post,
      createdAt: Timestamp.fromDate(post.createdAt),
      updatedAt: Timestamp.fromDate(post.updatedAt),
      publishedAt: post.publishedAt ? Timestamp.fromDate(post.publishedAt) : null,
    }, { merge: true });
    
    console.log(`✓ Seeded: ${post.title}`);
    created++;
  }

  console.log(`--- Seeding Complete! Created ${created} posts. ---`);
}

seedBlog().catch(console.error);
