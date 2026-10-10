import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEMO_STORE_ID } from '../services/dataSeeder';

/**
 * Pengganti useState untuk satu kolom pengaturan: nilai disimpan di dokumen Firestore settings/{docId}.
 * Banyak kolom pada dokumen yang sama berbagi satu listener; penulisan digabung (debounce 500 ms).
 */
interface Store {
  data: Record<string, any>;
  subs: Set<() => void>;
  unsub?: () => void;
  pending: Record<string, any>;
  timer?: ReturnType<typeof setTimeout>;
}
const stores = new Map<string, Store>();

function getStore(docId: string): Store {
  let s = stores.get(docId);
  if (!s) {
    s = { data: {}, subs: new Set(), pending: {} };
    stores.set(docId, s);
  }
  return s;
}

function ensureSubscribed(docId: string, s: Store) {
  if (s.unsub) return;
  s.unsub = onSnapshot(
    doc(db, 'settings', docId),
    (snap) => {
      if (snap.exists()) {
        // Nilai yang menunggu tulis tetap menang atas snapshot lama
        s.data = { ...snap.data(), ...s.pending };
        s.subs.forEach((f) => f());
      }
    },
    (e) => console.warn(`[settings/${docId}] listener error:`, e)
  );
}

export function useSetting<T>(docId: string, field: string, def: T): [T, (v: T | ((p: T) => T)) => void] {
  const s = getStore(docId);
  const [, force] = useState(0);

  useEffect(() => {
    const f = () => force((n) => n + 1);
    s.subs.add(f);
    ensureSubscribed(docId, s);
    return () => {
      s.subs.delete(f);
      if (s.subs.size === 0 && s.unsub) {
        s.unsub();
        s.unsub = undefined;
      }
    };
  }, [docId]);

  const value = (field in s.data ? s.data[field] : def) as T;

  const set = useCallback(
    (v: T | ((p: T) => T)) => {
      const cur = (field in s.data ? s.data[field] : def) as T;
      const next = typeof v === 'function' ? (v as (p: T) => T)(cur) : v;
      s.data[field] = next;
      s.pending[field] = next;
      s.subs.forEach((f) => f());
      if (s.timer) clearTimeout(s.timer);
      s.timer = setTimeout(() => {
        const payload = JSON.parse(JSON.stringify(s.pending));
        s.pending = {};
        setDoc(doc(db, 'settings', docId), { ...payload, storeId: DEMO_STORE_ID, updatedAt: new Date().toISOString() }, { merge: true }).catch(
          (e) => console.error(`[settings/${docId}] gagal menyimpan:`, e)
        );
      }, 500);
    },
    [docId, field]
  );

  return [value, set];
}
