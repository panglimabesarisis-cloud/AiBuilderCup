import type { Bundle, BundleDraft, BundleItem } from '../../../types';
import {
  addDaysISO,
  computeTotals,
  deriveBundleName,
  nextBundleCode,
  parseMoney,
  parseQty,
  todayISO,
} from '../../../utils/bundleMath';

/** A product as offered by the "Product Name" dropdown. Prices are IDR per unit. */
export interface BundleProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
}

/** One repeater row. qty / promoPrice stay strings so the inputs can be empty while typing. */
export interface BundleFormItem {
  key: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  qty: string;
  promoPrice: string;
}

export interface BundleFormValues {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  quota: string;
  items: BundleFormItem[];
}

export interface BundleItemErrors {
  product?: string;
  qty?: string;
  promoPrice?: string;
}

export interface BundleFormErrors {
  name?: string;
  code?: string;
  startDate?: string;
  endDate?: string;
  quota?: string;
  items?: string;
  itemErrors: Record<string, BundleItemErrors>;
}

let rowCounter = 0;
export function newRowKey(): string {
  rowCounter += 1;
  return `row_${Date.now().toString(36)}_${rowCounter}`;
}

export function emptyFormItem(): BundleFormItem {
  return {
    key: newRowKey(),
    productId: '',
    productName: '',
    sku: '',
    unit: 'pcs',
    costPrice: 0,
    sellingPrice: 0,
    qty: '1',
    promoPrice: '',
  };
}

export function formItemFromProduct(prev: BundleFormItem, product: BundleProduct): BundleFormItem {
  return {
    ...prev,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    unit: product.unit,
    costPrice: product.costPrice,
    sellingPrice: product.sellingPrice,
    // Start from the standard price (0 discount); the cashier lowers it to create the promo.
    promoPrice: String(product.sellingPrice),
  };
}

export function initialFormValues(existing: Bundle | null, otherCodes: string[]): BundleFormValues {
  if (existing) {
    return {
      name: existing.name,
      code: existing.code,
      startDate: existing.startDate,
      endDate: existing.endDate,
      quota: String(existing.quota),
      items: existing.items.map((it) => ({
        key: newRowKey(),
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        unit: it.unit,
        costPrice: it.costPrice,
        sellingPrice: it.sellingPrice,
        qty: String(it.qty),
        promoPrice: String(it.promoPrice),
      })),
    };
  }
  const today = todayISO();
  return {
    name: '',
    code: nextBundleCode(otherCodes),
    startDate: today,
    endDate: addDaysISO(today, 30),
    quota: '',
    items: [emptyFormItem()],
  };
}

/** Numeric view of the repeater rows, used by the live summary (invalid numbers count as 0). */
export function linesForTotals(items: BundleFormItem[]) {
  return items.map((it) => {
    const qty = parseQty(it.qty);
    const promo = parseMoney(it.promoPrice);
    return {
      qty: Number.isNaN(qty) ? 0 : qty,
      costPrice: it.costPrice,
      sellingPrice: it.sellingPrice,
      promoPrice: Number.isNaN(promo) ? 0 : promo,
    };
  });
}

const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export function validateBundleForm(
  values: BundleFormValues,
  otherCodes: string[]
): { valid: boolean; errors: BundleFormErrors } {
  const errors: BundleFormErrors = { itemErrors: {} };

  if (values.name.trim().length > 80) errors.name = 'Bundle name must be 80 characters or fewer.';

  const code = values.code.trim();
  if (!code) errors.code = 'Unique code is required.';
  else if (code.length > 30) errors.code = 'Code must be 30 characters or fewer.';
  else if (!CODE_PATTERN.test(code)) errors.code = 'Use letters, numbers, "-" or "_" only (no spaces).';
  else if (otherCodes.some((c) => c.trim().toLowerCase() === code.toLowerCase())) {
    errors.code = 'This code is already used by another bundle.';
  }

  if (!values.startDate) errors.startDate = 'Start date is required.';
  if (!values.endDate) errors.endDate = 'End date is required.';
  else if (values.startDate && values.endDate < values.startDate) {
    errors.endDate = 'End date must be on or after the start date.';
  }

  const quota = parseQty(values.quota);
  if (values.quota.trim() === '') errors.quota = 'Quota is required.';
  else if (Number.isNaN(quota)) errors.quota = 'Quota must be a whole number of at least 1.';
  else if (quota > 1_000_000) errors.quota = 'Quota cannot exceed 1,000,000.';

  if (values.items.length === 0) errors.items = 'Add at least one product.';
  for (const item of values.items) {
    const e: BundleItemErrors = {};
    if (!item.productId) e.product = 'Select a product.';
    const qty = parseQty(item.qty);
    if (Number.isNaN(qty)) e.qty = 'Whole number, min 1.';
    else if (qty > 9999) e.qty = 'Max 9,999.';
    if (item.promoPrice.trim() === '') e.promoPrice = 'Required.';
    else if (Number.isNaN(parseMoney(item.promoPrice))) e.promoPrice = 'Enter a valid amount.';
    if (e.product || e.qty || e.promoPrice) errors.itemErrors[item.key] = e;
  }

  const valid =
    !errors.name &&
    !errors.code &&
    !errors.startDate &&
    !errors.endDate &&
    !errors.quota &&
    !errors.items &&
    Object.keys(errors.itemErrors).length === 0;

  return { valid, errors };
}

/** Converts validated form values into the document payload (no undefined fields). */
export function buildBundleDraft(values: BundleFormValues): BundleDraft {
  const items: BundleItem[] = values.items.map((it) => ({
    productId: it.productId,
    productName: it.productName,
    sku: it.sku,
    unit: it.unit,
    qty: parseQty(it.qty),
    costPrice: it.costPrice,
    sellingPrice: it.sellingPrice,
    promoPrice: parseMoney(it.promoPrice),
  }));
  const totals = computeTotals(items);
  return {
    code: values.code.trim(),
    name: values.name.trim() || deriveBundleName(items),
    items,
    startDate: values.startDate,
    endDate: values.endDate,
    quota: parseQty(values.quota),
    ...totals,
  };
}
