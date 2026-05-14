import { Product, ProductStatus } from '@domain/models';
import { DocumentData } from '../../../firebase/bridge';
import { mapDoc } from '../utils';
import { 
  classifyInventoryHealth, 
  classifyProductSetupStatus, 
  classifyMarginHealth, 
  getProductSetupIssues 
} from '@domain/rules';

export function mapDocToProduct(id: string, data: DocumentData): Product {
  return mapDoc<Product>(id, data);
}

export function applyDerivedFields(data: any): any {
  // We need a helper to ensure id is present for classification
  const tempId = data.id || 'temp';
  const product = mapDocToProduct(tempId, data);
  
  return {
    ...data,
    inventoryHealth: classifyInventoryHealth(product.stock),
    setupStatus: classifyProductSetupStatus(product),
    setupIssues: getProductSetupIssues(product),
    marginHealth: classifyMarginHealth(product),
  };
}

export function generateSearchKeywords(name: string, handle: string, sku?: string): string[] {
  const keywords = new Set<string>();
  const tokenize = (str: string) => {
    return str.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 1);
  };

  tokenize(name).forEach(t => keywords.add(t));
  tokenize(handle.replace(/-/g, ' ')).forEach(t => keywords.add(t));
  if (sku) tokenize(sku).forEach(t => keywords.add(t));

  const addPrefixes = (str: string) => {
    const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (let i = 2; i <= Math.min(clean.length, 10); i++) {
      keywords.add(clean.substring(0, i));
    }
  };

  tokenize(name).forEach(addPrefixes);
  if (sku) addPrefixes(sku);

  return Array.from(keywords);
}
