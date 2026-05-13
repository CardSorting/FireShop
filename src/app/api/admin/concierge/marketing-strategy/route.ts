import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';
import { logger } from '@utils/logger';

export async function GET() {
  try {
    const { campaignService, authService } = getInitialServices();
    const user = await authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const strategy = await campaignService.getConciergeMarketingStrategy();
    return NextResponse.json(strategy);
  } catch (error: any) {
    logger.error('Failed to build concierge marketing strategy', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { campaignService, authService, auditService } = getInitialServices();
    const user = await authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (body?.action === 'create_missing_lifecycle_playbooks') {
      const campaigns = await campaignService.createMissingLifecyclePlaybooks();
      await auditService.record({
        userId: user.id,
        userEmail: user.email,
        action: 'campaign_created',
        targetId: 'lifecycle_strategy',
        details: {
          source: 'concierge_marketing_strategy',
          createdCount: campaigns.length,
          campaignIds: campaigns.map((campaign) => campaign.id),
        },
      });

      return NextResponse.json({ created: campaigns });
    }

    if (body?.action === 'run_lifecycle_automation_pulse') {
      await campaignService.runAutomationPulse();
      return NextResponse.json({ status: 'pulse_completed' });
    }

    if (body?.action === 'optimize_lifecycle_strategy') {
      const report = await campaignService.optimizeLifecycleStrategy();
      return NextResponse.json(report);
    }

    if (body?.action === 'activate_all_lifecycle_playbooks') {
      const campaigns = await campaignService.activateAllLifecyclePlaybooks();
      return NextResponse.json({ activated: campaigns });
    }

    if (body?.action === 'pause_all_lifecycle_playbooks') {
      const campaigns = await campaignService.pauseAllLifecyclePlaybooks();
      return NextResponse.json({ paused: campaigns });
    }

    if (body?.action === 'activate_playbook') {
      const campaign = await campaignService.activatePlaybook(body.playbookId);
      await auditService.record({
        userId: user.id,
        userEmail: user.email,
        action: 'campaign_created',
        targetId: campaign.id,
        details: { playbookId: body.playbookId, source: 'concierge_marketing_strategy', status: 'active' },
      });
      return NextResponse.json(campaign);
    }

    if (body?.action === 'pause_playbook') {
      const campaign = await campaignService.pausePlaybook(body.playbookId);
      return NextResponse.json(campaign);
    }

    if (body?.action === 'plan_customer_lifecycle') {
      if (!body.userId || typeof body.userId !== 'string') {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
      }
      const plan = await campaignService.planCustomerLifecycle(body.userId);
      return NextResponse.json(plan);
    }

    if (body?.action === 'enroll_customer_lifecycle') {
      if (!body.userId || typeof body.userId !== 'string') {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
      }
      const result = await campaignService.enrollCustomerInLifecycle(body.userId, body.playbookId);
      return NextResponse.json(result);
    }

    const playbookId = body?.playbookId;
    if (!playbookId || typeof playbookId !== 'string') {
      return NextResponse.json({ error: 'playbookId is required' }, { status: 400 });
    }

    const campaign = await campaignService.createCampaignFromPlaybook(playbookId);
    await auditService.record({
      userId: user.id,
      userEmail: user.email,
      action: 'campaign_created',
      targetId: campaign.id,
      details: { playbookId, source: 'concierge_marketing_strategy', name: campaign.name, type: campaign.type },
    });

    return NextResponse.json(campaign);
  } catch (error: any) {
    logger.error('Failed to create concierge marketing playbook', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
