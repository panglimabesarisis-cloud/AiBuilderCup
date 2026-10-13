import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  serverTimestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export function useFirestoreList<T extends { id?: string }>(
  collectionName: string,
  initialData: T[] = [],
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    try {
      const colRef = collection(db, collectionName);
      const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            })) as T[];
            setData(items);
          } else if (initialData.length > 0) {
            setData((prev) => (prev.length > 0 ? prev : initialData));
          }
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.warn(`Firestore list error for ${collectionName}:`, err);
          setError(err.message);
          setLoading(false);
          if (initialData.length > 0) {
            setData((prev) => (prev.length > 0 ? prev : initialData));
          }
        }
      );
    } catch (err: any) {
      setError(err?.message || 'Error subscribing to collection');
      setLoading(false);
    }

    return () => unsubscribe();
  }, [collectionName]);

  const addItem = useCallback(
    async (item: Omit<T, 'id'>): Promise<string | null> => {
      try {
        const colRef = collection(db, collectionName);
        const docRef = await addDoc(colRef, {
          ...item,
          createdAt: serverTimestamp(),
        });
        const newItem = { id: docRef.id, ...item } as T;
        setData((prev) => [newItem, ...prev.filter((p) => p.id !== docRef.id)]);
        return docRef.id;
      } catch (err: any) {
        handleFirestoreError(err, OperationType.CREATE, collectionName);
        return null;
      }
    },
    [collectionName]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>): Promise<boolean> => {
      try {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        setData((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
        );
        return true;
      } catch (err: any) {
        handleFirestoreError(err, OperationType.UPDATE, `${collectionName}/${id}`);
        return false;
      }
    },
    [collectionName]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
        setData((prev) => prev.filter((item) => item.id !== id));
        return true;
      } catch (err: any) {
        handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
        return false;
      }
    },
    [collectionName]
  );

  return {
    data,
    setData,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
  };
}
