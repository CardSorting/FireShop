import { requireAdminSession, jsonError, readJsonObject } from '@infrastructure/server/apiGuards';
import { getServerServices } from '@infrastructure/server/services';
import type { NavigationMenu } from '@domain/models';

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const services = await getServerServices();
    
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('id') || 'main-nav';

    const menu = await services.settingsService.getNavigationMenu(menuId);
    
    // Return empty state if not found so admin can create it
    if (!menu) {
      return Response.json({
        id: menuId,
        shopCategories: { title: 'Categories', links: [] },
        shopCollections: { title: 'Collections', links: [] },
        otherLinks: []
      });
    }

    return Response.json(menu);
  } catch (error) {
    return jsonError(error, 'Failed to get navigation menu');
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdminSession();
    const services = await getServerServices();
    
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('id') || 'main-nav';

    const menuData = await readJsonObject(request) as unknown as NavigationMenu;

    await services.settingsService.updateNavigationMenu(menuId, menuData, {
      id: admin.id,
      email: admin.email
    });

    return Response.json({ success: true });
  } catch (error) {
    return jsonError(error, 'Failed to update navigation menu');
  }
}