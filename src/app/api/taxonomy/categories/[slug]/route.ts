import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError } from '@infrastructure/server/apiGuards';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const services = await getServerServices();
    const category = await services.taxonomyService.getCategoryBySlug(params.slug);
    
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    return NextResponse.json(category);
  } catch (error) {
    return jsonError(error, 'Failed to get category');
  }
}
