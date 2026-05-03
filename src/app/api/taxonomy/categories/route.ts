import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError } from '@infrastructure/server/apiGuards';

export async function GET() {
  try {
    const services = await getServerServices();
    const categories = await services.taxonomyService.getAllCategories();
    return NextResponse.json(categories);
  } catch (error) {
    return jsonError(error, 'Failed to list categories');
  }
}
