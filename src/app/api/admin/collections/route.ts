import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession, readJsonObject } from '@infrastructure/server/apiGuards';

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const services = await getServerServices();
    
    const collections = await services.collectionService.list({
      status: (searchParams.get('status') as 'active' | 'archived') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    });
    
    return Response.json(collections);
  } catch (error) {
    return jsonError(error, 'Failed to list collections');
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession(request);
    const body = await readJsonObject(request);
    const services = await getServerServices();
    
    const collection = await services.collectionService.create(body as any, {
      id: session.id,
      email: session.email
    });
    
    return Response.json(collection);
  } catch (error) {
    return jsonError(error, 'Failed to create collection');
  }
}
