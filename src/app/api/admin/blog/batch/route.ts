import { NextRequest, NextResponse } from 'next/server';
import { getInitialServices } from '@core/container';
import { jsonError, readJsonObject, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminSession(req);
    const services = getInitialServices();
    const { ids, updates } = await readJsonObject(req);

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === 'string')) {
      return NextResponse.json({ error: 'No article IDs provided' }, { status: 400 });
    }

    await services.knowledgebaseRepository.batchUpdateArticles(ids, updates as any);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Batch update failed:', err);
    return jsonError(err, 'Failed to perform batch update');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminSession(req);
    const services = getInitialServices();
    const { ids } = await readJsonObject(req);

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === 'string')) {
      return NextResponse.json({ error: 'No article IDs provided' }, { status: 400 });
    }

    await services.knowledgebaseRepository.batchDeleteArticles(ids);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Batch delete failed:', err);
    return jsonError(err, 'Failed to perform batch delete');
  }
}
