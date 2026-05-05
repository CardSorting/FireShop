import { getInitialServices } from './src/core/container';
import type { KnowledgebaseCategory } from './src/domain/models';

const categories: KnowledgebaseCategory[] = [
  {
    id: 'pokemon-decks',
    name: 'Pokémon Decks',
    slug: 'pokemon-decks',
    description: 'Competitive and casual deck builds for Pokémon TCG.',
    icon: 'zap',
    articleCount: 2
  },
  {
    id: 'authentication',
    name: 'Authentication',
    slug: 'authentication',
    description: 'Learn how to spot fakes and verify high-value cards.',
    icon: 'shield-check',
    articleCount: 1
  },
  {
    id: 'vintage',
    name: 'Vintage',
    slug: 'vintage',
    description: 'Deep dives into the history of classic TCG sets.',
    icon: 'history',
    articleCount: 1
  },
  {
    id: 'gaming-setup',
    name: 'Gaming Setup',
    slug: 'gaming-setup',
    description: 'Optimizing your physical space for the ultimate gaming experience.',
    icon: 'monitor',
    articleCount: 1
  },
  {
    id: 'tech',
    name: 'Tech',
    slug: 'tech',
    description: 'The latest hardware and software for collectors and gamers.',
    icon: 'cpu',
    articleCount: 2
  },
  {
    id: 'market-analysis',
    name: 'Market Analysis',
    slug: 'market-analysis',
    description: 'Data-driven insights into the TCG economy.',
    icon: 'trending-up',
    articleCount: 1
  },
  {
    id: 'finance',
    name: 'Finance',
    slug: 'finance',
    description: 'Managing your TCG collection as an alternative asset.',
    icon: 'dollar-sign',
    articleCount: 1
  },
  {
    id: 'preservation',
    name: 'Preservation',
    slug: 'preservation',
    description: 'Protecting your collection from the elements and time.',
    icon: 'umbrella',
    articleCount: 1
  },
  {
    id: 'fgc',
    name: 'Fighting Games',
    slug: 'fgc',
    description: 'Competitive insights and history of the fighting game community.',
    icon: 'swords',
    articleCount: 2
  },
  {
    id: 'smash',
    name: 'Smash Bros',
    slug: 'smash',
    description: 'Everything about the competitive Super Smash Bros scene.',
    icon: 'target',
    articleCount: 3
  },
  {
    id: 'tabletop',
    name: 'Tabletop',
    slug: 'tabletop',
    description: 'Board games and tabletop miniatures for the discerning player.',
    icon: 'dices',
    articleCount: 3
  },
  {
    id: 'yugioh-decks',
    name: 'Yu-Gi-Oh! Decks',
    slug: 'yugioh-decks',
    description: 'Modern and classic deck strategies for the King of Games.',
    icon: 'flame',
    articleCount: 3
  },
  {
    id: 'memes',
    name: 'Memes',
    slug: 'memes',
    description: 'The lighter side of TCG and geek culture.',
    icon: 'laugh',
    articleCount: 3
  },
  {
    id: 'pokemon',
    name: 'Pokémon',
    slug: 'pokemon',
    description: 'General Pokémon TCG news and culture.',
    icon: 'sparkles',
    articleCount: 1
  },
  {
    id: 'geek',
    name: 'Geek Culture',
    slug: 'geek',
    description: 'Exploring the intersection of art, tech, and hobbies.',
    icon: 'heart',
    articleCount: 1
  },
  {
    id: 'yugioh',
    name: 'Yu-Gi-Oh!',
    slug: 'yugioh',
    description: 'General Yu-Gi-Oh! TCG news and meta analysis.',
    icon: 'star',
    articleCount: 1
  }
];

async function seedCategories() {
  const services = getInitialServices();
  console.log('Seeding blog categories...');
  
  for (const category of categories) {
    await services.knowledgebaseRepository.saveCategory(category);
    console.log(`✓ Seeded category: ${category.name}`);
  }
  
  console.log('Seeding complete!');
}

seedCategories().catch(console.error);
