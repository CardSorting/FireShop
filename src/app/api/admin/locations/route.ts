/**
 * [LAYER: INFRASTRUCTURE]
 */
import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, readJsonObject, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET() {
  try {
    await requireAdminSession();
    const services = await getServerServices();
    const locations = await services.inventoryLocationRepo.findAll();
    return NextResponse.json(locations);
  } catch (error) {
    return jsonError(error, 'Failed to load inventory locations');
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
    const body = await readJsonObject(request) as any;
    const services = await getServerServices();
    const location = await services.inventoryLocationRepo.save(body);
    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    return jsonError(error, 'Failed to create inventory location');
  }
}
