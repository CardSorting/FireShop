import { getServerServices } from '@infrastructure/server/services';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { productImages, productPath, productSeoDescription, productSeoTitle } from '@utils/seo';

type Props = {
    params: Promise<{ slug: string; handle: string }>;
};

async function getProduct(handle: string) {
    const services = await getServerServices();
    try {
        return await services.productService.getProductByHandle(handle);
    } catch {
        try {
            const product = await services.productService.getProduct(handle);
            if (product.handle && product.handle !== handle) {
                permanentRedirect(productPath(product));
            }
            return product;
        } catch {
            return null;
        }
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug, handle } = await params;
    const product = await getProduct(handle);
    
    if (!product) {
        return { title: 'Product Not Found | DreamBeesArt' };
    }
    
    const description = productSeoDescription(product);
    
    return {
        title: productSeoTitle(product),
        description,
        alternates: {
            canonical: productPath(product),
        },
        openGraph: {
            title: product.name,
            description,
            images: productImages(product),
        },
    };
}

export default async function Page({ params }: Props) {
    const { handle } = await params;
    const product = await getProduct(handle);
    if (!product) notFound();
    permanentRedirect(productPath(product));
}
