/**
 * [LAYER: INFRASTRUCTURE]
 */
import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import type { NavigationMenu } from '@domain/models';

/**
 * Default navigation menu returned when Firestore is unreachable
 * or no custom menu has been configured in admin.
 */
function getDefaultMenu(menuId: string): NavigationMenu {
  return {
    id: menuId,
    shopCategories: {
      title: 'Categories',
      links: [
        { label: 'Artist Trading Cards', href: '/collections/artist-cards' },
        { label: 'Art Prints', href: '/collections/prints' },
        { label: 'TCG Accessories', href: '/collections/accessories' }
      ]
    },
    shopCollections: {
      title: 'Collections',
      links: [
        { label: 'New Drops', href: '/collections/new' },
        { label: 'Bestsellers', href: '/collections/bestsellers' },
        { label: 'Sale', href: '/collections/sale' }
      ]
    },
    featuredPromotion: {
      imageUrl: '/assets/generated/generic_tcg_strategy_1778177431609.png',
      title: 'Latest Artist Drop',
      subtitle: 'Fan Favorites',
      linkText: 'Shop Now',
      linkHref: '/products'
    },
    otherLinks: [
       { label: 'All Products', href: '/products' }
    ]
  } as NavigationMenu;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const menuId = searchParams.get('id') || 'main-nav';

  try {
    const services = await getServerServices();
    const menu = await services.settingsService.getNavigationMenu(menuId);
    
    // Return default if not customized yet
    if (!menu) {
      return NextResponse.json(getDefaultMenu(menuId));
    }

    return NextResponse.json(menu);
  } catch (error: any) {
    // Graceful degradation: return default menu when Firestore is offline
    console.warn('Navigation menu fetch failed (returning defaults):', error?.code || error?.message || 'unknown');
    return NextResponse.json(getDefaultMenu(menuId));
  }
}