import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEMO_STORE_ID } from '../services/dataSeeder';
import type { ProductGroupItem, ProductVariantItem } from '../components/pos/ProductCartonManager';

/**
 * Adapter: halaman Produk memakai ProductGroupItem (grup + varian), sedangkan POS/PWA/AI memakai koleksi
 * `products` (satu dokumen per SKU, stok dalam satuan). Hook ini membaca koleksi `products` apa adanya dan
 * menulis perubahan kembali ke dokumen yang sama, sehingga hanya ada SATU sumber data produk.
 * Dokumen dikelompokkan jika punya `groupId` atau `brand`; selain itu tampil sebagai produk tunggal.
 */
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const toVariant = (p: any): ProductVariantItem => ({
  id: p.id,
  sku: p.sku || p.id,
  name: p.name || '',
  category: p.category || '',
  brand: p.brand || '',
  costPrice: Number(p.costPerUnit) || 0,
  sellPrice: Number(p.pricePerUnit) || 0,
  posPrice: Number(p.posPrice ?? p.pricePerUnit) || 0,
  pwaPrice: Number(p.pwaPrice ?? p.pricePerUnit) || 0,
  stock: Number(p.stockInUnits) || 0,
  itemsPerCarton: Number(p.piecesPerCarton) || 1,
  weightMl: Number(p.weightMl) || 0,
  isActive: p.isActive !== false,
  isPosVisible: p.isPosVisible !== false,
  isPwaVisible: p.isPwaVisible !== false,
});

export function toGroups(rows: any[]): ProductGroupItem[] {
  const groups = new Map<string, any[]>();
  const order: string[] = [];
  for (const p of rows) {
    const key = p.groupId || (p.brand ? `grp_${slug(p.brand)}` : p.id);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(p);
  }
  return order.map((key) => {
    const members = groups.get(key)!;
    const variants = members.map(toVariant);
    const totalStock = variants.reduce((a, v) => a + v.stock, 0);
    if (members.length === 1 && !members[0].groupId) {
      const v = variants[0];
      return { ...v, id: v.id, hasVariants: false, totalStock } as ProductGroupItem;
    }
    const prices = variants.map((v) => v.sellPrice).sort((a, b) => a - b);
    const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
    return {
      id: key,
      name: members[0].groupName || members[0].brand || members[0].name,
      category: variants[0].category,
      brand: variants[0].brand || members[0].name,
      hasVariants: true,
      sellPriceRange: prices[0] === prices[prices.length - 1] ? fmt(prices[0]) : `${fmt(prices[0])} - ${fmt(prices[prices.length - 1])}`,
      totalStock,
      variants,
    } as ProductGroupItem;
  });
}

const flatten = (groups: ProductGroupItem[]): { v: any; group: ProductGroupItem }[] =>
  groups.flatMap((g) =>
    g.hasVariants && g.variants && g.variants.length > 0
      ? g.variants.map((v) => ({ v, group: g }))
      : [
          {
            group: g,
            v: {
              id: g.id,
              sku: g.sku || g.id,
              name: g.name,
              category: g.category,
              brand: g.brand,
              costPrice: g.costPrice ?? 0,
              sellPrice: g.sellPrice ?? 0,
              posPrice: g.posPrice ?? g.sellPrice ?? 0,
              pwaPrice: g.pwaPrice ?? g.sellPrice ?? 0,
              stock: g.totalStock ?? 0,
              itemsPerCarton: g.itemsPerCarton ?? 1,
              weightMl: g.weightMl ?? 0,
              isActive: g.isActive !== false,
              isPosVisible: g.isPosVisible !== false,
              isPwaVisible: g.isPwaVisible !== false,
            },
          },
        ]
  );

const toDoc = (v: any, group: ProductGroupItem, existing: any) => {
  const per = Number(v.itemsPerCarton) || 1;
  const unitPriceUnchanged = existing && Number(existing.pricePerUnit) === Number(v.sellPrice);
  return {
    ...(existing || {}),
    id: v.id,
    storeId: DEMO_STORE_ID,
    name: v.name,
    sku: v.sku,
    category: v.category,
    barcode: existing?.barcode || v.sku,
    brand: v.brand || group.brand || '',
    groupId: group.hasVariants ? group.id : existing?.groupId ?? null,
    groupName: group.hasVariants ? group.name : existing?.groupName ?? null,
    piecesPerCarton: per,
    stockInUnits: Math.max(0, Number(v.stock) || 0),
    costPerUnit: Number(v.costPrice) || 0,
    pricePerUnit: Number(v.sellPrice) || 0,
    pricePerCarton: unitPriceUnchanged ? Number(existing.pricePerCarton) : (Number(v.sellPrice) || 0) * per,
    minStockAlert: existing?.minStockAlert ?? 5,
    posPrice: Number(v.posPrice) || 0,
    pwaPrice: Number(v.pwaPrice) || 0,
    weightMl: Number(v.weightMl) || 0,
    isActive: v.isActive !== false,
    isPosVisible: v.isPosVisible !== false,
    isPwaVisible: v.isPwaVisible !== false,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

type Setter = (v: ProductGroupItem[] | ((p: ProductGroupItem[]) => ProductGroupItem[])) => void;

export function useProductGroups(): [ProductGroupItem[], Setter] {
  const [groups, setGroupsState] = useState<ProductGroupItem[]>([]);
  const groupsRef = useRef<ProductGroupItem[]>([]);
  const rowsRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        rowsRef.current = new Map(rows.map((r) => [r.id, r]));
        const g = toGroups(rows);
        groupsRef.current = g;
        setGroupsState(g);
      },
      (e) => console.warn('[products] listener error:', e)
    );
    return () => unsub();
  }, []);

  const setGroups: Setter = useCallback((val) => {
    const prev = groupsRef.current;
    const next = typeof val === 'function' ? val(prev) : val;
    groupsRef.current = next;
    setGroupsState(next);

    const nextFlat = flatten(next);
    const nextIds = new Set(nextFlat.map((x) => String(x.v.id)));
    const jobs: Promise<unknown>[] = [];
    for (const { v, group } of nextFlat) {
      const existing = rowsRef.current.get(String(v.id));
      const body = toDoc(v, group, existing);
      const strip = (o: any) => JSON.stringify({ ...o, updatedAt: 0 });
      if (existing && strip(existing) === strip({ ...body })) continue;
      jobs.push(setDoc(doc(db, 'products', String(v.id)), JSON.parse(JSON.stringify(body))));
    }
    for (const { v } of flatten(prev)) {
      if (!nextIds.has(String(v.id))) jobs.push(deleteDoc(doc(db, 'products', String(v.id))));
    }
    Promise.all(jobs).catch((e) => console.error('[products] gagal menyimpan:', e));
  }, []);

  return [groups, setGroups];
}
