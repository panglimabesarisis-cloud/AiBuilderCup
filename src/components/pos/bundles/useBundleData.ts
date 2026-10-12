import { useEffect, useState } from 'react';
import type { Bundle } from '../../../types';
import { subscribeBundleProducts, subscribeBundles } from '../../../services/bundleService';
import type { BundleProduct } from './bundleForm';

/** If Firestore has not answered within this time, stop showing the loading state. */
const LOADING_TIMEOUT_MS = 6000;

interface LiveState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

function useLiveCollection<T>(
  subscribe: (onData: (rows: T[]) => void, onError: (e: Error) => void) => () => void,
  refreshKey: number
): LiveState<T> {
  const [state, setState] = useState<LiveState<T>>({ data: [], loading: true, error: null });

  useEffect(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const timer = window.setTimeout(() => {
      setState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
    }, LOADING_TIMEOUT_MS);
    const unsubscribe = subscribe(
      (rows) => {
        window.clearTimeout(timer);
        setState({ data: rows, loading: false, error: null });
      },
      (err) => {
        window.clearTimeout(timer);
        setState((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    );
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
    // `subscribe` is a stable module-level function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  return state;
}

export function useBundles(refreshKey: number) {
  const { data, loading, error } = useLiveCollection<Bundle>(subscribeBundles, refreshKey);
  return { bundles: data, loading, error };
}

export function useBundleProducts() {
  const { data, loading, error } = useLiveCollection<BundleProduct>(subscribeBundleProducts, 0);
  return { products: data, loading, error };
}
