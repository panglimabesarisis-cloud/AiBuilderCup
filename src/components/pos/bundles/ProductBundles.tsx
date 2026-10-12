import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { Bundle } from '../../../types';
import { deleteBundle, setBundleActive } from '../../../services/bundleService';
import { BundleDirectory } from './BundleDirectory';
import { BundleForm } from './BundleForm';
import { useBundles } from './useBundleData';

interface ProductBundlesProps {
  /** Called when the "Product Management" breadcrumb is clicked. */
  onBackToProducts?: () => void;
}

type View = 'list' | 'form';
type ToastState = { kind: 'success' | 'error'; text: string } | null;

/**
 * Product Bundles (Paket Produk) sub-module.
 * Switches between the directory and the add / edit form in place (no page reload).
 */
export const ProductBundles: React.FC<ProductBundlesProps> = ({ onBackToProducts }) => {
  const [view, setView] = useState<View>('list');
  const [editing, setEditing] = useState<Bundle | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<ToastState>(null);
  const [pendingDelete, setPendingDelete] = useState<Bundle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const { bundles, loading, error } = useBundles(refreshKey);

  const showToast = useCallback((kind: 'success' | 'error', text: string) => setToast({ kind, text }), []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Start each view at the top of the workspace.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    rootRef.current?.scrollIntoView?.({ block: 'start' });
  }, [view]);

  const otherCodes = useMemo(
    () => bundles.filter((b) => b.id !== editing?.id).map((b) => b.code),
    [bundles, editing]
  );

  const openCreate = () => {
    setEditing(null);
    setView('form');
  };
  const openEdit = (bundle: Bundle) => {
    setEditing(bundle);
    setView('form');
  };
  const backToList = () => {
    setEditing(null);
    setView('list');
  };

  const handleToggleActive = async (bundle: Bundle) => {
    try {
      await setBundleActive(bundle.id, !bundle.isActive);
      showToast('success', `Bundle "${bundle.name}" ${bundle.isActive ? 'deactivated' : 'activated'}.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Could not update the bundle.');
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteBundle(pendingDelete.id);
      showToast('success', `Bundle "${pendingDelete.name}" deleted.`);
      setPendingDelete(null);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Could not delete the bundle.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div ref={rootRef} className="w-full font-sans pb-12">
      {view === 'list' ? (
        <BundleDirectory
          bundles={bundles}
          loading={loading && bundles.length === 0}
          refreshing={loading && refreshKey > 0}
          error={error}
          onBackToProducts={onBackToProducts}
          onAdd={openCreate}
          onRefresh={() => setRefreshKey((k) => k + 1)}
          onEdit={openEdit}
          onToggleActive={handleToggleActive}
          onDelete={setPendingDelete}
        />
      ) : (
        <BundleForm
          key={editing?.id ?? 'new'}
          editing={editing}
          otherCodes={otherCodes}
          onBack={backToList}
          onSaved={(message) => {
            showToast('success', message);
            backToList();
          }}
        />
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting) setPendingDelete(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !deleting) setPendingDelete(null);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-bundle-title"
            aria-describedby="delete-bundle-desc"
            className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 id="delete-bundle-title" className="text-sm font-bold text-white">Delete bundle?</h3>
                <p id="delete-bundle-desc" className="mt-1 text-xs text-zinc-400 break-words">
                  "{pendingDelete.name}" ({pendingDelete.code}) will be permanently removed. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-60 cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-4 z-[90] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl border bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl sm:right-6 ${
            toast.kind === 'success' ? 'border-zinc-700' : 'border-rose-500/50'
          }`}
        >
          {toast.kind === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
          )}
          <span className="break-words">{toast.text}</span>
        </div>
      )}
    </div>
  );
};
