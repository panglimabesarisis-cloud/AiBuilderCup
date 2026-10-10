import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { DEMO_STORE_ID } from '../services/dataSeeder';

type Item = { id?: string | number; [k: string]: any };
type Setter<T> = (v: T[] | ((prev: T[]) => T[])) => void;

const strip = <T,>(o: T): T => JSON.parse(JSON.stringify(o)); // buang undefined agar Firestore menerima

/**
 * Pengganti useState untuk daftar data modul: sumber kebenaran adalah koleksi Firestore `name`
 * (difilter storeId). Perubahan lewat setter (nilai atau fungsi) disinkronkan ke Firestore.
 * Pertama kali dibuka dan koleksi kosong, `defaults` ditulis sekali sebagai data awal (ditandai di app_meta).
 */
export function useFirestoreList<T extends Item>(name: string, defaults: T[]): [T[], Setter<T>] {
  const [items, setItemsState] = useState<T[]>(defaults);
  const ref = useRef<T[]>(defaults);

  const write = useCallback(
    async (prev: T[], next: T[]) => {
      let batch = writeBatch(db);
      let n = 0;
      const flush = async () => {
        if (n > 0) await batch.commit();
        batch = writeBatch(db);
        n = 0;
      };
      const nextIds = new Set(next.map((x) => String(x.id)));
      for (const p of prev) {
        if (!nextIds.has(String(p.id))) {
          batch.delete(doc(db, name, String(p.id)));
          if (++n >= 400) await flush();
        }
      }
      const prevByPos = prev.map((p) => JSON.stringify(strip(p)));
      for (let i = 0; i < next.length; i++) {
        const body = strip(next[i]);
        if (prevByPos[i] === JSON.stringify(body) && String(prev[i]?.id) === String(next[i].id)) continue;
        batch.set(doc(db, name, String(next[i].id)), { ...body, storeId: DEMO_STORE_ID, _order: i });
        if (++n >= 400) await flush();
      }
      await flush();
    },
    [name]
  );

  const setItems: Setter<T> = useCallback(
    (v) => {
      const prev = ref.current;
      let next = typeof v === 'function' ? (v as (p: T[]) => T[])(prev) : v;
      next = next.map((it, i) => (it.id !== undefined ? it : { ...it, id: `${name}_${Date.now().toString(36)}_${i}` }));
      ref.current = next;
      setItemsState(next);
      write(prev, next).catch((e) => console.error(`[${name}] gagal menyimpan ke Firestore:`, e));
    },
    [name, write]
  );

  useEffect(() => {
    const q = query(collection(db, name), where('storeId', '==', DEMO_STORE_ID));
    const metaRef = doc(db, 'app_meta', `seed_${name}`);
    const unsub = onSnapshot(
      q,
      async (snap) => {
        if (snap.empty) {
          try {
            const meta = await getDoc(metaRef);
            if (!meta.exists()) {
              const seeded = defaults.map((d, i) => ({ ...d, id: d.id !== undefined ? d.id : `${name}_seed_${i}` }));
              const batch = writeBatch(db);
              seeded.forEach((d, i) =>
                batch.set(doc(db, name, String(d.id)), { ...strip(d), storeId: DEMO_STORE_ID, _order: i })
              );
              batch.set(metaRef, { seeded: true, at: new Date().toISOString() });
              await batch.commit();
              return; // snapshot berikutnya membawa data
            }
          } catch (e) {
            console.warn(`[${name}] seed gagal:`, e);
          }
          ref.current = [];
          setItemsState([]);
          return;
        }
        const arr = snap.docs
          .map((d) => d.data() as any)
          .sort((a, b) => (a._order ?? 0) - (b._order ?? 0))
          .map(({ _order, storeId, ...rest }) => rest as T);
        ref.current = arr;
        setItemsState(arr);
      },
      (err) => console.warn(`[${name}] listener error:`, err)
    );
    return () => unsub();
  }, [name]);

  return [items, setItems];
}
