import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

/**
 * [LAYER: API]
 * Industrialized logistics analytics endpoint.
 */
export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const services = await getServerServices();
    const insights = await services.orderQueryService.getLogisticsInsights();
    
    return NextResponse.json(insights);
  } catch (error) {
    return jsonError(error, 'Failed to retrieve logistics insights');
  }
}
