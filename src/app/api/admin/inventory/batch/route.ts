import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { requireAdminSession, readJsonObject, jsonError } from '@infrastructure/server/apiGuards';

/**
 * [LAYER: API]
 * Bulk inventory updates for both products and specific variants.
 * Restricted to administrative staff.
 */
export async function POST(request: Request) {
  try {
    const user = await requireAdminSession(request);
    const actor = { id: user.id, email: user.email };
    const services = await getServerServices();
    
    const body = await readJsonObject(request);
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      throw new Error('Invalid updates payload');
    }

    await services.productService.batchUpdateInventory(updates, actor);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] Inventory Batch Update Failed:', err);
    return jsonError(err, 'Inventory Batch Update Failed');
  }
}
