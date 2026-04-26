/**
 * [LAYER: INFRASTRUCTURE]
 */
import type { Product } from '@domain/models';


const INITIAL_CATALOG: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Scarlet & Violet Booster Box',
    description:
      'A sealed booster box containing 36 packs from the Scarlet & Violet expansion. Great for collectors and players.',
    price: 14999,
    category: 'box',
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400',
    set: 'Scarlet & Violet',
  },
  {
    name: 'Charizard EX (Holo)',
    description:
      'Ultra rare holographic Charizard EX card. Near mint condition, professionally graded ready.',
    price: 29999,
    category: 'single',
    stock: 3,
    imageUrl: 'https://images.unsplash.com/photo-1613773827290-e46feb889f6d?w=400',
    set: 'XY Evolutions',
    rarity: 'holo',
  },
  {
    name: 'Paldean Fates Elite Trainer Box',
    description:
      'Elite Trainer Box with 9 booster packs, card sleeves, dividers, and more. Perfect for new players.',
    price: 5999,
    category: 'box',
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
    set: 'Paldean Fates',
  },
  {
    name: 'Mewtwo V (Secret Rare)',
    description:
      'Stunning secret rare Mewtwo V with full-art illustration. A crown jewel for any collection.',
    price: 8999,
    category: 'single',
    stock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400',
    set: 'Pokemon GO',
    rarity: 'secret',
  },
  {
    name: 'Obsidian Flames Booster Pack',
    description:
      'Individual booster pack from the Obsidian Flames set. Chase the Charizard ex!',
    price: 499,
    category: 'booster',
    stock: 200,
    imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400',
    set: 'Obsidian Flames',
  },
  {
    name: 'Lugia VSTAR Deck',
    description:
      'Pre-constructed 60-card deck featuring Lugia VSTAR. Ready to play right out of the box.',
    price: 2499,
    category: 'deck',
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
    set: 'Silver Tempest',
  },
  {
    name: 'Ultra Pro Card Sleeves (100ct)',
    description:
      'Premium matte card sleeves to protect your prized collection. 100 count pack.',
    price: 999,
    category: 'accessory',
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1613773827290-e46feb889f6d?w=400',
  },
  {
    name: 'Pikachu VMAX (Rainbow Rare)',
    description:
      'Rainbow rare Pikachu VMAX — one of the most sought-after modern cards.',
    price: 15999,
    category: 'single',
    stock: 2,
    imageUrl: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400',
    set: 'Vivid Voltage',
    rarity: 'holo',
  },
  {
    name: 'Paradox Rift Booster Box',
    description:
      'Explore the paradox of past and future with this 36-pack booster box.',
    price: 13999,
    category: 'box',
    stock: 18,
    imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400',
    set: 'Paradox Rift',
  },
  {
    name: 'Deck Builder’s Toolkit',
    description:
      'Everything you need to build your first competitive deck. Includes boosters, lands, and guides.',
    price: 2499,
    category: 'accessory',
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
  },
];

import { getInitialServices } from '../../core/container';
import { logger } from '@utils/logger';


export async function seedProducts(): Promise<number> {
  const services = getInitialServices();
  let created = 0;

  for (const product of INITIAL_CATALOG) {
    try {
      await services.productService.createProduct(product);
      created++;
    } catch (err) {
      logger.error(`Failed to seed ${product.name}.`, err);
    }
  }

  logger.info(`Seeded ${created} products.`);
  return created;
}

export function getInitialProductData(): typeof INITIAL_CATALOG {
  return [...INITIAL_CATALOG];
}