/**
 * [LAYER: INFRASTRUCTURE]
 * Industrialized Seeding Infrastructure for PlayMoreTCG.
 * Features: Domain Service Integration, Forensic Lifecycle Seeding, and Relational Sovereignty.
 */
import type { 
  ProductDraft, 
  OrderStatus, 
  Address, 
  SupportTicket, 
  KnowledgebaseCategory, 
  KnowledgebaseArticle,
} from '@domain/models';
import type { DiscountTable } from '../sqlite/schema';
import { getInitialServices } from '../../core/container';
import { SQLiteOrderRepository } from '../repositories/sqlite/SQLiteOrderRepository';
import { knowledgebaseRepository } from '../repositories/knowledgebaseRepository';
import { ticketRepository } from '../repositories/ticketRepository';
import { getSQLiteDB } from '../sqlite/database';
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
  },
  {
    name: 'Rare Mint Charizard (Premium Margin)',
    description: 'High-margin premium item for testing margin health analytics.',
    price: 150000, // $1500
    cost: 45000,   // $450 (70% margin)
    category: 'single',
    productType: 'Trading Cards',
    stock: 1,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1613773827290-e46feb889f6d?w=800',
    handle: 'rare-mint-charizard-premium',
    sku: 'XY-CHZ-PREM',
    trackQuantity: true,
    physicalItem: true,
    media: [],
  },
  {
    name: 'Bulk Energy Cards (Low Margin)',
    description: 'Low-margin bulk item for testing at-risk margin filters.',
    price: 500,  // $5
    cost: 450,   // $4.50 (10% margin)
    category: 'bulk',
    productType: 'Trading Cards',
    stock: 500,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400',
    handle: 'bulk-energy-low-margin',
    sku: 'BLK-NRG-LOW',
    trackQuantity: true,
    physicalItem: true,
    media: [],
  },
  {
    name: 'Incomplete Draft Product',
    description: 'A product with missing image and SKU to test the "Needs Attention" setup view.',
    price: 999,
    category: 'box',
    productType: 'Trading Cards',
    stock: 0,
    status: 'draft',
    imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=100', // Placeholder but present
    handle: 'incomplete-draft-product',
    // sku: undefined // Missing to trigger setup issue
    trackQuantity: true,
    physicalItem: true,
    media: [],
  }
];

const INITIAL_CUSTOMERS = [
  { email: 'ash.ketchum@palette.town', password: 'Pikapika-password123', displayName: 'Ash Ketchum' },
  { email: 'misty.williams@cerulean.city', password: 'Starmie-password123', displayName: 'Misty Williams' },
  { email: 'brock.harrison@pewter.city', password: 'Onix-password123', displayName: 'Brock Harrison' },
  { email: 'admin@playmore.tcg', password: 'Admin-Secure-Password123', displayName: 'System Admin', role: 'admin' as const },
];

const KB_DATA = {
  categories: [
    { id: 'order-issues', name: 'Order Issues', slug: 'order-issues', description: 'Track, change, or cancel your orders.', icon: 'package', articleCount: 2 },
    { id: 'returns-refunds', name: 'Returns & Refunds', slug: 'returns-refunds', description: 'Everything you need to know about our return policy.', icon: 'rotate-ccw', articleCount: 1 },
    { id: 'card-condition', name: 'Card Condition', slug: 'card-condition', description: 'How we grade and verify every card.', icon: 'shield-check', articleCount: 1 },
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

const SUPPLIERS = [
  { 
    id: 'sup-1', 
    name: 'Kanto Distribution', 
    contactName: 'Officer Jenny', 
    email: 'jenny@kanto.gov', 
    phone: '555-0100', 
    website: 'https://kanto.gov/distribution', 
    address: { street: '1 PokeWay', city: 'Viridian City', state: 'Kanto', zip: '00102', country: 'US' } 
  },
  { 
    id: 'sup-2', 
    name: 'Silph Co.', 
    contactName: 'The President', 
    email: 'ceo@silph.co', 
    phone: '555-0200', 
    website: 'https://silph.co', 
    address: { street: 'Silph Office Building', city: 'Saffron City', state: 'Kanto', zip: '00105', country: 'US' } 
  },
];

const LOCATIONS = [
  { id: 'loc-warehouse', name: 'Main Fulfillment Center', type: 'warehouse', address: '123 Logistics Blvd, Celadon City', isDefault: 1, isActive: 1 },
  { id: 'loc-retail', name: 'Saffron City Storefront', type: 'retail', address: '456 Market St, Saffron City', isDefault: 0, isActive: 1 },
];

const MACROS = [
  { id: 'mac-1', name: 'Shipping Status Update', content: 'Hello! Your order is currently being processed and will ship within 24 hours. You will receive a tracking number shortly.', category: 'Shipping', slug: 'shipping-update' },
  { id: 'mac-2', name: 'Grading Policy', content: 'Our cards are graded using NM (Near Mint) standards. If you feel your card does not meet this, please send photos for review.', category: 'Quality', slug: 'grading-policy' },
];

const DISCOUNTS: Partial<DiscountTable>[] = [
  { id: 'disc-1', code: 'WELCOME10', type: 'percentage', value: 10, status: 'active', isAutomatic: 0, startsAt: new Date().toISOString(), usageCount: 50 },
  { id: 'disc-2', code: 'FREESHIP', type: 'free_shipping', value: 0, status: 'active', isAutomatic: 0, startsAt: new Date().toISOString(), usageCount: 120 },
];

// ─────────────────────────────────────────────
// SEEDING LOGIC
// ─────────────────────────────────────────────

function assertSeedingAllowed(): void {
  const allowInProduction = process.env.ALLOW_PRODUCTION_SEEDING === 'true';
  if (process.env.NODE_ENV === 'production' && !allowInProduction) {
    throw new Error('PRODUCTION_BLOCK: Seeding is prohibited in production unless ALLOW_PRODUCTION_SEEDING=true.');
  }
}

/**
 * Atomic Seeding Module for Core Taxonomy
 */
export async function seedTaxonomy(): Promise<void> {
  const db = getSQLiteDB();
  const now = new Date().toISOString();

  await db.transaction().execute(async (trx) => {
    // Collections
    const collections = [
      { id: 'coll-new', name: 'New Arrivals', handle: 'new-arrivals', status: 'active', productCount: 10 },
      { id: 'coll-best', name: 'Best Sellers', handle: 'best-sellers', status: 'active', productCount: 25 },
    ];

    for (const coll of collections) {
      await trx.insertInto('collections')
        .values({ ...coll, createdAt: now, updatedAt: now })
        .onConflict(oc => oc.column('id').doNothing())
        .execute();
    }

    // Product Categories
    const cats = [
      { id: 'cat-cards', name: 'Trading Cards', slug: 'cards', description: 'Individual singles and sets' },
      { id: 'cat-acc', name: 'Accessories', slug: 'accessories', description: 'Mats, sleeves, and more' },
    ];

    for (const cat of cats) {
      await trx.insertInto('product_categories')
        .values({ ...cat, createdAt: now, updatedAt: now })
        .onConflict(oc => oc.column('id').doNothing())
        .execute();
    }

    // Product Types
    const types = ['Trading Cards', 'Accessories', 'Digital', 'Apparel', 'Collectibles'];
    for (const t of types) {
      await trx.insertInto('product_types')
        .values({ id: crypto.randomUUID(), name: t, createdAt: now, updatedAt: now })
        .onConflict(oc => oc.column('name').doNothing())
        .execute();
    }
  });
}

/**
 * Seeding Suppliers with Service Layer
 */
export async function seedSuppliers(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  let created = 0;
  
  for (const sup of SUPPLIERS) {
    try {
      const existing = await services.supplierService.list({ query: sup.name });
      if (existing.length === 0) {
        await services.supplierService.create(sup, { id: 'system', email: 'admin@playmore.tcg' });
        created++;
      }
    } catch (err) {
      logger.error(`Forensic Fault: Failed to seed supplier ${sup.name}.`, err);
    }
  }
  return created;
}

/**
 * Seeding Inventory Locations
 */
export async function seedLocations(): Promise<number> {
  assertSeedingAllowed();
  const db = getSQLiteDB();
  let created = 0;
  
  for (const loc of LOCATIONS) {
    const result = await db.insertInto('inventory_locations')
      .values({ ...loc, createdAt: new Date().toISOString() })
      .onConflict(oc => oc.column('id').doNothing())
      .execute();
    
    const numRows = result[0]?.numInsertedOrUpdatedRows ?? 0n;
    if (numRows > 0n) created++;
  }
  return created;
}

/**
 * Complex Relational Seeding for Inventory Levels
 */
export async function seedInventory(): Promise<number> {
  assertSeedingAllowed();
  const db = getSQLiteDB();
  const products = await db.selectFrom('products').select(['id', 'stock']).execute();
  const locations = await db.selectFrom('inventory_locations').select('id').execute();
  let created = 0;

  if (locations.length === 0) {
    logger.warn('SKIPPED: Inventory seeding skipped because no locations found.');
    return 0;
  }

  await db.transaction().execute(async (trx) => {
    for (const prod of products) {
      for (const loc of locations) {
        await trx.insertInto('inventory_levels')
          .values({
            productId: prod.id,
            locationId: loc.id,
            availableQty: Math.floor(prod.stock / locations.length),
            reservedQty: 0,
            incomingQty: 0,
            reorderPoint: 5,
            reorderQty: 20,
            updatedAt: new Date().toISOString()
          })
          .onConflict(oc => oc.columns(['productId', 'locationId']).doNothing())
          .execute();
        created++;
      }
    }
  });
  return created;
}

/**
 * Product Seeding with Visual Media and Variants
 */
export async function seedProducts(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  const db = getSQLiteDB();
  let created = 0;

  for (const product of INITIAL_CATALOG) {
    try {
      const existing = await services.productService.getProducts({ limit: 1, query: product.name });
      if (existing.products.length === 0) {
        const saved = await services.productService.createProduct(product, { id: 'system', email: 'system@playmore.tcg' });
        
        // Seed Media specifically
        if (product.media && product.media.length > 0) {
          for (const m of product.media) {
            await db.insertInto('product_media')
              .values({
                id: crypto.randomUUID(),
                productId: saved.id,
                url: m.url,
                altText: m.altText || null,
                position: m.position,
                createdAt: new Date().toISOString()
              })
              .execute();
          }
        }
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
  const db = getSQLiteDB();
  await db.deleteFrom('hive_audit').execute();
  logger.info('[Forensic] Audit logs cleared for clean chain initialization.');
}

/**
 * Customer Seeding with Identity Service Layer
 */
export async function seedCustomers(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  let created = 0;

  for (const customer of INITIAL_CUSTOMERS) {
    try {
      const users = await services.authService.getAllUsers();
      if (!users.some(u => u.email === customer.email)) {
        await services.authService.signUp(customer.email, customer.password, customer.displayName);
        created++;
      }
    } catch (err) {
      logger.error(`Forensic Fault: Failed to seed customer ${customer.email}.`, err);
    }
  }
  return created;
}

/**
 * Order History Seeding with Realistic Lifecycle
 */
export async function seedOrders(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  const orderRepo = new SQLiteOrderRepository();
  const productsResult = await services.productService.getProducts({ limit: 100 });
  const products = productsResult.products;
  const customers = await services.authService.getAllUsers();
  
  if (products.length === 0 || customers.length === 0) {
    logger.warn('SKIPPED: Order seeding skipped because products or customers are missing.');
    return 0;
  }

  const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  const addresses: Address[] = [
    { street: '123 Pallet Lane', city: 'Pallet Town', state: 'Kanto', zip: '00101', country: 'US' },
    { street: '456 Gym Road', city: 'Cerulean City', state: 'Kanto', zip: '00104', country: 'US' },
  ];

  let created = 0;
  for (let i = 0; i < 15; i++) {
    try {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      if (customer.role === 'admin') continue;

      const orderProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, 2);
      const items = orderProducts.map(p => ({
        productId: p.id,
        name: p.name,
        quantity: 1,
        unitPrice: p.price
      }));

      const total = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const address = addresses[Math.floor(Math.random() * addresses.length)];
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 10));

      await orderRepo.seed({
        id: crypto.randomUUID(),
        userId: customer.id,
        customerName: customer.displayName,
        customerEmail: customer.email,
        items,
        total,
        status,
        shippingAddress: address,
        paymentTransactionId: `seeded_${crypto.randomUUID()}`,
        riskScore: Math.floor(Math.random() * 10),
        createdAt,
        updatedAt: createdAt,
        notes: [],
      });
      created++;
    } catch (err) {
      logger.error(`Forensic Fault: Failed to seed order iteration ${i}.`, err);
    }
  }
  return created;
}

/**
 * Knowledgebase Seeding
 */
export async function seedKnowledgebase(): Promise<number> {
  assertSeedingAllowed();
  let created = 0;
  try {
    for (const cat of KB_DATA.categories) {
      await knowledgebaseRepository.saveCategory(cat as KnowledgebaseCategory);
      created++;
    }
    for (const art of KB_DATA.articles) {
      await knowledgebaseRepository.saveArticle(art as KnowledgebaseArticle);
      created++;
    }
  } catch (err) {
    logger.error('Forensic Fault: Failed during Knowledgebase seeding.', err);
  }
  return created;
}

/**
 * CRM Support Ticket Seeding
 */
export async function seedTickets(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  const customers = await services.authService.getAllUsers();
  const ordersResult = await new SQLiteOrderRepository().getAll({ limit: 10 });
  const orders = ordersResult.orders;
  
  if (customers.length === 0) return 0;
  let created = 0;

  for (let i = 0; i < 3; i++) {
    try {
      const customer = customers.find(c => c.role === 'customer') || customers[0];
      const order = orders[Math.floor(Math.random() * orders.length)];
      const id = crypto.randomUUID();
      
      const ticket: SupportTicket = {
        id,
        userId: customer.id,
        customerEmail: customer.email,
        customerName: customer.displayName,
        subject: `Industrial Support Request #${i+1}`,
        priority: 'medium',
        status: 'open',
        orderId: order?.id,
        messages: [{
          id: crypto.randomUUID(),
          ticketId: id,
          senderId: customer.id,
          senderType: 'customer',
          content: 'Industrial Audit: Hello, I have an issue with my recent order.',
          createdAt: new Date(),
          visibility: 'public'
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await ticketRepository.createTicket(ticket);
      created++;
    } catch (err) {
      logger.error(`Forensic Fault: Failed to seed ticket iteration ${i}.`, err);
    }
  }
  return created;
}

/**
 * CRM Macro Seeding
 */
export async function seedMacros(): Promise<number> {
  assertSeedingAllowed();
  const db = getSQLiteDB();
  let created = 0;
  for (const mac of MACROS) {
    const result = await db.insertInto('support_macros')
      .values(mac)
      .onConflict(oc => oc.column('id').doNothing())
      .execute();
    
    const numRows = result[0]?.numInsertedOrUpdatedRows ?? 0n;
    if (numRows > 0n) created++;
  }
  return created;
}

/**
 * Promotion & Discount Seeding
 */
export async function seedDiscounts(): Promise<number> {
  assertSeedingAllowed();
  const db = getSQLiteDB();
  let created = 0;
  for (const disc of DISCOUNTS) {
    const result = await db.insertInto('discounts')
      .values({
        ...disc as any,
        createdAt: new Date().toISOString()
      })
      .onConflict(oc => oc.column('id').doNothing())
      .execute();
    
    const numRows = result[0]?.numInsertedOrUpdatedRows ?? 0n;
    if (numRows > 0n) created++;
  }
  return created;
}

/**
 * Global Store Settings
 */
export async function seedSettings(): Promise<number> {
  assertSeedingAllowed();
  const db = getSQLiteDB();
  const settings = [
    { key: 'store_name', value: JSON.stringify('PlayMore TCG'), updatedAt: new Date().toISOString() },
    { key: 'currency', value: JSON.stringify('USD'), updatedAt: new Date().toISOString() },
    { key: 'tax_rate', value: JSON.stringify(0.08), updatedAt: new Date().toISOString() },
  ];
  for (const s of settings) {
    await db.insertInto('settings')
      .values(s)
      .onConflict(oc => oc.column('key').doUpdateSet({ value: s.value, updatedAt: s.updatedAt }))
      .execute();
  }
  return settings.length;
}

/**
 * Industrial Procurement Seeding: POs + Receiving Lifecycle
 */
export async function seedProcurement(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  const productsResult = await services.productService.getProducts({ limit: 5 });
  const products = productsResult.products;
  const suppliers = await services.supplierService.list({ limit: 1 });
  const locations = await services.inventoryLocationRepo.findAll();
  
  if (products.length === 0 || suppliers.length === 0 || locations.length === 0) {
    logger.warn('SKIPPED: Procurement seeding skipped because dependencies are missing.');
    return 0;
  }

  try {
    // 1. Create a PO
    const po = await services.purchaseOrderService.createPurchaseOrder({
      supplier: suppliers[0].id,
      referenceNumber: 'PO-INDUSTRIAL-001',
      items: products.map(p => ({
        productId: p.id,
        orderedQty: 100,
        unitCost: p.cost || 500,
        notes: 'Initial Stock'
      })),
      notes: 'Industrial Audit PO'
    });

    // 2. Submit it
    await services.purchaseOrderService.submitOrder(po.id);

    // 3. Partially Receive it (Sovereign Fulfillment Test)
    await services.purchaseOrderService.receiveItems({
      purchaseOrderId: po.id,
      receivedBy: 'system',
      locationId: locations[0].id,
      items: po.items.slice(0, 2).map(item => ({
        purchaseOrderItemId: item.id,
        receivedQty: 50,
        condition: 'new'
      })),
      notes: 'Partial industrial receiving session'
    });

    // 4. Create an OVERDUE PO (Forensic Test)
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 10);
    
    await services.purchaseOrderService.createPurchaseOrder({
      supplier: suppliers[0].id,
      referenceNumber: 'PO-OVERDUE-001',
      expectedAt: overdueDate,
      items: [
        { productId: products[0].id, orderedQty: 50, unitCost: 1000 }
      ],
      notes: 'This PO is intentionally overdue for testing alerts.'
    });

    // 5. Create a DAMAGED Receiving Session
    const po2 = await services.purchaseOrderService.createPurchaseOrder({
      supplier: suppliers[0].id,
      referenceNumber: 'PO-DAMAGED-001',
      items: [
        { productId: products[1].id, orderedQty: 20, unitCost: 2000 }
      ]
    });
    await services.purchaseOrderService.submitOrder(po2.id);
    
    const db = getSQLiteDB();
    const po2_db = await services.purchaseOrderService.getPurchaseOrder(po2.id);
    if (po2_db && po2_db.items[0]) {
      await services.purchaseOrderService.receiveItems({
        purchaseOrderId: po2.id,
        receivedBy: 'system',
        locationId: locations[0].id,
        items: [{
          purchaseOrderItemId: po2_db.items[0].id,
          receivedQty: 15,
          condition: 'damaged',
          discrepancyReason: 'damaged_items'
        }],
        notes: 'Forensic Audit: 5 items arrived damaged.'
      });
    }

    // 6. Seed Digital Access Logs
    const digitalProduct = products.find(p => p.isDigital);
    const users = await services.authService.getAllUsers();
    const customer = users.find(u => u.role === 'customer');
    
    if (digitalProduct && digitalProduct.digitalAssets && customer) {
      for (const asset of digitalProduct.digitalAssets) {
        await db.insertInto('digital_access_logs' as any)
          .values({
            id: crypto.randomUUID(),
            userId: customer.id,
            assetId: asset.id,
            ipAddress: '127.0.0.1',
            userAgent: 'Mozilla/5.0 (Forensic Seeder)',
            createdAt: new Date().toISOString()
          })
          .execute();
      }
    }

    return 3; // Seeded 3 major procurement scenarios
  } catch (err) {
    logger.error('Forensic Fault: Failed to seed complex procurement scenarios.', err);
    return 0;
  }
}

/**
 * Enhanced Order Interactions: Notes and Segments
 */
export async function enhanceOrders(): Promise<void> {
  const services = getInitialServices();
  const { orders } = await services.orderService.getAllOrders({ limit: 5 });
  const admin = (await services.authService.getAllUsers()).find(u => u.role === 'admin');

  if (admin) {
    for (const order of orders) {
      await services.orderService.addOrderNote(order.id, 'Industrial Audit: Verified payment and shipping address.', admin);
      await services.orderService.addOrderNote(order.id, 'Staff Note: Package is ready for pickup.', admin);
    }
  }
}

/**
 * Stock Transfers between locations
 */
export async function seedTransfers(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  const productsResult = await services.productService.getProducts({ limit: 2 });
  const products = productsResult.products;
  
  if (products.length < 2) return 0;

  try {
    const db = getSQLiteDB();
    const id = 'TR-INDUSTRIAL-01';
    await db.insertInto('transfers')
      .values({
        id,
        source: 'loc-warehouse',
        status: 'in_transit',
        items: JSON.stringify(products.map(p => ({ productId: p.id, name: p.name, quantity: 5 }))),
        itemsCount: 10,
        receivedCount: 0,
        expectedAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString()
      })
      .onConflict(oc => oc.column('id').doNothing())
      .execute();
    return 1;
  } catch (err) {
    logger.error('Forensic Fault: Failed to seed transfers.', err);
    return 0;
  }
}

/**
 * Customer Personalization: Wishlists
 */
export async function seedWishlists(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  const customers = await services.authService.getAllUsers();
  const productsResult = await services.productService.getProducts({ limit: 5 });
  const products = productsResult.products;

  if (customers.length === 0 || products.length === 0) return 0;

  let created = 0;
  for (const customer of customers.slice(0, 3)) {
    if (customer.role === 'admin') continue;
    try {
      const lists = await services.wishlistService.getWishlists(customer.id);
      const listId = lists[0].id;
      // Add items
      for (const prod of products.slice(0, 2)) {
        await services.wishlistService.addItem(customer.id, listId, prod.id);
      }
      created++;
    } catch (err) {
      logger.error(`Forensic Fault: Failed to seed wishlist for ${customer.email}.`, err);
    }
  }
  return created;
}

/**
 * Sovereign Integrity Audit Log Seeding
 */
export async function seedAuditLogs(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  const admin = (await services.authService.getAllUsers()).find(u => u.role === 'admin');
  
  if (!admin) return 0;

  const events: Array<{ action: any, targetId: string, details: any }> = [
    { action: 'product_created', targetId: 'seeded-prod-1', details: { name: 'Scarlet & Violet Booster Box' } },
    { action: 'settings_updated', targetId: 'store_name', details: { old: 'My Store', new: 'PlayMore TCG' } },
  ];

  for (const event of events) {
    await services.auditService.record({
      userId: admin.id,
      userEmail: admin.email,
      action: event.action,
      targetId: event.targetId,
      details: event.details
    });
  }

  return events.length;
}

/**
 * Orchestration Engine for Comprehensive Seeding
 */
export async function seedAll(): Promise<void> {
  assertSeedingAllowed();
  logger.info('INBOUND: Starting industrial-grade comprehensive database seeding...');
  
  try {
    await clearAuditLogs();
    await seedTaxonomy();
    await seedSettings();
    await seedMacros();
    await seedDiscounts();
    
    const products = await seedProducts();
    logger.info(`Forensic: Seeded ${products} products.`);
    
    const customers = await seedCustomers();
    logger.info(`Forensic: Seeded ${customers} customers.`);
    
    const suppliers = await seedSuppliers();
    logger.info(`Forensic: Seeded ${suppliers} suppliers.`);

    const locations = await seedLocations();
    logger.info(`Forensic: Seeded ${locations} locations.`);

    const inv = await seedInventory();
    logger.info(`Forensic: Seeded ${inv} inventory levels.`);
    
    const proc = await seedProcurement();
    logger.info(`Forensic: Seeded ${proc} procurement lifecycle events.`);

    const trans = await seedTransfers();
    logger.info(`Forensic: Seeded ${trans} stock transfers.`);

    const kb = await seedKnowledgebase();
    logger.info(`Forensic: Seeded ${kb} KB items.`);
    
    const orders = await seedOrders();
    logger.info(`Forensic: Seeded ${orders} orders.`);
    
    const tickets = await seedTickets();
    logger.info(`Forensic: Seeded ${tickets} support tickets.`);

    const wishlistCount = await seedWishlists();
    logger.info(`Forensic: Seeded ${wishlistCount} customer wishlists.`);

    await enhanceOrders();
    logger.info('Forensic: Enhanced orders with communication notes.');

    const auditCount = await seedAuditLogs();
    logger.info(`Forensic: Seeded ${auditCount} audit logs.`);

    // BroccoliQ Level 7: Final Forensic Chain Verification
    logger.info('[Forensic] Performing final audit chain verification...');
    const services = getInitialServices();
    const verification = await services.auditService.verifyChain();
    if (verification.valid) {
      logger.info(`[Forensic] Chain VALID: Integrity confirmed across ${verification.total} events.`);
    } else {
      logger.error(`[Forensic] Chain CORRUPTED: Integrity breach detected at entry ${verification.corruptedId}.`);
    }

    logger.info('OUTBOUND: Comprehensive industrial seeding complete!');
  } catch (err) {
    logger.error('CRITICAL SEED FAILURE: The industrial population pipeline has collapsed.', err);
    throw err;
  }
}