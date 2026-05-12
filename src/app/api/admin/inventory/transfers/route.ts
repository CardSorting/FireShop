import { getInitialServices } from '@core/container';
import { jsonError, readJsonObject, requireAdminSession, requireString } from '@infrastructure/server/apiGuards';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await requireAdminSession();
    const services = getInitialServices();
    const transfers = await services.transferService.getAllTransfers();
    return NextResponse.json(transfers);
  } catch (err) {
    return jsonError(err, 'Failed to fetch transfers');
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
    const body = await readJsonObject(request);
    const id = requireString(body.id, 'id');
    const action = requireString(body.action, 'action');
    
    const services = getInitialServices();
    if (action === 'receive') {
      await services.transferService.receiveTransfer(id);
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    return jsonError(err, 'Failed to process transfer');
  }
}
