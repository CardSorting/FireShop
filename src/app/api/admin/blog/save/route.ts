import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';
import { jsonError, readJsonObject, requireAdminSession } from '@infrastructure/server/apiGuards';


export async function POST(req: Request) {
  try {
    await requireAdminSession(req);
    const services = getInitialServices();
    const body = await readJsonObject(req) as any;
    
    // Save the article
    await services.knowledgebaseRepository.saveArticle({

      ...body,
      createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      updatedAt: new Date(),
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return jsonError(err, 'Failed to save article');
  }
}
