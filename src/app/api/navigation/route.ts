/**
 * [LAYER: INFRASTRUCTURE]
 */
import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import type { NavigationMenu } from '@domain/models';

export async function GET(request: Request) {
  try {
    const services = await getServerServices();
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('id') || 'main-nav';

    const menu = await services.settingsService.getNavigationMenu(menuId);
    
    // Return default if not customized yet
    if (!menu) {
      return NextResponse.json({
        id: menuId,
        shopCategories: {
          title: 'Categories',
          links: [
            { label: 'Rare Singles', href: '/products?category=Singles' },
            { label: 'Sealed Boxes', href: '/products?category=sealed' },
            { label: 'Accessories', href: '/products?category=accessories' }
          ]
        },
        shopCollections: {
          title: 'Collections',
          links: [
            { label: 'New Arrivals', href: '/products?category=new' },
            { label: 'Bestsellers', href: '/products?category=bestsellers' },
            { label: 'Clearance Event', href: '/products?category=sale' }
          ]
        },
        featuredPromotion: {
          imageUrl: 'https://images.unsplash.com/photo-1620336655174-3268cb1b7470?w=400&h=400&fit=crop',
          title: 'Charizard Base Set',
          subtitle: 'Trending Artifact',
          linkText: 'View Item',
          linkHref: '/products'
        },
        otherLinks: [
           { label: 'All Products', href: '/products' },
           { label: 'Featured', href: '/products?category=featured' }
        ]
      } as NavigationMenu);
    }

    return NextResponse.json(menu);
  } catch (error: any) {
    console.error('Failed to get public navigation menu:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}