/**
 * [LAYER: INFRASTRUCTURE]
 */
import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession, readJsonObject } from '@infrastructure/server/apiGuards';

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const supplier = searchParams.get('supplier') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;
    const overview = searchParams.get('overview') === 'true';
    const workspace = searchParams.get('workspace') === 'true';

    const services = await getServerServices();

    if (workspace) {
      return NextResponse.json(await services.purchaseOrderService.getPurchaseOrderWorkspace());
    }

    if (overview) {
      return NextResponse.json(await services.purchaseOrderService.getPurchaseOrderOverview());
    }

    const supplierMetrics = searchParams.get('supplierMetrics');
    if (supplierMetrics) {
      return NextResponse.json(await services.purchaseOrderService.getSupplierMetrics(supplierMetrics));
    }

    return NextResponse.json(
      await services.purchaseOrderService.listPurchaseOrders({
        status: status as any,
        supplier,
        limit,
        offset,
      })
    );
  } catch (error) {
    return jsonError(error, 'Failed to load purchase orders');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminSession(request);
    const body = await readJsonObject(request);
    const services = await getServerServices();
    const order = await services.purchaseOrderService.createPurchaseOrder({
      ...(body as any),
      adminUserId: user.id,
      adminUserEmail: user.email,
    });
    return Response.json(order, { status: 201 });
  } catch (error) {
    return jsonError(error, 'Failed to create purchase order');
  }
}
