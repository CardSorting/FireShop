import { ProductDetailPage } from '@ui/pages/ProductDetailPage';
import { getServerServices } from '@infrastructure/server/services';
import type { Metadata } from 'next';

type Props = {
    params: { handle: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const services = await getServerServices();
        // Try handle first, then fallback to ID
        let product;
        try {
            product = await services.productService.getProductByHandle(params.handle);
        } catch {
            product = await services.productService.getProduct(params.handle);
        }
        
        return {
            title: `${product.name} | PlayMoreTCG`,
            description: product.description.slice(0, 160),
            openGraph: {
                title: product.name,
                description: product.description,
                images: [product.imageUrl],
            },
        };
    } catch {
        return {
            title: 'Product Not Found | PlayMoreTCG',
        };
    }
}

export default function Page() {
    return <ProductDetailPage />;
}
