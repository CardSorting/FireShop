/**
 * [LAYER: INFRASTRUCTURE]
 * Industrialized Seeding Infrastructure for DreamBeesArt.
 * Features: Domain Service Integration, Forensic Lifecycle Seeding, and Relational Sovereignty.
 * Firestore Version.
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
} from '@domain/models';
import { getInitialServices } from '../../core/container';
import { logger } from '@utils/logger';

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
  { email: 'ash.ketchum@palette.town', password: 'Pikapika-password123', displayName: 'Ash Ketchum' },
  { email: 'misty.williams@cerulean.city', password: 'Starmie-password123', displayName: 'Misty Williams' },
];

const KB_DATA = {
  categories: [
    { id: 'order-issues', name: 'Order Issues', slug: 'order-issues', description: 'Track, change, or cancel your orders.', icon: 'package', articleCount: 2 },
    { id: 'returns-refunds', name: 'Returns & Refunds', slug: 'returns-refunds', description: 'Everything you need to know about our return policy.', icon: 'rotate-ccw', articleCount: 1 },
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
  const services = getInitialServices();
  
  // Collections
  const collections = [
    { id: 'coll-new', name: 'New Arrivals', handle: 'new-arrivals', status: 'active' as const, productCount: 10, createdAt: new Date(), updatedAt: new Date() },
    { id: 'coll-best', name: 'Best Sellers', handle: 'best-sellers', status: 'active' as const, productCount: 25, createdAt: new Date(), updatedAt: new Date() },
  ];

  for (const coll of collections) {
    await services.collectionService.create(coll, MOCK_ACTOR);
  }

  // Product Categories
  const cats = [
    { id: 'cat-cards', name: 'Trading Cards', slug: 'cards', description: 'Individual singles and sets', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat-acc', name: 'Accessories', slug: 'accessories', description: 'Mats, sleeves, and more', createdAt: new Date(), updatedAt: new Date() },
  ];

  for (const cat of cats) {
    await services.taxonomyService.saveCategory(cat, MOCK_ACTOR);
  }

  // Product Types
  const types = ['Trading Cards', 'Accessories', 'Digital', 'Apparel', 'Collectibles'];
  for (const t of types) {
    await services.taxonomyService.saveType({ id: crypto.randomUUID(), name: t, createdAt: new Date(), updatedAt: new Date() }, MOCK_ACTOR);
  }
}

export async function seedSuppliers(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  let created = 0;
  
  for (const sup of SUPPLIERS) {
    try {
      const existing = await services.supplierService.list({ query: sup.name });
      if (existing.length === 0) {
        await services.supplierService.create(sup as Supplier, MOCK_ACTOR);
        created++;
      }
    } catch (err) {
      logger.error(`Forensic Fault: Failed to seed supplier ${sup.name}.`, err);
    }
  }
  return created;
}

export async function seedLocations(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  let created = 0;
  
  for (const loc of LOCATIONS) {
    try {
      const existing = await services.inventoryLocationRepo.findById(loc.id!);
      if (!existing) {
        await services.inventoryLocationRepo.save({ ...loc, createdAt: new Date() } as InventoryLocation);
        created++;
      }
    } catch (err) {
      logger.error(`Forensic Fault: Failed to seed location ${loc.name}.`, err);
    }
  }
  return created;
}

export async function seedInventory(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  const productsResult = await services.productService.getProducts({ limit: 100 });
  const products = productsResult.products;
  const locations = await services.inventoryLocationRepo.findAll();
  let created = 0;

  if (locations.length === 0) {
    logger.warn('SKIPPED: Inventory seeding skipped because no locations found.');
    return 0;
  }

  for (const prod of products) {
    for (const loc of locations) {
      await services.inventoryLevelRepo.save({
        productId: prod.id,
        locationId: loc.id,
        availableQty: Math.floor((prod.stock || 0) / locations.length),
        reservedQty: 0,
        incomingQty: 0,
        reorderPoint: 5,
        reorderQty: 20,
        updatedAt: new Date()
      });
      created++;
    }
  }
  return created;
}

export async function seedProducts(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  let created = 0;

  for (const product of INITIAL_CATALOG) {
    try {
      const existing = await services.productService.getProducts({ limit: 1, query: product.name });
      if (existing.products.length === 0) {
        await services.productService.createProduct(product, { id: 'system', email: 'system@dreambees.art' });
        created++;
      }
    } catch (err) {
      logger.error(`Forensic Fault: Failed to seed product ${product.name}.`, err);
    }
  }
  return created;
}

export async function clearAuditLogs(): Promise<void> {
  assertSeedingAllowed();
  const services = getInitialServices();
  await services.auditService.clearAll();
  logger.info('[Forensic] Audit logs cleared for clean chain initialization.');
}

export async function seedCustomers(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  let created = 0;

  for (const customer of INITIAL_CUSTOMERS) {
    try {
      const users = await services.authService.getAllUsers();
      if (!users.some(u => u.email === customer.email)) {
        const saved = await services.authService.signUp(customer.email, customer.password, customer.displayName);
        if (customer.role === 'admin') {
          await services.authService.updateUser(saved.id, { role: 'admin' });
        }
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
  const services = getInitialServices();
  const productsResult = await services.productService.getProducts({ limit: 100 });
  const products = productsResult.products;
  const customers = await services.authService.getAllUsers();
  
  if (products.length === 0 || customers.length === 0) return 0;

  const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];
  let created = 0;
  for (let i = 0; i < 5; i++) {
    try {
      const customer = customers.find(c => c.role === 'customer') || customers[0];
      const prod = products[Math.floor(Math.random() * products.length)];
      
      await services.orderRepo.create({
        userId: customer.id,
        items: [{ productId: prod.id, name: prod.name, quantity: 1, unitPrice: prod.price }],
        total: prod.price,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        shippingAddress: { street: '123 Fake St', city: 'Springfield', state: 'IL', zip: '62704', country: 'US' },
        paymentTransactionId: `seeded_${crypto.randomUUID()}`,
        idempotencyKey: crypto.randomUUID(),
        notes: [],
        riskScore: 0,
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
  const services = getInitialServices();
  let created = 0;
  for (const cat of KB_DATA.categories) {
    await services.knowledgebaseRepository.saveCategory(cat as KnowledgebaseCategory);
    created++;
  }
  for (const art of KB_DATA.articles) {
    await services.knowledgebaseRepository.saveArticle(art as KnowledgebaseArticle);
    created++;
  }
  return created;
}

export async function seedTickets(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  const customers = await services.authService.getAllUsers();
  if (customers.length === 0) return 0;
  
  let created = 0;
  const customer = customers[0];
  const id = crypto.randomUUID();
  await services.ticketRepository.createTicket({
    id,
    userId: customer.id,
    customerEmail: customer.email,
    customerName: customer.displayName,
    subject: 'Initial Support Request',
    priority: 'medium',
    status: 'open',
    messages: [{
      id: crypto.randomUUID(),
      ticketId: id,
      senderId: customer.id,
      senderType: 'customer',
      content: 'Hello, I need help with my order.',
      createdAt: new Date(),
      visibility: 'public'
    }],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  created++;
  return created;
}

export async function seedMacros(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  for (const mac of MACROS) {
    await services.ticketRepository.addMacro(mac);
  }
  return MACROS.length;
}

export async function seedDiscounts(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  for (const disc of DISCOUNTS) {
    await services.discountService.createDiscount(disc as any, MOCK_ACTOR);
  }
  return DISCOUNTS.length;
}

export async function seedSettings(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  const settings = [
    { key: 'store_name', value: 'DreamBees Art' },
    { key: 'currency', value: 'USD' },
  ];
  for (const s of settings) {
    await services.settingsService.updateSetting(s.key, s.value, MOCK_ACTOR);
  }
  return settings.length;
}

export async function seedProcurement(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  const productsResult = await services.productService.getProducts({ limit: 1 });
  const suppliers = await services.supplierService.list({ limit: 1 });
  if (productsResult.products.length === 0 || suppliers.length === 0) return 0;

  const prod = productsResult.products[0];
  const sup = suppliers[0];

  await services.purchaseOrderService.createPurchaseOrder({
    supplier: sup.id,
    referenceNumber: 'PO-SEED-001',
    items: [{ productId: prod.id, orderedQty: 10, unitCost: 500 }],
  });
  return 1;
}

export async function seedAll(): Promise<void> {
  assertSeedingAllowed();
  logger.info('Starting Firestore database seeding...');
  
  await clearAuditLogs();
  await seedTaxonomy();
  await seedSettings();
  await seedMacros();
  await seedDiscounts();
  await seedProducts();
  await seedCustomers();
  await seedSuppliers();
  await seedLocations();
  await seedInventory();
  await seedKnowledgebase();
  await seedOrders();
  await seedTickets();
  await seedProcurement();
  
  logger.info('Firestore seeding complete!');
}