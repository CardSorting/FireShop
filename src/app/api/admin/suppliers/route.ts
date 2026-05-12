import { jsonError, requireAdminSession, readJsonObject } from '@infrastructure/server/apiGuards';
import { getServerServices } from '@infrastructure/server/services';

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const services = await getServerServices();
    
    const suppliers = await services.supplierService.list({
      query: searchParams.get('query') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    });
    
    return Response.json(suppliers);
  } catch (error) {
    return jsonError(error, 'Failed to list suppliers');
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession(request);
    const body = await readJsonObject(request);
    const services = await getServerServices();
    
    const supplier = await services.supplierService.create(body as any, {
      id: session.id,
      email: session.email
    });
    
    return Response.json(supplier);
  } catch (error) {
    return jsonError(error, 'Failed to create supplier');
  }
}
