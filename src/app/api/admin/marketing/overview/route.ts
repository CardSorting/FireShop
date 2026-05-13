import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';
import { logger } from '@utils/logger';

export async function GET() {
  try {
    const { campaignService, authService } = getInitialServices();
    
    // Auth check
    const user = await authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const overview = await (campaignService as any).campaignRepo.getOverview();
    
    return NextResponse.json(overview);
  } catch (error: any) {
    logger.error('Failed to fetch marketing overview', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
