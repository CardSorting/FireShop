'use client';

/**
 * [LAYER: UI]
 * Custom hook: encapsulates ALL state management and data fetching
 * for the Product Detail Page. Keeps the view layer clean.
 */
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import type { Product } from '@domain/models';
import { MAX_CART_QUANTITY } from '@domain/rules';
import { logger } from '@utils/logger';
import { sanitizeImageUrl } from '@utils/imageSanitizer';

function toFriendlyError(err: unknown): string {
  if (err instanceof Error && err.message) {
    if (/insufficient stock/i.test(err.message)) {
      const available = err.message.match(/available\s+(\d+)/i)?.[1];
      return available
        ? `Only ${available} available right now. Please choose a lower quantity.`
        : 'This item has limited availability. Please choose a lower quantity.';
    }
    return err.message;
  }
  return 'Unable to add this item to your cart right now.';
}

function optionParamName(optionName: string, index: number): string {
  return optionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `option-${index + 1}`;
}

export function useProductDetail(initialProduct?: Product | null) {
  const { handle } = useParams<{ handle: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addItem, openCart } = useCart();
  const services = useServices();
  const { 
    wishlists, 
    isInWishlist, 
    addToWishlist, 
    createCollection, 
    trackView,
    recentlyViewed
  } = useWishlist();

  // --- Core State ---
  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!initialProduct);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Buy Box State ---
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  // --- Variant State ---
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // --- Gallery State ---
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // --- Wishlist State ---
  const [showWishlistDropdown, setShowWishlistDropdown] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const relatedControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);
  const addedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (addedTimerRef.current !== null) {
        window.clearTimeout(addedTimerRef.current);
      }
    };
  }, []);

  const isFavorite = product?.id ? isInWishlist(product.id) : false;

  const router = useRouter();

  // Initialize variant options from URL parameters when product is available.
  useEffect(() => {
    if (product?.hasVariants && product.options) {
      const initial: Record<string, string> = {};
      product.options.forEach((opt, index) => {
        const requestedValue = searchParams.get(optionParamName(opt.name, index));
        initial[opt.name] = requestedValue && opt.values.includes(requestedValue) ? requestedValue : opt.values[0];
      });
      setSelectedOptions(initial);
    }
  }, [product, searchParams]);

  useEffect(() => {
    if (product) {
      trackView(product);
    }
  }, [product, trackView]);

  // --- Data Loading ---
  const loadProduct = useCallback(async () => {
    if (!handle || initialProduct) {
      if (initialProduct) {
        console.log('[PDP] Using initialProduct:', {
          id: initialProduct.id,
          handle: initialProduct.handle,
          imageUrl: initialProduct.imageUrl,
          mediaCount: initialProduct.media?.length,
          variantCount: initialProduct.variants?.length
        });
      }
      return;
    }
    
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      let loaded: Product | null = null;
      
      // 1. Try to find by handle first (Canonical)
      try {
        loaded = await services.productService.getProductByHandle(handle, controller.signal);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        // 2. If not found by handle, try finding by ID (Legacy fallback)
        try {
          loaded = await services.productService.getProduct(handle, controller.signal);
        } catch (idErr: any) {
          if (idErr.name === 'AbortError') return;
          throw err; // Throw the original handle error if ID also fails
        }
      }

      if (!controller.signal.aborted && loaded) {
        console.log('[PDP] Loaded product data:', {
          id: loaded.id,
          handle: loaded.handle,
          imageUrl: loaded.imageUrl,
          media: loaded.media?.map(m => m.url),
          variants: loaded.variants?.map(v => v.imageUrl)
        });

        // 3. CANONICAL REDIRECT: If the current URL handle is actually an ID, 
        // or if it's an old handle, redirect to the official handle.
        if (loaded.handle && handle !== loaded.handle) {
          logger.info(`Redirecting from legacy/alternate handle "${handle}" to canonical "${loaded.handle}"`);
          router.replace(`/products/${loaded.handle}`);
          return; // The router will handle the navigation
        }
        
        setProduct(loaded);
        setSelectedImageIndex(0);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      logger.error('Failed to load product', err);
      setError('Product not found.');
    } finally {
      if (!controller.signal.aborted && isMounted.current) {
        setLoading(false);
      }
    }
  }, [handle, initialProduct, services.productService, router]);

  const loadRelated = useCallback(async () => {
    if (!product) return;
    
    relatedControllerRef.current?.abort();
    const controller = new AbortController();
    relatedControllerRef.current = controller;

    setLoadingRelated(true);
    try {
      let related;
      try {
        related = await services.productService.getProducts({ 
          category: product.category, 
          limit: 5,
          signal: controller.signal
        });
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        related = await services.productService.getProducts({ 
          limit: 5,
          signal: controller.signal
        });
      }
      
      if (!controller.signal.aborted) {
        setRelatedProducts(related.products.filter(p => p.id !== product.id).slice(0, 4));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      logger.error('Failed to load related products', err);
    } finally {
      if (!controller.signal.aborted && isMounted.current) {
        setLoadingRelated(false);
      }
    }
  }, [product, services.productService]);

  useEffect(() => { 
    void loadProduct(); 
    return () => controllerRef.current?.abort();
  }, [loadProduct]);

  useEffect(() => { 
    void loadRelated(); 
    return () => relatedControllerRef.current?.abort();
  }, [loadRelated]);

  // --- Variant Matching ---
  const selectedVariant = useMemo(() => {
    if (!product?.hasVariants || !product.variants) return null;
    return product.variants.find(v => {
      const match1 = v.option1 === selectedOptions[product.options![0]?.name];
      const match2 = !product.options![1] || v.option2 === selectedOptions[product.options![1].name];
      const match3 = !product.options![2] || v.option3 === selectedOptions[product.options![2].name];
      return match1 && match2 && match3;
    }) || null;
  }, [product, selectedOptions]);

  // --- Derived Values ---
  const currentPrice = selectedVariant ? selectedVariant.price : (product?.price ?? 0);
  const currentCompareAtPrice = (selectedVariant ? selectedVariant.compareAtPrice : product?.compareAtPrice) ?? null;
  const currentStock = selectedVariant ? selectedVariant.stock : (product?.stock ?? 0);
  const currentSku = selectedVariant ? selectedVariant.sku : product?.sku;
  const maxSelectableQuantity = Math.max(1, Math.min(currentStock, MAX_CART_QUANTITY));

  // Build image list: primary image + media gallery
  const allImages = useMemo(() => {
    if (!product) return [];
    const images: { url: string; alt: string }[] = [];
    
    // Helper to validate and normalize URLs
    const addImage = (url: string | undefined | null, alt: string) => {
      const sanitized = sanitizeImageUrl(url, '');
      if (sanitized) {
        images.push({ url: sanitized, alt });
      }
    };

    addImage(product.imageUrl, product.name);
    
    if (product.media) {
      product.media.forEach(m => {
        if (m.url !== product.imageUrl) {
          addImage(m.url, m.altText || product.name);
        }
      });
    }

    // If variant has its own image, prepend it
    if (selectedVariant?.imageUrl) {
      const sanitizedVariantUrl = sanitizeImageUrl(selectedVariant.imageUrl, '');
      if (sanitizedVariantUrl) {
        const exists = images.find(i => i.url === sanitizedVariantUrl);
        if (!exists) {
          images.unshift({ url: sanitizedVariantUrl, alt: selectedVariant.title || product.name });
        }
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const uniqueImages = images.filter(img => {
      if (seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    });

    return uniqueImages.length > 0 
      ? uniqueImages 
      : [{ url: 'https://placehold.co/800x1000?text=No+Image', alt: 'No image' }];
  }, [product, selectedVariant]);

  const currentImage = allImages[selectedImageIndex]?.url || allImages[0]?.url;

  // --- Actions ---
  async function handleAddToCart() {
    if (!product) return;
    setAdding(true);
    setCartError(null);
    try {
      await addItem(product.id, Math.min(quantity, maxSelectableQuantity), selectedVariant?.id);
      if (isMounted.current) {
        setAdded(true);
        if (addedTimerRef.current !== null) {
          window.clearTimeout(addedTimerRef.current);
        }
        addedTimerRef.current = window.setTimeout(() => {
          if (isMounted.current) setAdded(false);
          addedTimerRef.current = null;
        }, 2500);
      }
    } catch (err) {
      if (isMounted.current) {
        setCartError(toFriendlyError(err));
      }
    } finally {
      if (isMounted.current) {
        setAdding(false);
      }
    }
  }

  async function handleAddToCollection(wishlistId: string) {
    if (!product?.id) return;
    await addToWishlist(product.id, wishlistId);
    setShowWishlistDropdown(false);
  }

  async function handleCreateAndAdd() {
    if (!newCollectionName.trim()) return;
    setCreatingCollection(true);
    try {
      const newList = await createCollection(newCollectionName.trim());
      if (isMounted.current) {
        if (product?.id) await addToWishlist(product.id, newList.id);
        setNewCollectionName('');
        setShowWishlistDropdown(false);
      }
    } finally {
      if (isMounted.current) {
        setCreatingCollection(false);
      }
    }
  }

  function incrementQuantity() { setQuantity(Math.min(maxSelectableQuantity, quantity + 1)); }
  function decrementQuantity() { setQuantity(Math.max(1, quantity - 1)); }
  function selectOption(optionName: string, value: string) {
    setSelectedOptions(prev => {
      const next = { ...prev, [optionName]: value };
      if (product?.options) {
        const params = new URLSearchParams(searchParams.toString());
        product.options.forEach((option, index) => {
          const selectedValue = next[option.name];
          if (selectedValue) params.set(optionParamName(option.name, index), selectedValue);
        });
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
      return next;
    });
  }

  return {
    // Data
    product, relatedProducts, recentlyViewed, selectedVariant, allImages,
    // Derived
    currentPrice, currentCompareAtPrice, currentStock, currentSku,
    currentImage, maxSelectableQuantity,
    // State
    loading, loadingRelated, error, quantity, adding, added, cartError,
    selectedOptions, selectedImageIndex, setSelectedImageIndex,
    showWishlistDropdown, setShowWishlistDropdown,
    newCollectionName, setNewCollectionName, creatingCollection,
    isFavorite, wishlists,
    // Actions
    handleAddToCart, handleAddToCollection, handleCreateAndAdd,
    incrementQuantity, decrementQuantity, selectOption, openCart,
  };
}
