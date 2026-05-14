import type { ProductSalesChannel, ProductMedia, DigitalAsset, ProductOption, ProductVariant } from '@domain/models';

export interface ProductFormState {
  name: string;
  description: string;
  imageUrl: string;
  media: ProductMedia[];
  price: string;
  compareAtPrice: string;
  cost: string;
  stock: string;
  sku: string;
  barcode: string;
  trackQuantity: boolean;
  continueSellingWhenOutOfStock: boolean;
  reorderPoint: string;
  reorderQuantity: string;
  physicalItem: boolean;
  weightGrams: string;
  status: 'active' | 'draft' | 'archived';
  salesChannels: ProductSalesChannel[];
  category: string;
  productType: string;
  vendor: string;
  collections: string;
  tags: string;
  handle: string;
  seoTitle: string;
  seoDescription: string;
  manufacturer: string;
  supplier: string;
  manufacturerSku: string;
  set: string;
  rarity: string;
  adminNotes: string;
  isDigital: boolean;
  digitalAssets: DigitalAsset[];
  shippingClassId: string;
  metafields: Record<string, string | number | boolean | null>;
  
  // Variations
  hasVariants: boolean;
  options: ProductOption[];
  variants: ProductVariant[];
}

export const INITIAL_FORM_STATE: ProductFormState = {
  name: '',
  description: '',
  imageUrl: '',
  media: [],
  price: '',
  compareAtPrice: '',
  cost: '',
  stock: '',
  sku: '',
  barcode: '',
  trackQuantity: true,
  continueSellingWhenOutOfStock: false,
  reorderPoint: '',
  reorderQuantity: '',
  physicalItem: true,
  weightGrams: '',
  status: 'active',
  salesChannels: ['online_store'],
  category: 'general',
  productType: '',
  vendor: '',
  collections: '',
  tags: '',
  handle: '',
  seoTitle: '',
  seoDescription: '',
  manufacturer: '',
  supplier: '',
  manufacturerSku: '',
  set: '',
  rarity: '',
  adminNotes: '',
  isDigital: false,
  digitalAssets: [],
  shippingClassId: '',
  metafields: {},
  hasVariants: false,
  options: [],
  variants: [],
};

export const CLASSIFICATIONS = ['New', 'Refurbished', 'Vintage', 'Limited Edition', 'Standard'];

export const SALES_CHANNELS: Array<{ value: ProductSalesChannel; label: string }> = [
  { value: 'online_store', label: 'Online store' },
  { value: 'pos', label: 'Point of sale' },
  { value: 'draft_order', label: 'Draft orders' },
];
