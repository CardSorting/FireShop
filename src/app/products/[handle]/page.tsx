import { ProductDetailPage } from '@ui/pages/product-detail';
import { getServerServices } from '@infrastructure/server/services';
import type { Metadata } from 'next';

import { notFound, redirect } from 'next/navigation';

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
                redirect(`/products/${product.handle}`);
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
    
    const title = product.seoTitle || `${product.name} | DreamBeesArt`;
    const description = product.seoDescription || product.description.slice(0, 160);
    
    return {
        title,
        description,
        alternates: {
            canonical: `/products/${product.handle || product.id}`,
        },
        openGraph: {
            title: product.name,
            description: product.description,
            images: [product.imageUrl],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: product.name,
            description: product.description,
            images: [product.imageUrl],
        },
    };
}

export default async function Page({ params }: Props) {
    const { handle } = await params;
    const product = await getProduct(handle);
    if (!product) notFound();

    // Industry Standard: Inject JSON-LD for rich snippets
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.imageUrl,
        description: product.description,
        sku: product.sku,
        offers: {
            '@type': 'Offer',
            price: (product.price / 100).toFixed(2),
            priceCurrency: 'USD',
            availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `https://dreambeesart.com/products/${product.handle || product.id}`,
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProductDetailPage initialProduct={product} />
        </>
    );
}

