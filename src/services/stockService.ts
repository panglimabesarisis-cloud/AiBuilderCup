import { collection, doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

export interface StockLine {
  productId: string;
  units: number;
}

function aggregate(lines: StockLine[]): Map<string, number> {
  const agg = new Map<string, number>();
  for (const l of lines) {
    if (!l.productId || !(l.units > 0)) continue;
    agg.set(l.productId, (agg.get(l.productId) || 0) + l.units);
  }
  return agg;
}

async function readAndCheck(t: any, agg: Map<string, number>) {
  const ids = [...agg.keys()];
  const refs = ids.map((id) => doc(db, 'products', id));
  const snaps = await Promise.all(refs.map((r) => t.get(r)));
  const next: { ref: any; stock: number }[] = [];
  snaps.forEach((s: any, i: number) => {
    if (!s.exists()) throw new Error(`Produk ${ids[i]} tidak ditemukan.`);
    const d = s.data();
    const cur = Number(d.stockInUnits ?? 0);
    const need = agg.get(ids[i]) as number;
    if (cur < need) throw new Error(`Stok ${d.name || ids[i]} tidak cukup (tersisa ${cur}, diminta ${need}).`);
    next.push({ ref: refs[i], stock: cur - need });
  });
  return next;
}

/** Kurangi stok untuk pesanan yang sudah ada (mis. pesanan PWA yang disetujui). Aman dipanggil dua kali. */
export async function deductStockForOrder(txId: string, lines: StockLine[]): Promise<void> {
  await runTransaction(db, async (t) => {
    const txRef = doc(db, 'transactions', txId);
    const txSnap = await t.get(txRef);
    if (!txSnap.exists()) throw new Error('Transaksi tidak ditemukan.');
    if (txSnap.data().stockDeducted === true) return;
    const next = await readAndCheck(t, aggregate(lines));
    const now = new Date().toISOString();
    next.forEach((n) => t.update(n.ref, { stockInUnits: n.stock, updatedAt: now }));
    t.update(txRef, { stockDeducted: true, updatedAt: now });
  });
}

/** Buat transaksi + item + kurangi stok dalam satu transaksi atomik (penjualan kasir). */
export async function createSaleWithStock(
  txPayload: Record<string, any>,
  items: Record<string, any>[]
): Promise<string> {
  const txRef = doc(collection(db, 'transactions'));
  await runTransaction(db, async (t) => {
    const next = await readAndCheck(
      t,
      aggregate(items.map((i) => ({ productId: i.productId, units: Number(i.unitsDeducted) || 0 })))
    );
    const now = new Date().toISOString();
    next.forEach((n) => t.update(n.ref, { stockInUnits: n.stock, updatedAt: now }));
    t.set(txRef, { ...txPayload, stockDeducted: true });
    for (const it of items) {
      t.set(doc(collection(db, 'transactions', txRef.id, 'items')), { ...it, transactionId: txRef.id });
    }
  });
  return txRef.id;
}
