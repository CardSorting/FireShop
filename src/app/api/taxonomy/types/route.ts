import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError } from '@infrastructure/server/apiGuards';

export async function GET() {
  try {
    const services = await getServerServices();
    const types = await services.taxonomyService.getAllTypes();
    return NextResponse.json(types);
  } catch (error) {
    return jsonError(error, 'Failed to list product types');
  }
}
