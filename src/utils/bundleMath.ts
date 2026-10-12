import type { Bundle, BundleItem } from '../types';

/**
 * Pure helpers for Product Bundles: money conversion, totals, dates and bundle codes.
 * Kept free of React / Firebase so they can be unit-tested in isolation.
 */

export const USD_TO_IDR = 15000;

/**
 * Normalises a catalog price to IDR using the same heuristic as the POS `formatMoney`:
 * values above 1000 are already IDR, smaller values are USD-scale and converted.
 */
export function toIdr(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value > 1000 ? Math.round(value) : Math.round(value * USD_TO_IDR);
}

export function formatRp(value: number): string {
  const rounded = Math.round(Number.isFinite(value) ? value : 0);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}Rp ${Math.abs(rounded).toLocaleString('id-ID')}`;
}

export function formatPercent(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(1)}%`;
}

export interface PricedLine {
  qty: number;
  costPrice: number;
  sellingPrice: number;
  promoPrice: number;
}

export interface BundleTotals {
  totalCost: number;
  totalStandardPrice: number;
  totalPromoPrice: number;
  totalDiscount: number;
  profit: number;
  marginPercent: number;
}

/** Discount per unit = standard selling price - promo price. */
export function unitDiscount(sellingPrice: number, promoPrice: number): number {
  return sellingPrice - promoPrice;
}

export function computeTotals(lines: PricedLine[]): BundleTotals {
  let totalCost = 0;
  let totalStandardPrice = 0;
  let totalPromoPrice = 0;
  for (const line of lines) {
    const qty = Number.isFinite(line.qty) && line.qty > 0 ? line.qty : 0;
    totalCost += (Number.isFinite(line.costPrice) ? line.costPrice : 0) * qty;
    totalStandardPrice += (Number.isFinite(line.sellingPrice) ? line.sellingPrice : 0) * qty;
    totalPromoPrice += (Number.isFinite(line.promoPrice) ? line.promoPrice : 0) * qty;
  }
  const profit = totalPromoPrice - totalCost;
  return {
    totalCost,
    totalStandardPrice,
    totalPromoPrice,
    totalDiscount: totalStandardPrice - totalPromoPrice,
    profit,
    marginPercent: totalPromoPrice > 0 ? (profit / totalPromoPrice) * 100 : 0,
  };
}

/** Whole number >= 1, otherwise NaN. */
export function parseQty(raw: string): number {
  const text = String(raw ?? '').trim();
  if (!/^\d+$/.test(text)) return NaN;
  const n = Number(text);
  return n >= 1 ? n : NaN;
}

/** Non-negative amount rounded to whole rupiah, otherwise NaN. */
export function parseMoney(raw: string): number {
  const text = String(raw ?? '').trim();
  if (text === '') return NaN;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n);
}

export function deriveBundleName(items: Pick<BundleItem, 'productName'>[]): string {
  const names = items.map((i) => i.productName.trim()).filter(Boolean);
  const joined = names.join(' + ');
  return joined.length > 80 ? `${joined.slice(0, 77)}...` : joined;
}

/** Next free BUNDLE-NN code (zero padded to two digits, grows past 99). */
export function nextBundleCode(existingCodes: string[]): string {
  let max = 0;
  for (const code of existingCodes) {
    const m = /^BUNDLE-(\d+)$/i.exec(code.trim());
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `BUNDLE-${String(max + 1).padStart(2, '0')}`;
}

/** Local calendar date as YYYY-MM-DD (what <input type="date"> uses). */
export function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toLocalISODate(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + days);
  return toLocalISODate(date);
}

export type BundleStatus = 'active' | 'scheduled' | 'expired' | 'inactive';

export function getBundleStatus(
  bundle: Pick<Bundle, 'isActive' | 'startDate' | 'endDate'>,
  today: string = todayISO()
): BundleStatus {
  if (!bundle.isActive) return 'inactive';
  if (bundle.endDate && bundle.endDate < today) return 'expired';
  if (bundle.startDate && bundle.startDate > today) return 'scheduled';
  return 'active';
}

/** createdAt (ISO timestamp) -> local YYYY-MM-DD, or '' when unparsable. */
export function createdDay(createdAt: string): string {
  const d = new Date(createdAt);
  return Number.isNaN(d.getTime()) ? '' : toLocalISODate(d);
}

export function formatDisplayDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '-';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
