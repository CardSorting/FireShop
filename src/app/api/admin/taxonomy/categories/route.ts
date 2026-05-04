import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession, readJsonObject } from '@infrastructure/server/apiGuards';

export async function GET() {
  try {
    await requireAdminSession();
    const services = await getServerServices();
    const categories = await services.taxonomyService.getAllCategories();
    return Response.json(categories);
  } catch (error) {
    return jsonError(error, 'Failed to list categories');
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession(request);
    const body = await readJsonObject(request);
    const services = await getServerServices();
    
    const category = await services.taxonomyService.saveCategory(body as any, {
      id: session.id,
      email: session.email
    });
    
    return Response.json(category);
  } catch (error) {
    return jsonError(error, 'Failed to save category');
  }
}
