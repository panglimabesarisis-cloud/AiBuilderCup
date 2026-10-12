import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, Loader2, Plus, Trash2 } from 'lucide-react';
import type { Bundle } from '../../../types';
import { createBundle, updateBundle } from '../../../services/bundleService';
import {
  computeTotals,
  formatPercent,
  formatRp,
  parseMoney,
  parseQty,
  unitDiscount,
} from '../../../utils/bundleMath';
import {
  buildBundleDraft,
  emptyFormItem,
  formItemFromProduct,
  initialFormValues,
  linesForTotals,
  validateBundleForm,
  type BundleFormItem,
  type BundleFormValues,
  type BundleProduct,
} from './bundleForm';
import { useBundleProducts } from './useBundleData';

interface BundleFormProps {
  /** Bundle being edited, or null to create a new one. */
  editing: Bundle | null;
  /** Codes of all OTHER bundles (used for the uniqueness check and the next auto code). */
  otherCodes: string[];
  onBack: () => void;
  onSaved: (message: string) => void;
}

const inputClass = (invalid: boolean) =>
  `w-full rounded-xl border bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 ${
    invalid ? 'border-rose-500/70 focus:ring-rose-500' : 'border-zinc-800 focus:ring-blue-500'
  }`;

const readOnlyClass =
  'w-full cursor-default rounded-xl border border-zinc-800/80 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none';

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, htmlFor, error, hint, required, className = '', children }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
      {label}
      {required && <span className="ml-0.5 text-rose-400" aria-hidden="true">*</span>}
    </label>
    {children}
    {error ? (
      <p id={`${htmlFor}-error`} className="mt-1 text-[11px] font-medium text-rose-300">
        {error}
      </p>
    ) : hint ? (
      <p className="mt-1 text-[11px] text-zinc-500">{hint}</p>
    ) : null}
  </div>
);

export const BundleForm: React.FC<BundleFormProps> = ({ editing, otherCodes, onBack, onSaved }) => {
  const { products, loading: productsLoading, error: productsError } = useBundleProducts();
  const [values, setValues] = useState<BundleFormValues>(() => initialFormValues(editing, otherCodes));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { valid, errors } = useMemo(() => validateBundleForm(values, otherCodes), [values, otherCodes]);
  const totals = useMemo(() => computeTotals(linesForTotals(values.items)), [values.items]);
  const errorCount = useMemo(
    () =>
      [errors.name, errors.code, errors.startDate, errors.endDate, errors.quota, errors.items].filter(Boolean).length +
      Object.values(errors.itemErrors).reduce(
        (n, e) => n + [e.product, e.qty, e.promoPrice].filter(Boolean).length,
        0
      ),
    [errors]
  );

  // Dropdown options: live catalog plus any product already saved in this bundle (it may no longer exist).
  const options = useMemo(() => {
    const map = new Map<string, BundleProduct>();
    products.forEach((p) => map.set(p.id, p));
    values.items.forEach((it) => {
      if (it.productId && !map.has(it.productId)) {
        map.set(it.productId, {
          id: it.productId,
          name: it.productName,
          sku: it.sku,
          category: '',
          unit: it.unit,
          costPrice: it.costPrice,
          sellingPrice: it.sellingPrice,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, values.items]);

  // Move focus to a freshly added row's product dropdown.
  useEffect(() => {
    if (!focusKey) return;
    document.getElementById(`product-${focusKey}`)?.focus();
    setFocusKey(null);
  }, [focusKey]);

  const setField = <K extends keyof BundleFormValues>(field: K, value: BundleFormValues[K]) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const updateItem = (key: string, patch: Partial<BundleFormItem>) =>
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.key === key ? { ...it, ...patch } : it)),
    }));

  const selectProduct = (key: string, productId: string) => {
    const product = options.find((p) => p.id === productId);
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((it) => {
        if (it.key !== key) return it;
        if (!product) return { ...emptyFormItem(), key, qty: it.qty };
        return formItemFromProduct(it, product);
      }),
    }));
  };

  const addItem = () => {
    const row = emptyFormItem();
    setValues((prev) => ({ ...prev, items: [...prev.items, row] }));
    setFocusKey(row.key);
  };

  const removeItem = (key: string) =>
    setValues((prev) =>
      prev.items.length <= 1 ? prev : { ...prev, items: prev.items.filter((it) => it.key !== key) }
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSubmitted(true);
    setSubmitError(null);
    if (!valid) {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    setSaving(true);
    try {
      const draft = buildBundleDraft(values);
      if (editing) {
        await updateBundle(editing.id, draft);
        onSaved(`Bundle "${draft.name}" updated.`);
      } else {
        await createBundle(draft);
        onSaved(`Bundle "${draft.name}" created.`);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save the bundle.');
      setSaving(false);
    }
  };

  const showErr = submitted;
  const profitNegative = totals.profit < 0;
  const noProducts = !productsLoading && options.length === 0;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Top bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {editing ? 'Edit Bundle' : 'Add Bundle'}
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Cost price and selling price automatically calculate from selected items
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back
        </button>
      </div>

      {/* Product repeater */}
      <section aria-label="Bundled products" className="space-y-4">
        {(productsError || noProducts) && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {productsError
                ? `Could not load products from Firestore (${productsError}).`
                : 'No products found in Firestore. Add products first, then come back to build a bundle.'}
            </span>
          </div>
        )}
        {errors.items && showErr && (
          <p role="alert" className="text-xs font-medium text-rose-300">{errors.items}</p>
        )}

        {values.items.map((item, index) => {
          const itemErr = showErr ? errors.itemErrors[item.key] : undefined;
          const qty = parseQty(item.qty);
          const promo = parseMoney(item.promoPrice);
          const discount = item.productId && !Number.isNaN(promo) ? unitDiscount(item.sellingPrice, promo) : null;
          const linePromo = !Number.isNaN(qty) && !Number.isNaN(promo) ? qty * promo : null;
          const id = (name: string) => `${name}-${item.key}`;
          const takenByOthers = new Set(values.items.filter((o) => o.key !== item.key).map((o) => o.productId));

          return (
            <div key={item.key} className="rounded-2xl border border-zinc-800 bg-zinc-900/95 p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-white">Product {index + 1}</h3>
                {values.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    aria-label={`Delete Product ${index + 1}`}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-950/50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-5">
                <Field
                  label="Product Name"
                  htmlFor={id('product')}
                  error={itemErr?.product}
                  required
                  className="col-span-2 lg:col-span-5"
                >
                  <select
                    id={id('product')}
                    value={item.productId}
                    onChange={(e) => selectProduct(item.key, e.target.value)}
                    aria-invalid={itemErr?.product ? true : undefined}
                    aria-describedby={itemErr?.product ? `${id('product')}-error` : undefined}
                    className={inputClass(Boolean(itemErr?.product))}
                  >
                    <option value="">
                      {productsLoading && options.length === 0 ? 'Loading products...' : 'Select a product'}
                    </option>
                    {options.map((p) => (
                      <option key={p.id} value={p.id} disabled={takenByOthers.has(p.id)}>
                        {p.name}
                        {p.sku ? ` (${p.sku})` : ''}
                        {takenByOthers.has(p.id) ? ' - already added' : ''}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Qty" htmlFor={id('qty')} error={itemErr?.qty} required>
                  <input
                    id={id('qty')}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={item.qty}
                    onChange={(e) => updateItem(item.key, { qty: e.target.value })}
                    aria-invalid={itemErr?.qty ? true : undefined}
                    aria-describedby={itemErr?.qty ? `${id('qty')}-error` : undefined}
                    className={inputClass(Boolean(itemErr?.qty))}
                  />
                </Field>

                <Field label="Promo Price" htmlFor={id('promo')} error={itemErr?.promoPrice} hint="Per unit" required>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500">Rp</span>
                    <input
                      id={id('promo')}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      value={item.promoPrice}
                      onChange={(e) => updateItem(item.key, { promoPrice: e.target.value })}
                      aria-invalid={itemErr?.promoPrice ? true : undefined}
                      aria-describedby={itemErr?.promoPrice ? `${id('promo')}-error` : undefined}
                      className={`${inputClass(Boolean(itemErr?.promoPrice))} pl-9`}
                    />
                  </div>
                </Field>

                <Field label="Cost Price" htmlFor={id('cost')} hint="Per unit">
                  <input
                    id={id('cost')}
                    readOnly
                    tabIndex={-1}
                    value={item.productId ? formatRp(item.costPrice) : '-'}
                    className={readOnlyClass}
                  />
                </Field>

                <Field label="Selling Price" htmlFor={id('sell')} hint="Standard retail, per unit">
                  <input
                    id={id('sell')}
                    readOnly
                    tabIndex={-1}
                    value={item.productId ? formatRp(item.sellingPrice) : '-'}
                    className={readOnlyClass}
                  />
                </Field>

                <Field label="Discount / Product" htmlFor={id('disc')} hint="Selling price - promo price" className="col-span-2 lg:col-span-1">
                  <input
                    id={id('disc')}
                    readOnly
                    tabIndex={-1}
                    value={discount === null ? '-' : formatRp(discount)}
                    className={`${readOnlyClass} ${
                      discount === null ? '' : discount > 0 ? '!text-emerald-300' : discount < 0 ? '!text-rose-300' : ''
                    }`}
                  />
                </Field>
              </div>

              {discount !== null && discount < 0 && (
                <p className="mt-3 text-[11px] text-amber-300">
                  Promo price is above the standard selling price for this product.
                </p>
              )}
              {linePromo !== null && item.productId && (
                <p className="mt-3 text-[11px] text-zinc-500">
                  Line total at promo price: <span className="font-mono text-zinc-300">{formatRp(linePromo)}</span>
                </p>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={addItem}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-3 text-xs font-bold text-blue-300 transition hover:border-blue-500/60 hover:bg-zinc-900 cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Product
        </button>
      </section>

      {/* Configuration + live financial summary */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-label="Bundle configuration" className="rounded-2xl border border-zinc-800 bg-zinc-900/95 p-4 shadow-sm sm:p-5">
          <h3 className="mb-4 text-sm font-bold text-white">Bundle Configuration</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Bundle Name"
              htmlFor="bundle-name"
              error={showErr ? errors.name : undefined}
              hint="Optional. Leave blank to use the product names."
              className="sm:col-span-2"
            >
              <input
                id="bundle-name"
                type="text"
                value={values.name}
                onChange={(e) => setField('name', e.target.value)}
                maxLength={80}
                placeholder="e.g. Summer Refreshment Pack"
                aria-invalid={showErr && errors.name ? true : undefined}
                aria-describedby={showErr && errors.name ? 'bundle-name-error' : undefined}
                className={inputClass(Boolean(showErr && errors.name))}
              />
            </Field>

            <Field label="Start Date" htmlFor="bundle-start" error={showErr ? errors.startDate : undefined} required>
              <input
                id="bundle-start"
                type="date"
                value={values.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
                aria-invalid={showErr && errors.startDate ? true : undefined}
                aria-describedby={showErr && errors.startDate ? 'bundle-start-error' : undefined}
                className={`${inputClass(Boolean(showErr && errors.startDate))} [color-scheme:dark]`}
              />
            </Field>

            <Field label="End Date" htmlFor="bundle-end" error={showErr ? errors.endDate : undefined} required>
              <input
                id="bundle-end"
                type="date"
                value={values.endDate}
                min={values.startDate || undefined}
                onChange={(e) => setField('endDate', e.target.value)}
                aria-invalid={showErr && errors.endDate ? true : undefined}
                aria-describedby={showErr && errors.endDate ? 'bundle-end-error' : undefined}
                className={`${inputClass(Boolean(showErr && errors.endDate))} [color-scheme:dark]`}
              />
            </Field>

            <Field
              label="Quota"
              htmlFor="bundle-quota"
              error={showErr ? errors.quota : undefined}
              hint="Maximum number of times this bundle can be redeemed."
              required
            >
              <input
                id="bundle-quota"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={values.quota}
                onChange={(e) => setField('quota', e.target.value)}
                placeholder="e.g. 100"
                aria-invalid={showErr && errors.quota ? true : undefined}
                aria-describedby={showErr && errors.quota ? 'bundle-quota-error' : undefined}
                className={inputClass(Boolean(showErr && errors.quota))}
              />
            </Field>

            <Field
              label="Unique Code"
              htmlFor="bundle-code"
              error={showErr ? errors.code : undefined}
              hint="Auto-generated. You can edit it."
              required
            >
              <input
                id="bundle-code"
                type="text"
                value={values.code}
                onChange={(e) => setField('code', e.target.value)}
                maxLength={30}
                aria-invalid={showErr && errors.code ? true : undefined}
                aria-describedby={showErr && errors.code ? 'bundle-code-error' : undefined}
                className={`${inputClass(Boolean(showErr && errors.code))} font-mono`}
              />
            </Field>
          </div>
        </section>

        <section aria-label="Financial summary" className="rounded-2xl border border-zinc-800 bg-zinc-900/95 p-4 shadow-sm sm:p-5">
          <h3 className="mb-4 text-sm font-bold text-white">Financial Summary</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-zinc-400">Total Cost Price</dt>
              <dd className="font-mono font-semibold text-zinc-100">{formatRp(totals.totalCost)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-zinc-400">Total Standard Price</dt>
              <dd className="font-mono font-semibold text-zinc-100">{formatRp(totals.totalStandardPrice)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-zinc-400">Total Promo Price</dt>
              <dd className="font-mono font-semibold text-white">{formatRp(totals.totalPromoPrice)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-zinc-800 pt-3">
              <dt className="text-zinc-400">Total Discount</dt>
              <dd className={`font-mono font-semibold ${totals.totalDiscount < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                {formatRp(totals.totalDiscount)}
              </dd>
            </div>
          </dl>

          <div
            className={`mt-5 rounded-xl border px-4 py-3 ${
              profitNegative
                ? 'border-rose-500/40 bg-rose-500/10'
                : 'border-emerald-500/40 bg-emerald-500/10'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Bundle Profit</div>
            <div
              data-testid="bundle-profit"
              className={`mt-0.5 font-mono text-2xl font-bold ${profitNegative ? 'text-rose-300' : 'text-emerald-300'}`}
            >
              {formatRp(totals.profit)}
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-400">
              {formatPercent(totals.marginPercent)} margin on promo price
            </div>
            {profitNegative && (
              <p className="mt-2 text-[11px] font-medium text-rose-300">
                The promo price is below total cost, so this bundle sells at a loss.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="space-y-3">
        {submitError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-xs text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Could not save the bundle: {submitError}</span>
          </div>
        )}
        {showErr && !valid && (
          <p role="alert" className="text-right text-xs font-medium text-rose-300">
            Please fix {errorCount} highlighted field{errorCount === 1 ? '' : 's'} before submitting.
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-70 sm:w-auto cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Submit Bundle'}
          </button>
        </div>
      </div>
    </form>
  );
};
