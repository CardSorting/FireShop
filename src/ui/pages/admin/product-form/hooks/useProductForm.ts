import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useServices } from '../../../../hooks/useServices';
import { useToast } from '../../../../components/admin/AdminComponents';
import type { Product, ProductCategory, ProductSalesChannel, ProductType } from '@domain/models';
import { INITIAL_FORM_STATE, ProductFormState } from '../types';
import { centsFromInput, integerFromInput, listToCsv, csvToList } from '../utils';
import { validatePriceCents, validateStock } from '@utils/validators';
import { slugify } from '@utils/navigation';


export function useProductForm(id?: string) {
  const router = useRouter();
  const services = useServices();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<ProductFormState>(INITIAL_FORM_STATE);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState(false);

  const loadTaxonomy = useCallback(async () => {
    try {
      const [cats, types] = await Promise.all([
        services.taxonomyService.getCategories(),
        services.taxonomyService.getTypes(),
      ]);
      setCategories(cats);
      setProductTypes(types);
    } catch (err) {
      console.error('Failed to load taxonomy:', err);
    }
  }, [services.taxonomyService]);

  useEffect(() => {
    void loadTaxonomy();
  }, [loadTaxonomy]);

  const loadProduct = useCallback(async () => {
    if (!id) return;
    setLoadingProduct(true);
    try {
      const product: Product = await services.productService.getProduct(id);
      setForm({
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        media: product.media || [],
        price: (product.price / 100).toFixed(2),
        compareAtPrice: product.compareAtPrice !== undefined ? (product.compareAtPrice / 100).toFixed(2) : '',
        cost: product.cost !== undefined ? (product.cost / 100).toFixed(2) : '',
        stock: String(product.stock),
        sku: product.sku ?? '',
        barcode: product.barcode ?? '',
        trackQuantity: product.trackQuantity ?? true,
        continueSellingWhenOutOfStock: product.continueSellingWhenOutOfStock ?? false,
        reorderPoint: product.reorderPoint !== undefined ? String(product.reorderPoint) : '',
        reorderQuantity: product.reorderQuantity !== undefined ? String(product.reorderQuantity) : '',
        physicalItem: product.physicalItem ?? true,
        weightGrams: product.weightGrams !== undefined ? String(product.weightGrams) : '',
        status: product.status,
        salesChannels: product.salesChannels ?? ['online_store'],
        category: product.category,
        productType: product.productType ?? '',
        vendor: product.vendor ?? '',
        collections: listToCsv(product.collections),
        tags: listToCsv(product.tags),
        handle: product.handle ?? '',
        seoTitle: product.seoTitle ?? '',
        seoDescription: product.seoDescription ?? '',
        manufacturer: product.manufacturer ?? '',
        supplier: product.supplier ?? '',
        manufacturerSku: product.manufacturerSku ?? '',
        set: product.set ?? '',
        rarity: product.rarity ?? '',
        adminNotes: '',
        isDigital: product.isDigital ?? false,
        digitalAssets: product.digitalAssets ?? [],
        hasVariants: product.hasVariants ?? false,
        options: product.options ?? [],
        variants: product.variants ?? [],
      });
      setUnsaved(false);
    } catch {
      setError('Failed to load product for editing.');
    } finally {
      setLoadingProduct(false);
    }
  }, [id, services.productService]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setUnsaved(true);
  }

  function handleCheckbox(name: keyof ProductFormState, checked: boolean) {
    setForm((current) => ({ ...current, [name]: checked }));
    setUnsaved(true);
  }

  function toggleSalesChannel(channel: ProductSalesChannel) {
    setForm((current) => {
      const next = current.salesChannels.includes(channel)
        ? current.salesChannels.filter((item) => item !== channel)
        : [...current.salesChannels, channel];
      return { ...current, salesChannels: next };
    });
    setUnsaved(true);
  }

  function setFieldValue(name: keyof ProductFormState, value: any) {
    setForm((current) => ({ ...current, [name]: value }));
    setUnsaved(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const price = centsFromInput(form.price) ?? NaN;
    const compareAtPrice = centsFromInput(form.compareAtPrice);
    const cost = centsFromInput(form.cost);
    const stock = Number(form.stock);
    const priceValidation = validatePriceCents(price);
    const compareAtPriceValidation = compareAtPrice !== undefined ? validatePriceCents(compareAtPrice) : { valid: true };
    const costValidation = cost !== undefined ? validatePriceCents(cost) : { valid: true };
    const stockValidation = validateStock(stock);

    if (!priceValidation.valid || !compareAtPriceValidation.valid || !costValidation.valid || !stockValidation.valid) {
      setError(priceValidation.message ?? compareAtPriceValidation.message ?? costValidation.message ?? stockValidation.message ?? 'Product values are invalid');
      setSaving(false);
      return;
    }

    const data = {
      name: form.name,
      description: form.description,
      price,
      compareAtPrice,
      cost,
      category: form.category,
      productType: form.productType || undefined,
      vendor: form.vendor || undefined,
      tags: csvToList(form.tags),
      collections: csvToList(form.collections),
      handle: form.handle || undefined,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      salesChannels: form.salesChannels,
      stock,
      trackQuantity: form.trackQuantity,
      continueSellingWhenOutOfStock: form.continueSellingWhenOutOfStock,
      reorderPoint: integerFromInput(form.reorderPoint),
      reorderQuantity: integerFromInput(form.reorderQuantity),
      physicalItem: form.physicalItem,
      weightGrams: integerFromInput(form.weightGrams),
      sku: form.sku || undefined,
      manufacturer: form.manufacturer || undefined,
      supplier: form.supplier || undefined,
      manufacturerSku: form.manufacturerSku || undefined,
      barcode: form.barcode || undefined,
      imageUrl: form.imageUrl || (form.media[0]?.url) || 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400',
      media: form.media,
      status: form.status,
      set: form.set || undefined,
      rarity: form.rarity || undefined,
      isDigital: form.isDigital,
      digitalAssets: form.digitalAssets,
      hasVariants: form.hasVariants,
      options: form.options,
      variants: form.variants,
    };

    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      if (isEdit && id) {
        await services.productService.updateProduct(id, data, actor);
        toast('success', 'Product updated successfully');
      } else {
        await services.productService.createProduct(data, actor);
        toast('success', 'Product created successfully');
      }
      setUnsaved(false);
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      const newCat = await services.taxonomyService.saveCategory({ name: newCategoryName }, actor);
      setCategories(prev => [...prev, newCat]);
      setForm(f => ({ ...f, category: newCat.slug }));
      setNewCategoryName('');
      setShowAddCategory(false);
      toast('success', 'Category added');
    } catch (err) {
      toast('error', 'Failed to add category');
    }
  }

  async function handleAddType() {
    if (!newTypeName.trim()) return;
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      const newType = await services.taxonomyService.saveType({ name: newTypeName }, actor);
      setProductTypes(prev => [...prev, newType]);
      setForm(f => ({ ...f, productType: newType.name }));
      setNewTypeName('');
      setShowAddType(false);
      toast('success', 'Product type added');
    } catch (err) {
      toast('error', 'Failed to add product type');
    }
  }

  async function handleDuplicate() {
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      
      const copyData = {
        ...form,
        name: `${form.name} (Copy)`,
        handle: `${form.handle}-copy`,
        status: 'draft' as const,
      };

      const price = centsFromInput(copyData.price) ?? 0;
      const compareAtPrice = centsFromInput(copyData.compareAtPrice);
      const cost = centsFromInput(copyData.cost);
      const stock = Number(copyData.stock) || 0;

      const data = {
        name: copyData.name,
        description: copyData.description,
        price,
        compareAtPrice,
        cost,
        category: copyData.category,
        productType: copyData.productType || undefined,
        vendor: copyData.vendor || undefined,
        tags: csvToList(copyData.tags),
        collections: csvToList(copyData.collections),
        handle: copyData.handle || undefined,
        seoTitle: copyData.seoTitle || undefined,
        seoDescription: copyData.seoDescription || undefined,
        salesChannels: copyData.salesChannels,
        stock,
        trackQuantity: copyData.trackQuantity,
        continueSellingWhenOutOfStock: copyData.continueSellingWhenOutOfStock,
        reorderPoint: integerFromInput(copyData.reorderPoint),
        reorderQuantity: integerFromInput(copyData.reorderQuantity),
        physicalItem: copyData.physicalItem,
        weightGrams: integerFromInput(copyData.weightGrams),
        sku: copyData.sku || undefined,
        manufacturer: copyData.manufacturer || undefined,
        supplier: copyData.supplier || undefined,
        manufacturerSku: copyData.manufacturerSku || undefined,
        barcode: copyData.barcode || undefined,
        imageUrl: copyData.imageUrl || (copyData.media[0]?.url) || 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400',
        media: copyData.media,
        status: copyData.status,
        set: copyData.set || undefined,
        rarity: copyData.rarity || undefined,
        isDigital: copyData.isDigital,
        digitalAssets: copyData.digitalAssets,
        hasVariants: copyData.hasVariants,
        options: copyData.options,
        variants: copyData.variants,
      };

      const newProduct = await services.productService.createProduct(data, actor);
      toast('success', 'Product duplicated as draft');
      router.push(`/admin/products/${newProduct.id}`);
    } catch (err) {
      toast('error', 'Failed to duplicate product');
    }
  }

  function generateHandle() {
    const newHandle = slugify(form.name);
    setForm(f => ({ ...f, handle: newHandle }));
    setUnsaved(true);
    toast('info', 'Handle generated from title');
  }


  return {
    form,
    setForm,
    categories,
    productTypes,
    newCategoryName,
    setNewCategoryName,
    newTypeName,
    setNewTypeName,
    showAddCategory,
    setShowAddCategory,
    showAddType,
    setShowAddType,
    saving,
    loadingProduct,
    error,
    setError,
    unsaved,
    setUnsaved,
    handleChange,
    handleCheckbox,
    toggleSalesChannel,
    setFieldValue,
    handleSubmit,
    handleAddCategory,
    handleAddType,
    handleDuplicate,
    generateHandle,
  };
}
