import React, { useMemo, useState } from 'react';
import { AlertTriangle, Calendar, Package, Plus, RotateCcw, Search } from 'lucide-react';
import type { Bundle } from '../../../types';
import {
  createdDay,
  formatDisplayDate,
  formatPercent,
  formatRp,
  getBundleStatus,
  type BundleStatus,
} from '../../../utils/bundleMath';
import { RowActionMenu } from './RowActionMenu';

interface BundleDirectoryProps {
  bundles: Bundle[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onBackToProducts?: () => void;
  onAdd: () => void;
  onRefresh: () => void;
  onEdit: (bundle: Bundle) => void;
  onToggleActive: (bundle: Bundle) => void;
  onDelete: (bundle: Bundle) => void;
}

const STATUS_STYLES: Record<BundleStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  expired: { label: 'Expired', className: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  inactive: { label: 'Inactive', className: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30' },
};

const StatusBadge: React.FC<{ status: BundleStatus }> = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[status].className}`}
  >
    {STATUS_STYLES[status].label}
  </span>
);

const ItemsSummary: React.FC<{ bundle: Bundle; max?: number }> = ({ bundle, max = 2 }) => {
  const shown = bundle.items.slice(0, max);
  const rest = bundle.items.length - shown.length;
  return (
    <ul className="space-y-0.5">
      {shown.map((it, idx) => (
        <li key={`${it.productId}_${idx}`} className="flex items-baseline gap-1.5 text-xs text-zinc-300">
          <span className="font-mono font-semibold text-zinc-100 shrink-0">
            {it.qty} {it.unit}
          </span>
          <span className="truncate" title={it.productName}>
            {it.productName}
          </span>
        </li>
      ))}
      {rest > 0 && (
        <li
          className="text-[11px] font-semibold text-blue-300"
          title={bundle.items.slice(max).map((i) => `${i.qty} ${i.unit} ${i.productName}`).join('\n')}
        >
          +{rest} more
        </li>
      )}
    </ul>
  );
};

const ProfitCell: React.FC<{ bundle: Bundle }> = ({ bundle }) => {
  const negative = bundle.profit < 0;
  return (
    <div>
      <div className={`font-mono text-xs font-bold ${negative ? 'text-rose-300' : 'text-emerald-300'}`}>
        {formatRp(bundle.profit)}
      </div>
      <div className={`text-[11px] ${negative ? 'text-rose-400' : 'text-zinc-400'}`}>
        {formatPercent(bundle.marginPercent)} margin
      </div>
    </div>
  );
};

const QuotaCell: React.FC<{ bundle: Bundle }> = ({ bundle }) => {
  const remaining = Math.max(0, bundle.quota - bundle.redeemedCount);
  const usedPct = bundle.quota > 0 ? Math.min(100, (bundle.redeemedCount / bundle.quota) * 100) : 0;
  return (
    <div className="min-w-[72px]">
      <div className="font-mono text-xs text-zinc-100">
        {remaining.toLocaleString('id-ID')} <span className="text-zinc-500">/ {bundle.quota.toLocaleString('id-ID')}</span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-zinc-800" aria-hidden="true">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${usedPct}%` }} />
      </div>
      <div className="mt-0.5 text-[10px] text-zinc-500">left / quota</div>
    </div>
  );
};

export const BundleDirectory: React.FC<BundleDirectoryProps> = ({
  bundles,
  loading,
  refreshing,
  error,
  onBackToProducts,
  onAdd,
  onRefresh,
  onEdit,
  onToggleActive,
  onDelete,
}) => {
  const [search, setSearch] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bundles.filter((b) => {
      if (q) {
        const hit =
          b.name.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          b.items.some((i) => i.productName.toLowerCase().includes(q));
        if (!hit) return false;
      }
      if (createdFrom || createdTo) {
        const day = createdDay(b.createdAt);
        if (!day) return false;
        if (createdFrom && day < createdFrom) return false;
        if (createdTo && day > createdTo) return false;
      }
      return true;
    });
  }, [bundles, search, createdFrom, createdTo]);

  const hasFilters = search.trim() !== '' || createdFrom !== '' || createdTo !== '';
  const clearFilters = () => {
    setSearch('');
    setCreatedFrom('');
    setCreatedTo('');
  };

  const inputBase =
    'rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-5">
      {/* Breadcrumb + title */}
      <div>
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          <span>Admin</span>
          <span aria-hidden="true">/</span>
          {onBackToProducts ? (
            <button
              type="button"
              onClick={onBackToProducts}
              className="uppercase tracking-wider hover:text-blue-400 focus:outline-none focus-visible:underline cursor-pointer"
            >
              Product Management
            </button>
          ) : (
            <span>Product Management</span>
          )}
          <span aria-hidden="true">&gt;</span>
          <span className="text-blue-400" aria-current="page">Product Bundles</span>
        </nav>
        <h2 className="mt-2 flex items-center gap-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
          <Package className="h-6 w-6 text-blue-500" aria-hidden="true" />
          Product Bundles
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          Bundle products with promo pricing, quotas, and automated profit calculations.
        </p>
      </div>

      {/* Action bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bundle name..."
            aria-label="Search bundle name"
            className={`${inputBase} w-full py-2 pl-9 pr-3`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
            <span>Created from</span>
            <input
              type="date"
              value={createdFrom}
              max={createdTo || undefined}
              onChange={(e) => setCreatedFrom(e.target.value)}
              aria-label="Created from"
              className={`${inputBase} px-2.5 py-1.5 [color-scheme:dark]`}
            />
          </label>
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
            <span>To</span>
            <input
              type="date"
              value={createdTo}
              min={createdFrom || undefined}
              onChange={(e) => setCreatedTo(e.target.value)}
              aria-label="Created to"
              className={`${inputBase} px-2.5 py-1.5 [color-scheme:dark]`}
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-60 cursor-pointer"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500 cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Bundle
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-xs text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Could not load bundles from Firestore ({error}). Use Refresh to try again.</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 px-6 py-16 text-center text-sm text-zinc-400" role="status">
          Loading bundles...
        </div>
      ) : bundles.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/60 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-500">
            <Package className="h-8 w-8" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-bold text-white">No bundles yet</h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-400">
            Create your first product bundle by clicking the Add Bundle button.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-zinc-800 bg-zinc-900/90 px-6 py-14 text-center">
          <h3 className="text-base font-bold text-white">No bundles match your filters</h3>
          <p className="mt-1 text-xs text-zinc-400">Try a different name or widen the created date range.</p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table (desktop) */}
          <div className="hidden overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/95 shadow-sm lg:block">
            {/* `relative` keeps the sr-only header/caption inside this scroll container (no page-level horizontal scroll) */}
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-xs">
                <caption className="sr-only">Product bundles</caption>
                <thead className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">Code</th>
                    <th scope="col" className="px-3 py-3 font-bold">Bundle Name</th>
                    <th scope="col" className="px-3 py-3 font-bold">Items Included</th>
                    <th scope="col" className="px-3 py-3 font-bold">Start / End</th>
                    <th scope="col" className="px-3 py-3 text-right font-bold">Promo Price</th>
                    <th scope="col" className="px-3 py-3 text-right font-bold">Total Cost</th>
                    <th scope="col" className="px-3 py-3 font-bold">Profit</th>
                    <th scope="col" className="px-3 py-3 font-bold">Quota</th>
                    <th scope="col" className="px-3 py-3 font-bold">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {filtered.map((b) => (
                    <tr key={b.id} className="align-top hover:bg-zinc-800/30">
                      <td className="px-4 py-3 font-mono text-[11px] font-bold text-blue-300 whitespace-nowrap">{b.code}</td>
                      <td className="max-w-[200px] px-3 py-3 font-semibold text-white">
                        <span className="line-clamp-2" title={b.name}>{b.name}</span>
                      </td>
                      <td className="max-w-[240px] px-3 py-3"><ItemsSummary bundle={b} /></td>
                      <td className="px-3 py-3 text-zinc-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-zinc-500" aria-hidden="true" />
                          {formatDisplayDate(b.startDate)}
                        </div>
                        <div className="mt-0.5 pl-[18px] text-zinc-500">to {formatDisplayDate(b.endDate)}</div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-white whitespace-nowrap">{formatRp(b.totalPromoPrice)}</td>
                      <td className="px-3 py-3 text-right font-mono text-zinc-300 whitespace-nowrap">{formatRp(b.totalCost)}</td>
                      <td className="px-3 py-3 whitespace-nowrap"><ProfitCell bundle={b} /></td>
                      <td className="px-3 py-3"><QuotaCell bundle={b} /></td>
                      <td className="px-3 py-3"><StatusBadge status={getBundleStatus(b)} /></td>
                      <td className="px-4 py-3 text-right">
                        <RowActionMenu
                          label={b.name}
                          isActive={b.isActive}
                          onEdit={() => onEdit(b)}
                          onToggleActive={() => onToggleActive(b)}
                          onDelete={() => onDelete(b)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-zinc-800 px-4 py-2.5 text-[11px] text-zinc-500">
              Showing {filtered.length} of {bundles.length} bundle{bundles.length === 1 ? '' : 's'}
            </div>
          </div>

          {/* Cards (tablet / mobile) */}
          <ul className="space-y-3 lg:hidden" aria-label="Product bundles">
            {filtered.map((b) => (
              <li key={b.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/95 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-blue-300">{b.code}</span>
                      <StatusBadge status={getBundleStatus(b)} />
                    </div>
                    <h3 className="mt-1.5 text-sm font-bold text-white break-words">{b.name}</h3>
                  </div>
                  <RowActionMenu
                    label={b.name}
                    isActive={b.isActive}
                    onEdit={() => onEdit(b)}
                    onToggleActive={() => onToggleActive(b)}
                    onDelete={() => onDelete(b)}
                  />
                </div>

                <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Items included</div>
                  <ItemsSummary bundle={b} max={4} />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Promo price</dt>
                    <dd className="mt-0.5 font-mono font-bold text-white">{formatRp(b.totalPromoPrice)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total cost</dt>
                    <dd className="mt-0.5 font-mono text-zinc-300">{formatRp(b.totalCost)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Profit</dt>
                    <dd className="mt-0.5"><ProfitCell bundle={b} /></dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Quota</dt>
                    <dd className="mt-0.5"><QuotaCell bundle={b} /></dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Start / End</dt>
                    <dd className="mt-0.5 text-zinc-300">
                      {formatDisplayDate(b.startDate)} <span className="text-zinc-500">to</span> {formatDisplayDate(b.endDate)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
            <li className="px-1 text-[11px] text-zinc-500 list-none">
              Showing {filtered.length} of {bundles.length} bundle{bundles.length === 1 ? '' : 's'}
            </li>
          </ul>
        </>
      )}
    </div>
  );
};
