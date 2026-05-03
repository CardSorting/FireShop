import { ProductDetailPage } from '@ui/pages/product-detail';
import { getServerServices } from '@infrastructure/server/services';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

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
                // In a nested route, we redirect to the handle version of the nested route
                // We'll be careful here to not lose the slug context
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
    
    const title = product.seoTitle || `${product.name} | ${slug} | DreamBeesArt`;
    const description = product.seoDescription || product.description.slice(0, 160);
    
    return {
        title,
        description,
        alternates: {
            // THE MOST IMPORTANT PART: Canonical always points to the primary product URL
            canonical: `/products/${product.handle || product.id}`,
        },
        openGraph: {
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
