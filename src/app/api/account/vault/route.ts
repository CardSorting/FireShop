import { NextRequest, NextResponse } from 'next/server';
import { getServerServices } from '../../../../infrastructure/server/services';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const services = await getServerServices();
    const assets = await services.orderService.getDigitalAssets(userId);

    return NextResponse.json(assets);
  } catch (error: any) {
    console.error('Vault API error:', error);
    return NextResponse.json({ error: 'Failed to fetch vault assets' }, { status: 500 });
  }
}
