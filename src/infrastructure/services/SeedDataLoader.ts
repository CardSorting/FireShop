/**
 * [LAYER: INFRASTRUCTURE]
 * Industrialized Seeding Infrastructure for DreamBeesArt.
 * Features: Admin SDK Integration, Forensic Lifecycle Seeding, and Relational Sovereignty.
 * Firestore Admin Version.
 */
import type { 
  ProductDraft, 
  OrderStatus, 
  SupportTicket, 
  KnowledgebaseCategory, 
  KnowledgebaseArticle,
  Supplier,
  InventoryLocation,
  Discount,
  OrderItem
} from '@domain/models';
import { logger } from '@utils/logger';
import { adminAuth, adminDb } from '../firebase/admin';
import { Timestamp, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import crypto from 'crypto';

// ─────────────────────────────────────────────
// COMPREHENSIVE MOCK DATA
// ─────────────────────────────────────────────

const INITIAL_CATALOG: ProductDraft[] = [
  {
    name: 'Scarlet & Violet Booster Box',
    description: 'A sealed booster box containing 36 packs from the Scarlet & Violet expansion.',
    price: 14999,
    category: 'box',
    productType: 'Trading Cards',
    stock: 25,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400',
    set: 'Scarlet & Violet',
    sku: 'SV-BB-001',
    handle: 'scarlet-violet-booster-box',
    collections: ['new', 'bestsellers'],
    trackQuantity: true,
    physicalItem: true,
    weightGrams: 800,
    media: [
      { id: 'med-1', url: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=800', altText: 'Front View', position: 1, createdAt: new Date() },
      { id: 'med-2', url: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=600', altText: 'Side View', position: 2, createdAt: new Date() }
    ],
  },
  {
    name: 'Charizard EX (Holo)',
    description: 'Ultra rare holographic Charizard EX card. Near mint condition.',
    price: 29999,
    category: 'single',
    productType: 'Trading Cards',
    stock: 3,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1613773827290-e46feb889f6d?w=400',
    set: 'XY Evolutions',
    rarity: 'holo',
    sku: 'XY-CHZ-EX',
    handle: 'charizard-ex-holo',
    collections: ['new', 'artist-cards'],
    trackQuantity: true,
    physicalItem: true,
    weightGrams: 5,
    media: [],
  },
  {
    name: 'Custom Playmat (POD)',
    description: 'High-quality neoprene playmat with custom printed designs.',
    price: 2499,
    category: 'accessory',
    productType: 'Accessories',
    stock: 0,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1611083360739-bdad6e0eb1fa?w=400',
    handle: 'custom-playmat-pod',
    collections: ['accessories', 'sale'],
    hasVariants: true,
    options: [
      { id: 'opt-size', productId: '', name: 'Size', position: 1, values: ['Standard', 'XL'] },
      { id: 'opt-finish', productId: '', name: 'Finish', position: 2, values: ['Matte', 'Stitched Edge'] }
    ],
    variants: [
      { id: 'var-1', productId: '', title: 'Standard / Matte', price: 2499, stock: 100, option1: 'Standard', option2: 'Matte', sku: 'PM-STD-MT', createdAt: new Date(), updatedAt: new Date() },
      { id: 'var-2', productId: '', title: 'Standard / Stitched', price: 2999, stock: 50, option1: 'Standard', option2: 'Stitched Edge', sku: 'PM-STD-ST', createdAt: new Date(), updatedAt: new Date() },
      { id: 'var-3', productId: '', title: 'XL / Matte', price: 3499, stock: 30, option1: 'XL', option2: 'Matte', sku: 'PM-XL-MT', createdAt: new Date(), updatedAt: new Date() },
      { id: 'var-4', productId: '', title: 'XL / Stitched', price: 3999, stock: 20, option1: 'XL', option2: 'Stitched Edge', sku: 'PM-XL-ST', createdAt: new Date(), updatedAt: new Date() },
    ],
    trackQuantity: true,
    physicalItem: true,
    media: [],
  },
  {
    name: 'TCG Master Class - Digital Guide',
    description: 'A comprehensive digital guide to mastering competitive TCG play. Instant download.',
    price: 1999,
    category: 'digital',
    productType: 'Digital',
    stock: 1000,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    handle: 'tcg-master-class-digital',
    collections: ['new'],
    isDigital: true,
    digitalAssets: [
      { id: 'asset-1', name: 'Mastering_TCG_v1.pdf', url: '/downloads/guides/tcg_master_v1.pdf', size: 15420000, mimeType: 'application/pdf', createdAt: new Date() }
    ],
    sku: 'DG-TCG-MC',
    trackQuantity: false,
    physicalItem: false,
    media: [],
  }
];

const INITIAL_CUSTOMERS = [
  { email: 'admin@dreambees.art', password: 'Admin-Secure-Password123', displayName: 'System Admin', role: 'admin' as const },
  { email: 'alchemist@dreambeesai.com', password: 'Admin-Secure-Password123', displayName: 'Alchemist Admin', role: 'admin' as const },
  { email: 'ash.ketchum@palette.town', password: 'Pikapika-password123', displayName: 'Ash Ketchum', role: 'customer' as const },
  { email: 'misty.williams@cerulean.city', password: 'Starmie-password123', displayName: 'Misty Williams', role: 'customer' as const },
];

const KB_DATA = {
  categories: [
    { id: 'creator-strategies', name: 'Creator Strategies', slug: 'creator-strategies', description: 'Advanced tactics for growing your digital presence.', icon: 'rocket', articleCount: 5 },
    { id: 'order-issues', name: 'Order Issues', slug: 'order-issues', description: 'Track, change, or cancel your orders.', icon: 'package', articleCount: 2 },
    { id: 'returns-refunds', name: 'Returns & Refunds', slug: 'returns-refunds', description: 'Everything you need to know about our return policy.', icon: 'rotate-ccw', articleCount: 1 },
    { id: 'collecting-101', name: 'Collecting 101', slug: 'collecting-101', description: 'Beginner guides for aspiring art collectors.', icon: 'sparkles', articleCount: 3 },
  ],
  articles: [
    {
      id: 'art-1',
      categoryId: 'order-issues',
      title: 'How to track your order',
      slug: 'how-to-track-order',
      excerpt: 'Find out where your package is and when it will arrive.',
      content: '# How to track your order\n\nOnce your order has shipped, you will receive an email with a tracking number.',
      viewCount: 1540,
      helpfulCount: 120,
      notHelpfulCount: 5,
      tags: ['tracking', 'shipping'],
      type: 'article' as const,
      status: 'published' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};

const BLOG_DATA = {
  authors: [
    {
      id: 'auth-1',
      name: 'Leonardo DaBee',
      bio: 'Master of the canvas and the hive. 15 years experience in digital-physical hybrid art.',
      role: 'Master Artist',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      socialLinks: { twitter: '#', instagram: '#' },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'auth-2',
      name: 'Sarah Strategist',
      bio: 'Growth lead for top editorial platforms. Expert in content velocity and community building.',
      role: 'Editorial Director',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      socialLinks: { twitter: '#', instagram: '#' },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  posts: [
    {
      id: 'blog-1',
      categoryId: 'creator-strategies',
      title: 'The 7 Pillars of a Viral Blog Strategy',
      slug: 'pillars-viral-blog-strategy',
      excerpt: 'Mastering the art of content velocity and emotional resonance to break through the noise.',
      content: '## Beyond the Noise\n\nTo build a blog that resonates, you must move beyond mere information sharing. You need a strategy that balances value, personality, and platform dynamics.\n\n### 1. Emotional Resonance\nEvery viral post has one thing in common: it makes the reader feel something. Whether it is inspiration, outrage, or pure curiosity, emotion is the engine of distribution.\n\n### 2. Content Velocity\nFrequency matters, but consistency matters more. Establishing a rhythm that your audience can rely on builds trust and habit.',
      authorName: 'Sarah Strategist',
      authorId: 'auth-2',
      viewCount: 12450,
      helpfulCount: 890,
      notHelpfulCount: 24,
      tags: ['strategy', 'growth', 'viral'],
      type: 'blog' as const,
      status: 'published' as const,
      isFeatured: true,
      featuredImageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200',
      relatedProductIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date()
    },
    {
      id: 'blog-2',
      categoryId: 'creator-strategies',
      title: 'The Art of the Hook: Writing Headlines That Convert',
      slug: 'art-of-the-hook-headlines',
      excerpt: 'Your content is useless if nobody clicks. Learn the psychology of the perfect headline.',
      content: '## The First 50 Characters\n\nIn a world of infinite scrolling, your headline is your only chance to stop the thumb. A great headline promises value and creates a "curiosity gap".\n\n### The Psychology of Curiosity\nHuman brains are wired to close loops. By asking a question or hinting at a secret, you compel the reader to click to find the answer.',
      authorName: 'Sarah Strategist',
      authorId: 'auth-2',
      viewCount: 8900,
      helpfulCount: 620,
      notHelpfulCount: 15,
      tags: ['copywriting', 'headlines', 'engagement'],
      type: 'blog' as const,
      status: 'published' as const,
      isFeatured: false,
      featuredImageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800',
      relatedProductIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date()
    },
    {
      id: 'blog-3',
      categoryId: 'creator-strategies',
      title: 'Monetization for Modern Creators',
      slug: 'monetization-modern-creators',
      excerpt: 'Moving beyond ads: How to build a sustainable revenue model through memberships and digital goods.',
      content: '## Diversified Income\n\nRelying on ad revenue is a race to the bottom. Modern creators build "Value Ecosystems" where their content feeds into high-margin products like courses, workshops, and exclusive communities.',
      authorName: 'Leonardo DaBee',
      authorId: 'auth-1',
      viewCount: 5600,
      helpfulCount: 340,
      notHelpfulCount: 8,
      tags: ['monetization', 'business', 'creators'],
      type: 'blog' as const,
      status: 'published' as const,
      isFeatured: false,
      featuredImageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800',
      relatedProductIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date()
    },
    {
      id: 'blog-4',
      categoryId: 'creator-strategies',
      title: 'SEO for Humans, Not Just Algorithms',
      slug: 'seo-for-humans',
      excerpt: 'How to rank on Google without losing your voice or annoying your readers.',
      content: '## The Search Intent Revolution\n\nGoogle is getting smarter. It no longer rewards keyword stuffing; it rewards "Helpful Content". We explore how to align your creative vision with what people are actually searching for.',
      authorName: 'Sarah Strategist',
      authorId: 'auth-2',
      viewCount: 7200,
      helpfulCount: 410,
      notHelpfulCount: 12,
      tags: ['seo', 'marketing', 'visibility'],
      type: 'blog' as const,
      status: 'published' as const,
      isFeatured: false,
      featuredImageUrl: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c20a?w=800',
      relatedProductIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date()
    },
    {
      id: 'blog-5',
      categoryId: 'creator-strategies',
      title: 'Community Over Audience',
      slug: 'community-over-audience',
      excerpt: 'Why having 100 true fans is better than 10,000 passive followers.',
      content: '## The Power of Belonging\n\nAn audience watches; a community participates. We break down the tools and tactics to turn your readers into a self-sustaining ecosystem of advocates.',
      authorName: 'Leonardo DaBee',
      authorId: 'auth-1',
      viewCount: 4300,
      helpfulCount: 280,
      notHelpfulCount: 5,
      tags: ['community', 'engagement', 'branding'],
      type: 'blog' as const,
      status: 'published' as const,
      isFeatured: false,
      featuredImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
      relatedProductIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date()
    },
    {
      id: 'blog-6',
      categoryId: 'creator-strategies',
      title: 'The Substack Playbook: Transitioning from Social',
      slug: 'substack-playbook-transitioning',
      excerpt: 'How to move your audience from the algorithm-driven platforms to a sovereign newsletter.',
      content: '## The Algorithm Trap\n\nSocial media platforms own your audience. If they change the algorithm, your business dies. Substack represents a shift toward "Sovereign Content" where you own the relationship with your readers.',
      authorName: 'Sarah Strategist',
      authorId: 'auth-2',
      viewCount: 6500,
      helpfulCount: 480,
      notHelpfulCount: 9,
      tags: ['substack', 'newsletter', 'sovereignty'],
      type: 'blog' as const,
      status: 'published' as const,
      isFeatured: false,
      featuredImageUrl: 'https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?w=800',
      relatedProductIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date()
    },
    {
      id: 'blog-7',
      categoryId: 'creator-strategies',
      title: 'Micro-Blogging vs Long-Form in 2026',
      slug: 'micro-vs-longform-2026',
      excerpt: 'Which format wins in the age of AI-generated noise and short attention spans?',
      content: '## The Depth Dividend\n\nAs AI floods the web with mediocre short-form content, long-form depth becomes a competitive advantage. We explore how to balance the two for maximum reach and authority.',
      authorName: 'Leonardo DaBee',
      authorId: 'auth-1',
      viewCount: 9200,
      helpfulCount: 710,
      notHelpfulCount: 18,
      tags: ['trends', 'content', 'writing'],
      type: 'blog' as const,
      status: 'published' as const,
      isFeatured: false,
      featuredImageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800',
      relatedProductIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date()
    }
  ],
  comments: [
    {
      id: 'comm-1',
      postId: 'blog-1',
      userId: 'user-1',
      userName: 'Ash Ketchum',
      content: 'This strategy is exactly what I needed for my training journal!',
      status: 'published' as const,
      likes: 12,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};


const SUPPLIERS: Partial<Supplier>[] = [
  { 
    id: 'sup-1', 
    name: 'Kanto Distribution', 
    contactName: 'Officer Jenny', 
    email: 'jenny@kanto.gov', 
    phone: '555-0100', 
    website: 'https://kanto.gov/distribution', 
    address: { street: '1 PokeWay', city: 'Viridian City', state: 'Kanto', zip: '00102', country: 'US' } 
  },
];

const LOCATIONS: Partial<InventoryLocation>[] = [
  { id: 'loc-warehouse', name: 'Main Fulfillment Center', type: 'warehouse', address: '123 Logistics Blvd, Celadon City', isDefault: true, isActive: true },
];

const MACROS = [
  { id: 'mac-1', name: 'Shipping Status Update', content: 'Hello! Your order is currently being processed and will ship within 24 hours. You will receive a tracking number shortly.', category: 'Shipping', slug: 'shipping-update' },
];

const DISCOUNTS: Partial<Discount>[] = [
  { id: 'disc-1', code: 'WELCOME10', type: 'percentage', value: 10, status: 'active', isAutomatic: false, startsAt: new Date(), usageCount: 50 },
];

const MOCK_ACTOR = { id: 'system', email: 'admin@dreambees.art' };

// ─────────────────────────────────────────────
// SEEDING LOGIC
// ─────────────────────────────────────────────

function assertSeedingAllowed(): void {
  const allowInProduction = process.env.ALLOW_PRODUCTION_SEEDING === 'true';
  if (process.env.NODE_ENV === 'production' && !allowInProduction) {
    throw new Error('PRODUCTION_BLOCK: Seeding is prohibited in production unless ALLOW_PRODUCTION_SEEDING=true.');
  }
}

export async function seedTaxonomy(): Promise<void> {
  // Collections
  const collections = [
    { id: 'coll-new', name: 'New Drops', handle: 'new', status: 'active' as const, productCount: 10, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'coll-best', name: 'Bestsellers', handle: 'bestsellers', status: 'active' as const, productCount: 25, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'coll-sale', name: 'Sale', handle: 'sale', status: 'active' as const, productCount: 5, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'coll-cards', name: 'Artist Trading Cards', handle: 'artist-cards', status: 'active' as const, productCount: 12, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'coll-prints', name: 'Art Prints', handle: 'prints', status: 'active' as const, productCount: 8, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'coll-acc', name: 'TCG Accessories', handle: 'accessories', status: 'active' as const, productCount: 15, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
  ];

  for (const coll of collections) {
    await adminDb.collection('collections').doc(coll.id).set(coll);
  }

  // Product Categories
  const cats = [
    { id: 'cat-cards', name: 'Trading Cards', slug: 'cards', description: 'Individual singles and sets', createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { id: 'cat-acc', name: 'Accessories', slug: 'accessories', description: 'Mats, sleeves, and more', createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
  ];

  for (const cat of cats) {
    await adminDb.collection('product_categories').doc(cat.id).set(cat);
  }

  // Product Types
  const types = ['Trading Cards', 'Accessories', 'Digital', 'Apparel', 'Collectibles'];
  for (const t of types) {
    const id = crypto.randomUUID();
    await adminDb.collection('product_types').doc(id).set({ id, name: t, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
  }
}

export async function seedSuppliers(): Promise<number> {
  assertSeedingAllowed();
  let created = 0;
  
  for (const sup of SUPPLIERS) {
    await adminDb.collection('suppliers').doc(sup.id!).set({
      ...sup,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    created++;
  }
  return created;
}

export async function seedLocations(): Promise<number> {
  assertSeedingAllowed();
  let created = 0;
  
  for (const loc of LOCATIONS) {
    await adminDb.collection('inventory_locations').doc(loc.id!).set({
      ...loc,
      createdAt: Timestamp.now()
    });
    created++;
  }
  return created;
}

export async function seedInventory(): Promise<number> {
  assertSeedingAllowed();
  const productsSnap = await adminDb.collection('products').get();
  const locationsSnap = await adminDb.collection('inventory_locations').get();
  let created = 0;

  if (locationsSnap.empty) {
    logger.warn('SKIPPED: Inventory seeding skipped because no locations found.');
    return 0;
  }

  const locations = locationsSnap.docs.map((d: QueryDocumentSnapshot) => d.id);

  for (const prodDoc of productsSnap.docs) {
    const prod = prodDoc.data();
    for (const locId of locations) {
      const id = `${prodDoc.id}_${locId}`;
      await adminDb.collection('inventory_levels').doc(id).set({
        productId: prodDoc.id,
        locationId: locId,
        availableQty: Math.floor((prod.stock || 0) / locations.length),
        reservedQty: 0,
        incomingQty: 0,
        reorderPoint: 5,
        reorderQty: 20,
        updatedAt: Timestamp.now()
      });
      created++;
    }
  }
  return created;
}

export async function seedProducts(): Promise<number> {
  assertSeedingAllowed();
  let created = 0;

  for (const product of INITIAL_CATALOG) {
    const id = crypto.randomUUID();
    const now = Timestamp.now();
    await adminDb.collection('products').doc(id).set({
      ...product,
      id,
      createdAt: now,
      updatedAt: now,
      media: product.media?.map(m => ({ ...m, createdAt: now })) || []
    });
    created++;
  }
  return created;
}

export async function clearAuditLogs(): Promise<void> {
  assertSeedingAllowed();
  const snapshot = await adminDb.collection('hive_audit').get();
  const batch = adminDb.batch();
  snapshot.docs.forEach((doc: QueryDocumentSnapshot) => batch.delete(doc.ref));
  await batch.commit();
  logger.info('[Forensic] Audit logs cleared for clean chain initialization.');
}

export async function seedCustomers(): Promise<number> {
  assertSeedingAllowed();
  let created = 0;

  for (const customer of INITIAL_CUSTOMERS) {
    try {
      let uid;
      try {
        const userRecord = await adminAuth.getUserByEmail(customer.email);
        uid = userRecord.uid;
      } catch (authErr: any) {
        if (authErr.code === 'getAuth()/user-not-found') {
          const userRecord = await adminAuth.createUser({
            email: customer.email,
            password: customer.password,
            displayName: customer.displayName,
          });
          uid = userRecord.uid;
        } else {
          throw authErr;
        }
      }
      
      if (uid) {
        await adminDb.collection('users').doc(uid).set({
          email: customer.email,
          displayName: customer.displayName,
          role: customer.role || 'customer',
          createdAt: Timestamp.now(),
        });
        created++;
      }
    } catch (err) {
      logger.error(`Forensic Fault: Failed to seed customer ${customer.email}.`, err);
    }
  }
  return created;
}

export async function seedOrders(): Promise<number> {
  assertSeedingAllowed();
  const productsSnap = await adminDb.collection('products').get();
  const customersSnap = await adminDb.collection('users').where('role', '==', 'customer').get();
  
  if (productsSnap.empty || customersSnap.empty) return 0;

  const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];
  let created = 0;
  for (let i = 0; i < 5; i++) {
    try {
      const customerDoc = customersSnap.docs[Math.floor(Math.random() * customersSnap.size)];
      const prodDoc = productsSnap.docs[Math.floor(Math.random() * productsSnap.size)];
      const prod = prodDoc.data();
      
      const id = crypto.randomUUID();
      const now = Timestamp.now();
      await adminDb.collection('orders').doc(id).set({
        id,
        userId: customerDoc.id,
        items: [{ productId: prodDoc.id, name: prod.name, quantity: 1, unitPrice: prod.price }],
        total: prod.price,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        shippingAddress: { street: '123 Fake St', city: 'Springfield', state: 'IL', zip: '62704', country: 'US' },
        paymentTransactionId: `seeded_${crypto.randomUUID()}`,
        idempotencyKey: crypto.randomUUID(),
        notes: [],
        riskScore: 0,
        createdAt: now,
        updatedAt: now,
      });
      created++;
    } catch (err) {
      logger.error(`Forensic Fault: Failed to seed order iteration ${i}.`, err);
    }
  }
  return created;
}

export async function seedKnowledgebase(): Promise<number> {
  assertSeedingAllowed();
  let created = 0;
  for (const cat of KB_DATA.categories) {
    await adminDb.collection('knowledgebase_categories').doc(cat.id).set(cat);
    created++;
  }
  for (const art of KB_DATA.articles) {
    await adminDb.collection('knowledgebase_articles').doc(art.id).set({
      ...art,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    created++;
  }
  return created;
}

export async function seedBlog(): Promise<number> {
  assertSeedingAllowed();
  let created = 0;
  
  for (const auth of BLOG_DATA.authors) {
    await adminDb.collection('blog_authors').doc(auth.id).set({
      ...auth,
      createdAt: Timestamp.fromDate(auth.createdAt),
      updatedAt: Timestamp.fromDate(auth.updatedAt)
    });
    created++;
  }
  
  for (const post of BLOG_DATA.posts) {
    // Get actual product IDs for relations if possible
    const productsSnap = await adminDb.collection('products').limit(2).get();
    const prodIds = productsSnap.docs.map((d: any) => d.id);

    
    await adminDb.collection('knowledgebase_articles').doc(post.id).set({
      ...post,
      relatedProductIds: prodIds,
      createdAt: Timestamp.fromDate(post.createdAt),
      updatedAt: Timestamp.fromDate(post.updatedAt),
      publishedAt: post.publishedAt ? Timestamp.fromDate(post.publishedAt) : null
    });
    created++;
  }
  
  for (const comm of BLOG_DATA.comments) {
    await adminDb.collection('blog_comments').doc(comm.id).set({
      ...comm,
      createdAt: Timestamp.fromDate(comm.createdAt),
      updatedAt: Timestamp.fromDate(comm.updatedAt)
    });
    created++;
  }
  
  return created;
}


export async function seedTickets(): Promise<number> {
  assertSeedingAllowed();
  const customersSnap = await adminDb.collection('users').limit(1).get();
  if (customersSnap.empty) return 0;
  
  let created = 0;
  const customer = customersSnap.docs[0].data();
  const userId = customersSnap.docs[0].id;
  const id = crypto.randomUUID();
  const now = Timestamp.now();
  
  await adminDb.collection('support_tickets').doc(id).set({
    id,
    userId: userId,
    customerEmail: customer.email,
    customerName: customer.displayName,
    subject: 'Initial Support Request',
    priority: 'medium',
    status: 'open',
    createdAt: now,
    updatedAt: now,
  });

  const messageId = crypto.randomUUID();
  await adminDb.collection('ticket_messages').doc(messageId).set({
    id: messageId,
    ticketId: id,
    senderId: userId,
    senderType: 'customer',
    content: 'Hello, I need help with my order.',
    createdAt: now,
    visibility: 'public'
  });

  created++;
  return created;
}

export async function seedMacros(): Promise<number> {
  assertSeedingAllowed();
  for (const mac of MACROS) {
    await adminDb.collection('support_macros').doc(mac.id).set(mac);
  }
  return MACROS.length;
}

export async function seedDiscounts(): Promise<number> {
  assertSeedingAllowed();
  for (const disc of DISCOUNTS) {
    await adminDb.collection('discounts').doc(disc.id!).set({
      ...disc,
      createdAt: Timestamp.now()
    });
  }
  return DISCOUNTS.length;
}

export async function seedSettings(): Promise<number> {
  assertSeedingAllowed();
  const settings = [
    { id: 'store_name', value: 'DreamBees Art' },
    { id: 'currency', value: 'USD' },
  ];
  for (const s of settings) {
    await adminDb.collection('settings').doc(s.id).set({ value: s.value });
  }
  return settings.length;
}

export async function seedProcurement(): Promise<number> {
  assertSeedingAllowed();
  const productsSnap = await adminDb.collection('products').limit(1).get();
  const suppliersSnap = await adminDb.collection('suppliers').limit(1).get();
  if (productsSnap.empty || suppliersSnap.empty) return 0;

  const prodId = productsSnap.docs[0].id;
  const supId = suppliersSnap.docs[0].id;
  const id = crypto.randomUUID();
  const now = Timestamp.now();

  await adminDb.collection('purchase_orders').doc(id).set({
    id,
    supplier: supId,
    referenceNumber: 'PO-SEED-001',
    status: 'ordered',
    items: [{ id: crypto.randomUUID(), productId: prodId, orderedQty: 10, unitCost: 500, receivedQty: 0, totalCost: 5000 }],
    totalCost: 5000,
    createdAt: now,
    updatedAt: now
  });
  return 1;
}

export async function seedAll(): Promise<void> {
  assertSeedingAllowed();
  logger.info('Starting Firestore database seeding via Admin SDK...');
  
  await clearAuditLogs();
  await seedTaxonomy();
  await seedSettings();
  await seedMacros();
  await seedDiscounts();
  await seedProducts();
  await seedCustomers();
  await seedLocations();
  await seedInventory();
  await seedKnowledgebase();
  await seedBlog();
  await seedOrders();
  await seedTickets();
  await seedProcurement();
  
  logger.info('Firestore seeding complete!');
}