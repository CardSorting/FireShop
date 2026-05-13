import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';
import { logger } from '@utils/logger';

export async function GET(request: Request) {
  try {
    const { campaignService, authService } = getInitialServices();
    
    // Auth check
    const user = await authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const type = searchParams.get('type') as any;

    const campaigns = await (campaignService as any).campaignRepo.getAll({ status, type });
    
    return NextResponse.json(campaigns);
  } catch (error: any) {
    logger.error('Failed to fetch campaigns', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { campaignService, authService, auditService } = getInitialServices();
    
    // Auth check
    const user = await authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const campaign = await (campaignService as any).campaignRepo.create(body);

    await auditService.record({
      userId: user.id,
      userEmail: user.email,
      action: 'campaign_created',
      targetId: campaign.id,
      details: { name: campaign.name, type: campaign.type }
    });

    return NextResponse.json(campaign);
  } catch (error: any) {
    logger.error('Failed to create campaign', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
