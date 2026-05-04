import { NextRequest, NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';

/**
 * API to trigger publishing of scheduled blog posts.
 * This should be called by a CRON job every 15-60 minutes.
 */
export async function POST(req: NextRequest) {
  try {
    const services = getInitialServices();
    const now = new Date();
    
    // Find all scheduled articles that should be published by now
    const articles = await services.knowledgebaseRepository.getArticles({ 
      type: 'blog', 
      status: 'all' 
    });
    
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
    return NextResponse.json({ error: 'Failed to sync scheduled posts' }, { status: 500 });
  }
}
