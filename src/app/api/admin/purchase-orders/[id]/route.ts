/**
 * [LAYER: INFRASTRUCTURE]
 */
import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const services = await getServerServices();
    if (searchParams.get('guided') === 'true') {
      return NextResponse.json(await services.purchaseOrderService.getGuidedPurchaseOrder(id));
    }
    const order = await services.purchaseOrderService.getPurchaseOrder(id);
    return NextResponse.json(order);
  } catch (error) {
    return jsonError(error, 'Failed to load purchase order');
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdminSession();
    const { id } = await params;
    const body = await request.json();
    const services = await getServerServices();

    if (body.action === 'submit') {
      const order = await services.purchaseOrderService.submitOrder(id, user.id, user.email);
      return NextResponse.json(order);
    }

    if (body.action === 'cancel') {
      const order = await services.purchaseOrderService.cancelOrder(id, user.id, user.email);
      return NextResponse.json(order);
    }

    if (body.action === 'close') {
      const order = await services.purchaseOrderService.closeOrder({
        id,
        discrepancyReason: body.discrepancyReason,
        notes: body.notes,
      }, user.id, user.email);
      return NextResponse.json(order);
    }

    if (body.action === 'receive') {
      const result = await services.purchaseOrderService.receiveItems({
        purchaseOrderId: id,
        receivedBy: user.id,
        items: body.items,
        notes: body.notes,
        locationId: body.locationId,
        idempotencyKey: body.idempotencyKey,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return jsonError(error, 'Failed to process purchase order action');
  }
}