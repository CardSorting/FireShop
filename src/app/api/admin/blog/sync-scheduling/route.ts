import { NextRequest, NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';
import { hasValidBearerToken, jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

/**
 * API to trigger publishing of scheduled blog posts.
 * This should be called by a CRON job every 15-60 minutes.
 */
export async function POST(req: NextRequest) {
  try {
    if (!hasValidBearerToken(req, process.env.CRON_SECRET)) {
      await requireAdminSession(req);
    }
    const services = getInitialServices();
    const now = new Date();
    
    // Find all scheduled articles that should be published by now
    const data = await services.knowledgebaseRepository.getArticles({ 
      type: 'blog', 
      status: 'all' 
    });
    const articles = data.articles;
    
    const toPublish = articles.filter(a => 
      a.status === 'scheduled' && 
      a.scheduledAt && 
      new Date(a.scheduledAt) <= now
    );
    
    if (toPublish.length > 0) {
      const ids = toPublish.map(a => a.id);
      await services.knowledgebaseRepository.batchUpdateArticles(ids, { 
        status: 'published',
        publishedAt: now 
      });
    }

    return NextResponse.json({ 
      success: true, 
      publishedCount: toPublish.length 
    });
  } catch (err) {
    console.error('Scheduling sync failed:', err);
    return jsonError(err, 'Failed to sync scheduled posts');
  }
}
