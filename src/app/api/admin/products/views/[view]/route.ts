import { NextResponse } from 'next/server';
import { DomainError } from '@domain/errors';
import type { ProductManagementFilters } from '@domain/models';
import { isProductManagementSort, isProductSavedView } from '@core/ProductService';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, parseBoundedLimit, requireAdminSession } from '@infrastructure/server/apiGuards';

function readBoolean(value: string | null): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export async function GET(request: Request, { params }: { params: Promise<{ view: string }> }) {
  try {
    await requireAdminSession();
    const { view } = await params;
    if (!isProductSavedView(view)) {
      throw new DomainError('Product saved view is invalid.');
    }

    const { searchParams } = new URL(request.url);
    const services = await getServerServices();
    const requestedSort = searchParams.get('sort') ?? undefined;
    const filters: ProductManagementFilters = {
      query: searchParams.get('query') ?? undefined,
      limit: parseBoundedLimit(searchParams.get('limit')),
      cursor: searchParams.get('cursor') ?? undefined,
      status: (searchParams.get('status') ?? undefined) as ProductManagementFilters['status'],
      category: searchParams.get('category') ?? undefined,
      vendor: searchParams.get('vendor') ?? undefined,
      productType: searchParams.get('productType') ?? undefined,
      inventoryHealth: (searchParams.get('inventoryHealth') ?? undefined) as ProductManagementFilters['inventoryHealth'],
      setupStatus: (searchParams.get('setupStatus') ?? undefined) as ProductManagementFilters['setupStatus'],
      setupIssue: (searchParams.get('setupIssue') ?? undefined) as ProductManagementFilters['setupIssue'],
      marginHealth: (searchParams.get('marginHealth') ?? undefined) as ProductManagementFilters['marginHealth'],
      tag: searchParams.get('tag') ?? undefined,
      hasSku: readBoolean(searchParams.get('hasSku')),
      hasImage: readBoolean(searchParams.get('hasImage')),
      hasCost: readBoolean(searchParams.get('hasCost')),
      sort: requestedSort && isProductManagementSort(requestedSort) ? requestedSort : undefined,
    };
    return NextResponse.json(await services.productService.getProductSavedView(view, filters));
  } catch (error) {
    return jsonError(error, 'Failed to load product saved view');
  }
}