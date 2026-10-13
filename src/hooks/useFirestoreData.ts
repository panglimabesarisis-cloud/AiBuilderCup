import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { DEMO_STORE_ID } from '../services/dataSeeder';

/**
 * 1) useCollection: Real-time listener with automatic one-time seed and CRUD actions.
 * - onSnapshot to top-level collection `name`.
 * - Every write injects storeId=DEMO_STORE_ID, createdAt/updatedAt ISO.
 * - One-time seed: if initial snapshot is empty AND meta/seed_<name> does not exist,
 *   writeBatch seeds the items and marks meta/seed_<name>. Does NOT re-seed after manual deletion.
 * - add uses item.id if provided, otherwise auto-generated doc ID.
 * - Firestore errors populate `error`, retaining local seed in `items` so UI never crashes.
 */
export function useCollection<T extends { id: string }>(
  name: string,
  seed: T[] = []
): {
  items: T[];
  loading: boolean;
  error: Error | null;
  add: (item: Partial<T> & Record<string, any>) => Promise<string>;
  update: (id: string, patch: Partial<T> & Record<string, any>) => Promise<void>;
  remove: (id: string) => Promise<void>;
} {
  const seedRef = useRef<T[]>(seed);
  seedRef.current = seed;

  const [items, setItems] = useState<T[]>(seed);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    let isFirstSnapshot = true;
    setLoading(true);

    const colRef = collection(db, name);

    const unsubscribe = onSnapshot(
      colRef,
      async (snapshot) => {
        if (!isMounted) return;

        if (!snapshot.empty) {
          const docsData = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as T[];
          setItems(docsData);
          setLoading(false);
          setError(null);
        } else {
          // Snapshot is empty
          if (isFirstSnapshot) {
            isFirstSnapshot = false;
            try {
              const metaRef = doc(db, 'meta', `seed_${name}`);
              const metaSnap = await getDoc(metaRef);

              if (!metaSnap.exists() && seedRef.current && seedRef.current.length > 0) {
                // One-time seed
                const batch = writeBatch(db);
                const nowISO = new Date().toISOString();

                for (const item of seedRef.current) {
                  const itemDocRef = item.id ? doc(colRef, String(item.id)) : doc(colRef);
                  batch.set(itemDocRef, {
                    ...item,
                    id: itemDocRef.id,
                    storeId: (item as any).storeId || DEMO_STORE_ID,
                    createdAt: (item as any).createdAt || nowISO,
                    updatedAt: (item as any).updatedAt || nowISO,
                  });
                }

                batch.set(metaRef, {
                  seeded: true,
                  seededAt: nowISO,
                  collection: name,
                  count: seedRef.current.length,
                  storeId: DEMO_STORE_ID,
                });

                await batch.commit();
                // onSnapshot will automatically trigger with the newly written docs
                return;
              }
            } catch (seedErr: any) {
              console.warn(`[useCollection] Error during seed check for ${name}:`, seedErr);
              if (isMounted) {
                setError(seedErr instanceof Error ? seedErr : new Error(String(seedErr)));
                // Keep local seed so UI does not crash
                setItems(seedRef.current);
                setLoading(false);
              }
              return;
            }
          }

          // Snapshot is empty and already seeded in the past or no seed provided
          // Do not re-seed if user deleted all rows
          setItems([]);
          setLoading(false);
          setError(null);
        }
      },
      (err: any) => {
        console.warn(`[useCollection] Firestore onSnapshot error on ${name}:`, err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          // Keep local seed so UI never crashes
          setItems((prev) => (prev && prev.length > 0 ? prev : seedRef.current));
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [name]);

  const add = useCallback(
    async (item: Partial<T> & Record<string, any>): Promise<string> => {
      const colRef = collection(db, name);
      const docRef = item.id ? doc(colRef, String(item.id)) : doc(colRef);
      const nowISO = new Date().toISOString();
      const newItem = {
        ...item,
        id: docRef.id,
        storeId: item.storeId || DEMO_STORE_ID,
        createdAt: item.createdAt || nowISO,
        updatedAt: nowISO,
      };

      try {
        await setDoc(docRef, newItem);
        setError(null);
        return docRef.id;
      } catch (err: any) {
        console.warn(`[useCollection] Error adding item to ${name}:`, err);
        const errObj = err instanceof Error ? err : new Error(String(err));
        setError(errObj);
        // Optimistic local fallback so UI remains functional
        setItems((prev) => [newItem as unknown as T, ...prev]);
        return docRef.id;
      }
    },
    [name]
  );

  const update = useCallback(
    async (id: string, patch: Partial<T> & Record<string, any>): Promise<void> => {
      const colRef = collection(db, name);
      const docRef = doc(colRef, id);
      const nowISO = new Date().toISOString();
      const updateData = {
        ...patch,
        storeId: patch.storeId || DEMO_STORE_ID,
        updatedAt: nowISO,
      };

      try {
        await setDoc(docRef, updateData, { merge: true });
        setError(null);
      } catch (err: any) {
        console.warn(`[useCollection] Error updating item ${id} in ${name}:`, err);
        const errObj = err instanceof Error ? err : new Error(String(err));
        setError(errObj);
        // Optimistic local update
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: nowISO } : item))
        );
      }
    },
    [name]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      const colRef = collection(db, name);
      const docRef = doc(colRef, id);

      try {
        await deleteDoc(docRef);
        setError(null);
      } catch (err: any) {
        console.warn(`[useCollection] Error removing item ${id} from ${name}:`, err);
        const errObj = err instanceof Error ? err : new Error(String(err));
        setError(errObj);
        // Optimistic local deletion
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    },
    [name]
  );

  return { items, loading, error, add, update, remove };
}

/**
 * Helper to resolve document reference from path string
 */
function resolveDocRef(path: string) {
  const segments = path.split('/').filter(Boolean);
  if (segments.length % 2 === 1) {
    segments.push('default');
  }
  return doc(db, segments[0], ...segments.slice(1));
}

/**
 * 2) useSettingsDoc: Loads settings doc at mount with getDoc, provides save with setDoc(merge:true) + updatedAt.
 */
export function useSettingsDoc<T extends Record<string, any>>(
  path: string,
  defaults: T
): {
  value: T;
  save: (patch: Partial<T> & Record<string, any>) => Promise<void>;
  loading: boolean;
  error: Error | null;
} {
  const defaultsRef = useRef<T>(defaults);
  defaultsRef.current = defaults;

  const [value, setValue] = useState<T>(defaults);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchDoc = async () => {
      try {
        const docRef = resolveDocRef(path);
        const snap = await getDoc(docRef);

        if (isMounted) {
          if (snap.exists()) {
            setValue({
              ...defaultsRef.current,
              ...(snap.data() as T),
            });
          } else {
            setValue(defaultsRef.current);
          }
          setLoading(false);
          setError(null);
        }
      } catch (err: any) {
        console.warn(`[useSettingsDoc] Error reading doc at ${path}:`, err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setValue(defaultsRef.current);
          setLoading(false);
        }
      }
    };

    fetchDoc();

    return () => {
      isMounted = false;
    };
  }, [path]);

  const save = useCallback(
    async (patch: Partial<T> & Record<string, any>): Promise<void> => {
      const nowISO = new Date().toISOString();
      const docRef = resolveDocRef(path);
      const updateData = {
        ...patch,
        updatedAt: nowISO,
      };

      try {
        await setDoc(docRef, updateData, { merge: true });
        setValue((prev) => ({
          ...prev,
          ...patch,
          updatedAt: nowISO,
        }));
        setError(null);
      } catch (err: any) {
        console.warn(`[useSettingsDoc] Error saving doc at ${path}:`, err);
        const errObj = err instanceof Error ? err : new Error(String(err));
        setError(errObj);
        setValue((prev) => ({
          ...prev,
          ...patch,
          updatedAt: nowISO,
        }));
      }
    },
    [path]
  );

  return { value, save, loading, error };
}
