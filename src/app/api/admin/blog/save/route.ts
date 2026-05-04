import { NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';


export async function POST(req: Request) {
  try {
    const services = getInitialServices();
    const body = await req.json();
    
    // Save the article
    await services.knowledgebaseRepository.saveArticle({

      ...body,
      createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      updatedAt: new Date(),
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
