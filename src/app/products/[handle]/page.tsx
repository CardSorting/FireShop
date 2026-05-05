import { ProductDetailPage } from '@ui/pages/product-detail';
import { getServerServices } from '@infrastructure/server/services';
import type { Metadata } from 'next';
import { breadcrumbJsonLd, productImages, productJsonLd, productPath, productSeoDescription, productSeoTitle } from '@utils/seo';

import { notFound, permanentRedirect } from 'next/navigation';

type Props = {
    params: Promise<{ handle: string }>;
};

async function getProduct(handle: string) {
    const services = await getServerServices();
    try {
        // Try handle first
        return await services.productService.getProductByHandle(handle);
    } catch {
        // Fallback to ID
        try {
            const product = await services.productService.getProduct(handle);
            // If we found it by ID and it has a handle, 301 redirect to the canonical handle URL
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
    const { handle } = await params;
    const product = await getProduct(handle);
    
    if (!product) {
        return {
            title: 'Product Not Found | DreamBeesArt',
        };
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
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
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

    const jsonLd = [
        breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Catalog', path: '/products' },
            { name: product.name, path: productPath(product) },
        ]),
        productJsonLd(product),
    ];

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProductDetailPage initialProduct={JSON.parse(JSON.stringify(product))} />
        </>
    );
}
