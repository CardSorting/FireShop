import { getServerServices } from '../../../../infrastructure/server/services';
import { requireSessionUser, jsonError } from '@infrastructure/server/apiGuards';

export async function GET() {
  try {
    const user = await requireSessionUser();
    const services = await getServerServices();
    const assets = await services.orderService.getDigitalAssets(user.id);

    return Response.json(assets);
  } catch (error: any) {
    return jsonError(error, 'Failed to fetch vault assets');
  }
}
