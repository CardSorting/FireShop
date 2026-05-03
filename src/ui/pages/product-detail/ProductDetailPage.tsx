'use client';

/**
 * [LAYER: UI]
 * ProductDetailPage — Orchestrator
 *
 * Composes all PDP sub-components and wires them to the useProductDetail hook.
 * Layout follows the Shopify 3-column pattern: Gallery | Info | Buy Box
 */
import { useProductDetail } from './useProductDetail';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductInfo } from './ProductInfo';
import { ProductVariantSelector } from './ProductVariantSelector';
import { ProductDetails } from './ProductDetails';
import { ProductBuyBox } from './ProductBuyBox';
import { RelatedProducts, RecentlyViewed } from './RelatedProducts';
import { ProductReviews } from '../../components/ProductReviews';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { getCollectionUrl, STORE_PATHS } from '@utils/navigation';
import type { Product } from '@domain/models';

interface ProductDetailPageProps {
  initialProduct?: Product | null;
}

export function ProductDetailPage({ initialProduct }: ProductDetailPageProps) {
  const pdp = useProductDetail(initialProduct);

  // --- Loading Skeleton ---
  if (pdp.loading || !pdp.product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-4 w-48 bg-gray-200 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 aspect-4/5 bg-gray-100 rounded-4xl" />
          <div className="lg:col-span-3 space-y-6">
            <div className="h-6 w-24 bg-gray-100 rounded-lg" />
            <div className="h-10 w-3/4 bg-gray-200 rounded-xl" />
            <div className="h-4 w-1/3 bg-gray-100 rounded-lg" />
            <div className="h-24 w-full bg-gray-50 rounded-2xl" />
          </div>
          <div className="lg:col-span-3 h-[500px] bg-gray-50 rounded-4xl border border-gray-100" />
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (pdp.error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🔍</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-3">Product Not Found</h1>
        <p className="text-gray-500 font-medium mb-8">The product you're looking for may have been removed or is temporarily unavailable.</p>
        <a href={STORE_PATHS.PRODUCTS} className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-black transition-colors">
          Browse Catalog
        </a>
      </div>
    );
  }

  const { product } = pdp;

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Catalog', href: STORE_PATHS.PRODUCTS },
            { label: product.category, href: getCollectionUrl(product.category) },
            { label: product.name }
          ]}
        />

        {/* Main 3-Column Layout: Gallery | Info | Buy Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mt-8 items-start">
          {/* Left: Image Gallery (sticky) */}
          <div className="lg:col-span-6 lg:sticky lg:top-28">
            <ProductImageGallery
              images={pdp.allImages}
              selectedIndex={pdp.selectedImageIndex}
              onSelect={pdp.setSelectedImageIndex}
              productName={product.name}
            />
          </div>

          {/* Middle: Product Info + Details */}
          <div className="lg:col-span-3 space-y-8">
            <ProductInfo
              name={product.name}
              vendor={product.vendor}
              category={product.category}
              currentPrice={pdp.currentPrice}
              compareAtPrice={pdp.currentCompareAtPrice}
            />

            {/* Variant Selector */}
            {product.hasVariants && product.options && (
              <ProductVariantSelector
                options={product.options}
                selectedOptions={pdp.selectedOptions}
                onSelect={pdp.selectOption}
              />
            )}

            {/* Accordion: Description, Specs, Shipping */}
            <ProductDetails product={product} />
          </div>

          {/* Right: Buy Box (sticky) */}
          <div className="lg:col-span-3 lg:sticky lg:top-28">
            <ProductBuyBox
              currentPrice={pdp.currentPrice}
              compareAtPrice={pdp.currentCompareAtPrice}
              currentStock={pdp.currentStock}
              quantity={pdp.quantity}
              maxSelectableQuantity={pdp.maxSelectableQuantity}
              adding={pdp.adding}
              added={pdp.added}
              cartError={pdp.cartError}
              isFavorite={pdp.isFavorite}
              wishlists={pdp.wishlists}
              showWishlistDropdown={pdp.showWishlistDropdown}
              setShowWishlistDropdown={pdp.setShowWishlistDropdown}
              newCollectionName={pdp.newCollectionName}
              setNewCollectionName={pdp.setNewCollectionName}
              creatingCollection={pdp.creatingCollection}
              onAddToCart={pdp.handleAddToCart}
              onIncrement={pdp.incrementQuantity}
              onDecrement={pdp.decrementQuantity}
              onAddToCollection={pdp.handleAddToCollection}
              onCreateAndAdd={pdp.handleCreateAndAdd}
              onOpenCart={pdp.openCart}
            />
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews" className="mt-24 pt-16 border-t border-gray-100">
          <ProductReviews productId={product.id} />
        </div>

        {/* Related Products */}
        <RelatedProducts
          products={pdp.relatedProducts}
          loading={pdp.loadingRelated}
        />

        {/* Recently Viewed */}
        <RecentlyViewed
          products={pdp.recentlyViewed}
          currentProductId={product.id}
        />
      </div>
    </div>
  );
}
