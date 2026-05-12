/**
 * [LAYER: INFRASTRUCTURE]
 */
import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, readJsonObject, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const services = await getServerServices();
    const supplier = await services.supplierService.get(id);
    return NextResponse.json(supplier);
  } catch (error) {
    return jsonError(error, 'Failed to get supplier');
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(request);
    const { id } = await params;
    const body = await readJsonObject(request);
    const services = await getServerServices();
    
    const supplier = await services.supplierService.update(id, body, {
      id: session.id,
      email: session.email
    });
    
    return NextResponse.json(supplier);
  } catch (error) {
    return jsonError(error, 'Failed to update supplier');
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession(request);
    const { id } = await params;
    const services = await getServerServices();
    
    await services.supplierService.delete(id, {
      id: session.id,
      email: session.email
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, 'Failed to delete supplier');
  }
}
