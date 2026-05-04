import { NextRequest, NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';

export async function PATCH(req: NextRequest) {
  try {
    const services = getInitialServices();
    const { ids, updates } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No article IDs provided' }, { status: 400 });
    }

    await services.knowledgebaseRepository.batchUpdateArticles(ids, updates);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Batch update failed:', err);
    return NextResponse.json({ error: 'Failed to perform batch update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const services = getInitialServices();
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No article IDs provided' }, { status: 400 });
    }

    await services.knowledgebaseRepository.batchDeleteArticles(ids);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Batch delete failed:', err);
    return NextResponse.json({ error: 'Failed to perform batch delete' }, { status: 500 });
  }
}
