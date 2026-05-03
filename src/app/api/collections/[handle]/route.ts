/**
 * [LAYER: INFRASTRUCTURE]
 * Public API Route for Collections by Handle
 */
import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError } from '@infrastructure/server/apiGuards';

export async function GET(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await params;
    const services = await getServerServices();
    
    // We attempt to get by handle first, then fallback to ID if it looks like a UUID
    let collection = await services.collectionService.getByHandle(handle);
    
    if (!collection && handle.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      collection = await services.collectionService.get(handle);
    }
    
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }
    
    return NextResponse.json(collection);
  } catch (error) {
    return jsonError(error, 'Failed to fetch collection metadata');
  }
}
