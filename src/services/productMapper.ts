import { Product } from '../types';
import { DEMO_STORE_ID } from './dataSeeder';

export interface ProductVariantItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  costPrice: number;
  sellPrice: number;
  posPrice: number;
  pwaPrice: number;
  stock: number;
  itemsPerCarton: number;
  weightMl: number;
  isActive: boolean;
  isPosVisible: boolean;
  isPwaVisible: boolean;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductGroupItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  hasVariants: boolean;
  sku?: string;
  imageUrl?: string;
  costPrice?: number;
  sellPrice?: number;
  posPrice?: number;
  pwaPrice?: number;
  sellPriceRange?: string;
  costPriceRange?: string;
  totalStock: number;
  itemsPerCarton?: number;
  weightMl?: number;
  isActive?: boolean;
  isPosVisible?: boolean;
  isPwaVisible?: boolean;
  createdAt?: string;
  updatedAt?: string;
  variants?: ProductVariantItem[];
}

/**
 * Maps a single Firestore Product document to a ProductVariantItem
 */
export function productToVariant(p: Product): ProductVariantItem {
  const sku = p.sku || p.id;
  return {
    id: p.id || sku,
    sku: sku,
    name: p.name,
    category: p.category || 'GENERAL',
    brand: p.brand || '',
    costPrice: p.costPerUnit ?? 0,
    sellPrice: p.pricePerUnit ?? 0,
    posPrice: p.pricePerUnit ?? 0,
    pwaPrice: p.pricePerUnit ?? 0,
    stock: p.stockInUnits ?? 0,
    itemsPerCarton: p.piecesPerCarton ?? 1,
    weightMl: p.weightMl ?? 0,
    isActive: p.isActive !== false,
    isPosVisible: p.isPosVisible !== false,
    isPwaVisible: p.isPwaVisible !== false,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/**
 * Maps a ProductVariantItem back to a Firestore Product document
 */
export function variantToProduct(
  v: Partial<ProductVariantItem> & { name: string },
  overrides?: Partial<Product>
): Product {
  const nowISO = new Date().toISOString();
  const sku = v.sku || (v as any).id || overrides?.sku || `SKU-${Date.now()}`;
  const price = v.sellPrice ?? v.posPrice ?? v.pwaPrice ?? 0;
  const itemsPerCarton = v.itemsPerCarton ?? 1;

  return {
    id: overrides?.id || sku,
    storeId: overrides?.storeId || DEMO_STORE_ID,
    name: v.name,
    sku: sku,
    category: v.category || overrides?.category || 'GENERAL',
    barcode: overrides?.barcode || sku,
    piecesPerCarton: itemsPerCarton,
    stockInUnits: v.stock ?? 0,
    costPerUnit: v.costPrice ?? 0,
    pricePerUnit: price,
    pricePerCarton: overrides?.pricePerCarton ?? (price * itemsPerCarton),
    minStockAlert: overrides?.minStockAlert ?? 10,
    imageUrl: v.imageUrl || overrides?.imageUrl,
    brand: v.brand || overrides?.brand,
    isActive: v.isActive !== false,
    isPosVisible: v.isPosVisible !== false,
    isPwaVisible: v.isPwaVisible !== false,
    weightMl: v.weightMl ?? overrides?.weightMl ?? 0,
    createdAt: v.createdAt || overrides?.createdAt || nowISO,
    updatedAt: v.updatedAt || overrides?.updatedAt || nowISO,
    ...overrides,
  };
}

/**
 * Converts a flat array of Firestore Products into grouped ProductGroupItems.
 * Groups by `brand`. Products without a brand become standalone groups.
 */
export function productsToGroups(products: Product[]): ProductGroupItem[] {
  if (!products || products.length === 0) {
    return [];
  }

  // 1. Group products by brand (if brand is present and non-empty)
  // Products without brand: each becomes its own standalone group
  const brandGroups = new Map<string, Product[]>();
  const unbrandedProducts: Product[] = [];

  for (const prod of products) {
    const trimmedBrand = prod.brand?.trim();
    if (trimmedBrand) {
      const existing = brandGroups.get(trimmedBrand) || [];
      existing.push(prod);
      brandGroups.set(trimmedBrand, existing);
    } else {
      unbrandedProducts.push(prod);
    }
  }

  const result: ProductGroupItem[] = [];

  // Process branded groups
  for (const [brand, items] of brandGroups.entries()) {
    if (items.length > 1) {
      // Multiple items under the same brand -> group with variants
      const variants = items.map(productToVariant);
      const totalStock = items.reduce((sum, item) => sum + (item.stockInUnits || 0), 0);

      // Sell price range
      const sellPrices = items.map((i) => i.pricePerUnit ?? 0);
      const minSell = Math.min(...sellPrices);
      const maxSell = Math.max(...sellPrices);
      const sellPriceRange =
        minSell === maxSell
          ? `Rp ${minSell.toLocaleString('id-ID')}`
          : `Rp ${minSell.toLocaleString('id-ID')} - Rp ${maxSell.toLocaleString('id-ID')}`;

      // Cost price range
      const costPrices = items.map((i) => i.costPerUnit ?? 0);
      const minCost = Math.min(...costPrices);
      const maxCost = Math.max(...costPrices);
      const costPriceRange =
        minCost === maxCost
          ? `Rp ${minCost.toLocaleString('id-ID')}`
          : `Rp ${minCost.toLocaleString('id-ID')} - Rp ${maxCost.toLocaleString('id-ID')}`;

      // Earliest createdAt for date filtering
      const createdDates = items.map((i) => i.createdAt).filter(Boolean) as string[];
      createdDates.sort();

      result.push({
        id: `grp_${brand.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: brand,
        category: items[0].category || 'GENERAL',
        brand: brand,
        hasVariants: true,
        sellPriceRange,
        costPriceRange,
        totalStock,
        variants,
        createdAt: createdDates[0],
        updatedAt: items[0].updatedAt,
      });
    } else {
      // Single item with brand -> standalone group
      const p = items[0];
      result.push({
        id: `grp_${p.id || p.sku}`,
        name: p.name,
        sku: p.sku || p.id,
        category: p.category || 'GENERAL',
        brand: brand,
        hasVariants: false,
        imageUrl: p.imageUrl,
        costPrice: p.costPerUnit ?? 0,
        sellPrice: p.pricePerUnit ?? 0,
        posPrice: p.pricePerUnit ?? 0,
        pwaPrice: p.pricePerUnit ?? 0,
        totalStock: p.stockInUnits ?? 0,
        itemsPerCarton: p.piecesPerCarton ?? 1,
        weightMl: p.weightMl ?? 0,
        isActive: p.isActive !== false,
        isPosVisible: p.isPosVisible !== false,
        isPwaVisible: p.isPwaVisible !== false,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      });
    }
  }

  // Process unbranded products (tanpa brand = grup sendiri)
  for (const p of unbrandedProducts) {
    result.push({
      id: `grp_${p.id || p.sku}`,
      name: p.name,
      sku: p.sku || p.id,
      category: p.category || 'GENERAL',
      brand: '',
      hasVariants: false,
      imageUrl: p.imageUrl,
      costPrice: p.costPerUnit ?? 0,
      sellPrice: p.pricePerUnit ?? 0,
      posPrice: p.pricePerUnit ?? 0,
      pwaPrice: p.pricePerUnit ?? 0,
      totalStock: p.stockInUnits ?? 0,
      itemsPerCarton: p.piecesPerCarton ?? 1,
      weightMl: p.weightMl ?? 0,
      isActive: p.isActive !== false,
      isPosVisible: p.isPosVisible !== false,
      isPwaVisible: p.isPwaVisible !== false,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  }

  return result;
}

/**
 * Extracts flat variant list from ProductGroupItem array
 */
export function extractVariantsFromGroups(groups: ProductGroupItem[]): ProductVariantItem[] {
  const result: ProductVariantItem[] = [];
  for (const group of groups) {
    if (group.hasVariants && group.variants && group.variants.length > 0) {
      for (const v of group.variants) {
        result.push({
          ...v,
          brand: v.brand || group.brand || '',
          category: v.category || group.category || 'GENERAL',
        });
      }
    } else {
      result.push({
        id: group.sku || group.id,
        sku: group.sku || group.id,
        name: group.name,
        category: group.category || 'GENERAL',
        brand: group.brand || '',
        costPrice: group.costPrice ?? 0,
        sellPrice: group.sellPrice ?? 0,
        posPrice: group.posPrice ?? group.sellPrice ?? 0,
        pwaPrice: group.pwaPrice ?? group.sellPrice ?? 0,
        stock: group.totalStock ?? 0,
        itemsPerCarton: group.itemsPerCarton ?? 1,
        weightMl: group.weightMl ?? 0,
        isActive: group.isActive !== false,
        isPosVisible: group.isPosVisible !== false,
        isPwaVisible: group.isPwaVisible !== false,
        imageUrl: group.imageUrl,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      });
    }
  }
  return result;
}
