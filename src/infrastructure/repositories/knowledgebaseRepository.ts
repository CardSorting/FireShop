import type { KnowledgebaseArticle, KnowledgebaseCategory } from '@domain/models';

const CATEGORIES: KnowledgebaseCategory[] = [
  { 
    id: 'cat-orders', 
    name: 'Orders & Shipping', 
    slug: 'orders-shipping', 
    description: 'Track orders, change delivery addresses, and shipping times.', 
    icon: 'Package', 
    articleCount: 5 
  },
  { 
    id: 'cat-returns', 
    name: 'Returns & Refunds', 
    slug: 'returns-refunds', 
    description: 'How to return items and when you will get your money back.', 
    icon: 'RefreshCcw', 
    articleCount: 3 
  },
  { 
    id: 'cat-account', 
    name: 'Account & Security', 
    slug: 'account-security', 
    description: 'Manage your profile, password, and security settings.', 
    icon: 'User', 
    articleCount: 4 
  },
  { 
    id: 'cat-products', 
    name: 'Product Information', 
    slug: 'product-info', 
    description: 'Condition guides, authenticity, and pre-order info.', 
    icon: 'Layers3', 
    articleCount: 6 
  },
];

const ARTICLES: KnowledgebaseArticle[] = [
  {
    id: 'art-1',
    categoryId: 'cat-orders',
    categoryName: 'Orders & Shipping',
    title: 'How can I track my order?',
    slug: 'track-my-order',
    excerpt: 'Find out how to follow your package from our warehouse to your door.',
    content: `
# Tracking Your Order

Once your order has been shipped, you will receive an email with a tracking number and a link to the carrier's website.

## Steps to track:
1. Log in to your **Account**.
2. Go to **Orders**.
3. Click on the order you wish to track.
4. Click the **Track Package** button.

Alternatively, you can use the tracking link provided in your shipping confirmation email.

### Still need help?
If your tracking information hasn't updated in 48 hours, please contact our support team.
    `,
    viewCount: 1250,
    helpfulCount: 450,
    notHelpfulCount: 12,
    tags: ['tracking', 'shipping', 'delivery'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-05-20'),
  },
  {
    id: 'art-2',
    categoryId: 'cat-returns',
    categoryName: 'Returns & Refunds',
    title: 'What is your return policy?',
    slug: 'return-policy',
    excerpt: 'Learn about our 30-day return policy for unopened items.',
    content: `
# Return Policy

We want you to be completely satisfied with your purchase. If you change your mind, you can return most items within 30 days of delivery.

## Conditions for Return:
- Items must be in their **original, unopened packaging**.
- Singles must be in the same condition as received and still in their security seal if applicable.
- Returns must be initiated through our support portal.

## Non-returnable Items:
- Opened booster packs or boxes.
- Gift cards.
- Final sale items.

### Refund Process:
Once we receive and inspect your return, your refund will be processed back to your original payment method within 5-7 business days.
    `,
    viewCount: 890,
    helpfulCount: 320,
    notHelpfulCount: 45,
    tags: ['returns', 'refunds', 'policy'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'art-3',
    categoryId: 'cat-products',
    categoryName: 'Product Information',
    title: 'Trading Card Condition Guide',
    slug: 'condition-guide',
    excerpt: 'Detailed breakdown of how we grade our singles (Near Mint, Lightly Played, etc.)',
    content: `
# Card Condition Guide

To ensure you know exactly what you are buying, we use a standardized grading system for all single cards.

## Near Mint (NM)
Cards in Near Mint condition show minimal to no wear from shuffling or play. They may have a tiny speck or two but are generally indistinguishable from cards fresh out of a pack.

## Lightly Played (LP)
Lightly Played cards may have minor border or corner wear, or small scratches/scuffs. There are no major defects like creases or water damage.

## Moderately Played (MP)
Moderately Played cards show significant wear. Border and corner wear are obvious, and there may be some whitening or minor surface damage.

## Heavily Played (HP)
Heavily Played cards show severe wear but are still tournament legal in a sleeve. They may have creases or heavy whitening.

### Authenticity Guarantee
All cards are inspected by our experts to guarantee 100% authenticity.
    `,
    viewCount: 3400,
    helpfulCount: 1200,
    notHelpfulCount: 5,
    tags: ['grading', 'condition', 'singles', 'authenticity'],
    createdAt: new Date('2023-11-20'),
    updatedAt: new Date('2024-04-15'),
  }
];

export const knowledgebaseRepository = {
  async getCategories() {
    return CATEGORIES;
  },

  async getCategoryBySlug(slug: string) {
    return CATEGORIES.find(c => c.slug === slug) || null;
  },

  async getArticles(categoryId?: string) {
    if (categoryId) {
      return ARTICLES.filter(a => a.categoryId === categoryId);
    }
    return ARTICLES;
  },

  async getArticleBySlug(slug: string) {
    return ARTICLES.find(a => a.slug === slug) || null;
  },

  async searchArticles(query: string) {
    const q = query.toLowerCase();
    return ARTICLES.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.content.toLowerCase().includes(q) ||
      a.tags?.some(t => t.toLowerCase().includes(q))
    );
  },

  async addFeedback(articleId: string, isHelpful: boolean, userId?: string) {
    const { getSQLiteDB } = await import('../sqlite/database');
    const db = getSQLiteDB();
    await db.insertInto('support_article_feedback').values({
      id: crypto.randomUUID(),
      articleId,
      isHelpful: isHelpful ? 1 : 0,
      userId: userId || null,
      createdAt: new Date().toISOString()
    }).execute();
  }
};
