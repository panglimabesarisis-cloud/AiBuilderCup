import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DEMO_STORE_ID } from './dataSeeder';
import type { Bundle, BundleDraft, BundleItem } from '../types';
import type { BundleProduct } from '../components/pos/bundles/bundleForm';
import { toIdr } from '../utils/bundleMath';

/**
 * Firestore access for Product Bundles.
 *
 * Collections follow the app's existing convention (top-level collections, every document
 * carries `storeId` for multi-tenant readiness), exactly like `products` and `transactions`.
 * Change BUNDLE_STORE_ID / the collection names here only; no component hard-codes them.
 */
export const BUNDLES_COLLECTION = 'bundles';
export const PRODUCTS_COLLECTION = 'products';
export const BUNDLE_STORE_ID = DEMO_STORE_ID;

const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

function describe(error: unknown): string {
  return error instanceof Error ? error.message : 'Firestore request failed';
}

/** Logs the structured Firestore error (handleFirestoreError rethrows, so swallow that) and rethrows a friendly one. */
function fail(error: unknown, op: OperationType, path: string): never {
  try {
    handleFirestoreError(error, op, path);
  } catch {
    /* structured log already emitted */
  }
  throw new Error(describe(error));
}

function normalizeItem(raw: unknown): BundleItem {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    productId: str(r.productId),
    productName: str(r.productName, 'Unknown product'),
    sku: str(r.sku),
    unit: str(r.unit, 'pcs'),
    qty: num(r.qty, 1),
    costPrice: num(r.costPrice),
    sellingPrice: num(r.sellingPrice),
    promoPrice: num(r.promoPrice),
  };
}

export function normalizeBundle(id: string, data: Record<string, unknown>): Bundle {
  const items = Array.isArray(data.items) ? data.items.map(normalizeItem) : [];
  return {
    id,
    storeId: str(data.storeId, BUNDLE_STORE_ID),
    code: str(data.code, id),
    name: str(data.name, 'Untitled bundle'),
    items,
    startDate: str(data.startDate),
    endDate: str(data.endDate),
    quota: num(data.quota),
    redeemedCount: num(data.redeemedCount),
    isActive: data.isActive !== false,
    currency: 'IDR',
    totalCost: num(data.totalCost),
    totalStandardPrice: num(data.totalStandardPrice),
    totalPromoPrice: num(data.totalPromoPrice),
    totalDiscount: num(data.totalDiscount),
    profit: num(data.profit),
    marginPercent: num(data.marginPercent),
    createdAt: str(data.createdAt),
    updatedAt: str(data.updatedAt),
  };
}

/** Real-time list of this store's bundles, newest first. Sorted client-side so no composite index is needed. */
export function subscribeBundles(
  onData: (bundles: Bundle[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, BUNDLES_COLLECTION),
    (snapshot) => {
      const list: Bundle[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        if (data.storeId === undefined || data.storeId === BUNDLE_STORE_ID) {
          list.push(normalizeBundle(d.id, data));
        }
      });
      list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
      onData(list);
    },
    (error) => onError(new Error(describe(error)))
  );
}

/**
 * Real-time product catalog for the "Product Name" dropdown.
 * Reads the same Firestore `products` collection the POS uses (fields `costPerUnit` / `pricePerUnit`,
 * with `costPrice` / `sellPrice` accepted too) and converts prices to IDR.
 */
export function subscribeBundleProducts(
  onData: (products: BundleProduct[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, PRODUCTS_COLLECTION),
    (snapshot) => {
      const list: BundleProduct[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        if (data.storeId !== undefined && data.storeId !== BUNDLE_STORE_ID) return;
        const name = str(data.name).trim();
        if (!name) return;
        const rawCost = data.costPrice ?? data.costPerUnit;
        const rawSell = data.sellPrice ?? data.pricePerUnit;
        list.push({
          id: d.id,
          name,
          sku: str(data.sku),
          category: str(data.category),
          unit: str(data.unit, 'pcs'),
          costPrice: toIdr(num(rawCost)),
          sellingPrice: toIdr(num(rawSell)),
        });
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      onData(list);
    },
    (error) => onError(new Error(describe(error)))
  );
}

export async function createBundle(draft: BundleDraft): Promise<string> {
  const now = new Date().toISOString();
  try {
    const ref = await addDoc(collection(db, BUNDLES_COLLECTION), {
      ...draft,
      storeId: BUNDLE_STORE_ID,
      currency: 'IDR',
      isActive: true,
      redeemedCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  } catch (error) {
    return fail(error, OperationType.CREATE, BUNDLES_COLLECTION);
  }
}

export async function updateBundle(id: string, draft: BundleDraft): Promise<void> {
  try {
    await updateDoc(doc(db, BUNDLES_COLLECTION, id), {
      ...draft,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    fail(error, OperationType.UPDATE, `${BUNDLES_COLLECTION}/${id}`);
  }
}

export async function setBundleActive(id: string, isActive: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, BUNDLES_COLLECTION, id), { isActive, updatedAt: new Date().toISOString() });
  } catch (error) {
    fail(error, OperationType.UPDATE, `${BUNDLES_COLLECTION}/${id}`);
  }
}

export async function deleteBundle(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, BUNDLES_COLLECTION, id));
  } catch (error) {
    fail(error, OperationType.DELETE, `${BUNDLES_COLLECTION}/${id}`);
  }
}
