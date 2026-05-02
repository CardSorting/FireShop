import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';

export async function GET(
  request: Request,
  { params }: { params: { handle: string } }
) {
  try {
    const services = await getServerServices();
    const product = await services.productService.getProductByHandle(params.handle);
    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Failed to get product by handle:', error);
    return NextResponse.json({ error: error.message || 'Product not found' }, { status: 404 });
  }
}
