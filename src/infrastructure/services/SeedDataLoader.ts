/**
 * [LAYER: INFRASTRUCTURE]
 */
import type { Product, OrderStatus, Address } from '@domain/models';
import { getInitialServices } from '../../core/container';
import { SQLiteOrderRepository } from '../repositories/sqlite/SQLiteOrderRepository';
import { logger } from '@utils/logger';

const INITIAL_CATALOG: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Scarlet & Violet Booster Box',
    description:
      'A sealed booster box containing 36 packs from the Scarlet & Violet expansion. Great for collectors and players.',
    price: 14999,
    category: 'box',
    stock: 25,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400',
    set: 'Scarlet & Violet',
    media: [],
  },
  {
    name: 'Charizard EX (Holo)',
    description:
      'Ultra rare holographic Charizard EX card. Near mint condition, professionally graded ready.',
    price: 29999,
    category: 'single',
    stock: 3,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1613773827290-e46feb889f6d?w=400',
    set: 'XY Evolutions',
    rarity: 'holo',
    media: [],
  },
  {
    name: 'Paldean Fates Elite Trainer Box',
    description:
      'Elite Trainer Box with 9 booster packs, card sleeves, dividers, and more. Perfect for new players.',
    price: 5999,
    category: 'box',
    stock: 40,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
    set: 'Paldean Fates',
    media: [],
  },
  {
    name: 'Mewtwo V (Secret Rare)',
    description:
      'Stunning secret rare Mewtwo V with full-art illustration. A crown jewel for any collection.',
    price: 8999,
    category: 'single',
    stock: 5,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400',
    set: 'Pokemon GO',
    rarity: 'secret',
    media: [],
  },
  {
    name: 'Obsidian Flames Booster Pack',
    description:
      'Individual booster pack from the Obsidian Flames set. Chase the Charizard ex!',
    price: 499,
    category: 'booster',
    stock: 200,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400',
    set: 'Obsidian Flames',
    media: [],
  },
  {
    name: 'Lugia VSTAR Deck',
    description:
      'Pre-constructed 60-card deck featuring Lugia VSTAR. Ready to play right out of the box.',
    price: 2499,
    category: 'deck',
    stock: 15,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
    set: 'Silver Tempest',
    media: [],
  },
  {
    name: 'Ultra Pro Card Sleeves (100ct)',
    description:
      'Premium matte card sleeves to protect your prized collection. 100 count pack.',
    price: 999,
    category: 'accessory',
    stock: 100,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1613773827290-e46feb889f6d?w=400',
    media: [],
  },
  {
    name: 'Pikachu VMAX (Rainbow Rare)',
    description:
      'Rainbow rare Pikachu VMAX — one of the most sought-after modern cards.',
    price: 15999,
    category: 'single',
    stock: 2,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400',
    set: 'Vivid Voltage',
    rarity: 'holo',
    media: [],
  },
  {
    name: 'Paradox Rift Booster Box',
    description:
      'Explore the paradox of past and future with this 36-pack booster box.',
    price: 13999,
    category: 'box',
    stock: 18,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400',
    set: 'Paradox Rift',
    media: [],
  },
  {
    name: 'Deck Builder’s Toolkit',
    description:
      'Everything you need to build your first competitive deck. Includes boosters, lands, and guides.',
    price: 2499,
    category: 'accessory',
    stock: 30,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
    media: [],
  },
];

const INITIAL_CUSTOMERS = [
  { email: 'ash.ketchum@palette.town', password: 'Pikapika-password123', displayName: 'Ash Ketchum' },
  { email: 'misty.williams@cerulean.city', password: 'Starmie-password123', displayName: 'Misty Williams' },
  { email: 'brock.harrison@pewter.city', password: 'Onix-password123', displayName: 'Brock Harrison' },
  { email: 'serena.yvonne@vaniville.town', password: 'Fennekin-password123', displayName: 'Serena Yvonne' },
  { email: 'red.legend@kanto.region', password: 'Origin-password123', displayName: 'Red' },
  { email: 'gary.oak@oak.lab', password: 'Smell-ya-later123', displayName: 'Gary Oak' },
];

const INITIAL_TAXONOMY = {
  categories: [
    { name: 'Apparel', slug: 'apparel', description: 'Clothing and wearable items' },
    { name: 'Electronics', slug: 'electronics', description: 'Tech and gadgets' },
    { name: 'Digital Goods', slug: 'digital-goods', description: 'Downloadable content and keys' },
    { name: 'Collectibles', slug: 'collectibles', description: 'Trading cards, figurines, and rare items' },
    { name: 'Accessories', slug: 'accessories', description: 'Cases, sleeves, and maintenance' },
  ],
  types: [
    { name: 'Standard' },
    { name: 'Limited Edition' },
    { name: 'Refurbished' },
    { name: 'Digital Key' },
  ]
};

function assertSeedingAllowed(): void {
  const allowInProduction = process.env.ALLOW_PRODUCTION_SEEDING === 'true';
  if (process.env.NODE_ENV === 'production' && !allowInProduction) {
    throw new Error('Seeding is blocked in production unless ALLOW_PRODUCTION_SEEDING=true.');
  }
}

export async function seedProducts(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  let created = 0;

  for (const product of INITIAL_CATALOG) {
    try {
      const existing = await services.productService.getProducts({ limit: 1, query: product.name });
      if (existing.products.length === 0) {
        await services.productService.createProduct(product, { id: 'system', email: 'system@playmore.tcg' });
        created++;
      }
    } catch (err) {
      logger.error(`Failed to seed product ${product.name}.`, err);
    }
  }

  logger.info(`Seeded ${created} products.`);
  return created;
}

export async function seedTaxonomy(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  let created = 0;

  const actor = { id: 'system', email: 'system@shopmore.io' };

  for (const cat of INITIAL_TAXONOMY.categories) {
    try {
      const existing = await services.taxonomyService.getAllCategories();
      if (!existing.some(c => c.slug === cat.slug)) {
        await services.taxonomyService.saveCategory(cat, actor);
        created++;
      }
    } catch (err) {
      logger.error(`Failed to seed category ${cat.name}.`, err);
    }
  }

  for (const type of INITIAL_TAXONOMY.types) {
    try {
      const existing = await services.taxonomyService.getAllTypes();
      if (!existing.some(t => t.name === type.name)) {
        await services.taxonomyService.saveType(type, actor);
        created++;
      }
    } catch (err) {
      logger.error(`Failed to seed product type ${type.name}.`, err);
    }
  }

  logger.info(`Seeded ${created} taxonomy items.`);
  return created;
}

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
      logger.error(`Failed to seed customer ${customer.email}.`, err);
    }
  }

  logger.info(`Seeded ${created} customers.`);
  return created;
}

export async function seedOrders(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  const orderRepo = new SQLiteOrderRepository();
  const productsResult = await services.productService.getProducts({ limit: 100 });
  const products = productsResult.products;
  const customers = await services.authService.getAllUsers();
  
  if (products.length === 0 || customers.length === 0) {
    logger.warn('Cannot seed orders without products and customers.');
    return 0;
  }

  const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  const addresses: Address[] = [
    { street: '123 Pallet Lane', city: 'Pallet Town', state: 'Kanto', zip: '00101', country: 'US' },
    { street: '456 Gym Road', city: 'Cerulean City', state: 'Kanto', zip: '00104', country: 'US' },
    { street: '789 Boulder St', city: 'Pewter City', state: 'Kanto', zip: '00102', country: 'US' },
  ];

  let created = 0;

  // Create 25 random orders
  for (let i = 0; i < 25; i++) {
    try {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      if (customer.role === 'admin') continue;

      const orderProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
      const items = orderProducts.map(p => ({
        productId: p.id,
        name: p.name,
        quantity: Math.floor(Math.random() * 2) + 1,
        unitPrice: p.price
      }));

      const total = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const address = addresses[Math.floor(Math.random() * addresses.length)];

      // Backdate some orders
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));

      await orderRepo.seed({
        id: crypto.randomUUID(),
        userId: customer.id,
        customerName: customer.displayName,
        customerEmail: customer.email,
        items,
        total,
        status,
        shippingAddress: address,
        paymentTransactionId: status === 'pending' ? null : `seeded_tx_${crypto.randomUUID()}`,
        riskScore: Math.floor(Math.random() * 20),
        createdAt,
        updatedAt: createdAt,
        notes: [],
      });
      created++;
    } catch (err) {
      logger.error(`Failed to seed order ${i}.`, err);
    }
  }

  logger.info(`Seeded ${created} orders.`);
  return created;
}

export function getInitialProductData(): typeof INITIAL_CATALOG {
  return [...INITIAL_CATALOG];
}