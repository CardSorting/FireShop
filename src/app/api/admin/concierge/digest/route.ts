import { NextResponse } from 'next/server';
import { conciergeService } from '@core/ConciergeService';
import { logger } from '@utils/logger';

export async function GET() {
  try {
    const digest = await conciergeService.generateStoreDigest();
    if (!digest) throw new Error('Failed to generate digest');
    return NextResponse.json(digest);
  } catch (error: any) {
    logger.error('Digest API error', error);
    return NextResponse.json({ error: 'Failed to load intelligence' }, { status: 500 });
  }
}
