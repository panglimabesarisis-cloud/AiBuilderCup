import { Product, Transaction } from '../../types';

export type ReportPeriod = 'today' | '7d' | '30d' | 'month';
export type OutletFilterId = 'all' | 'out_1' | 'out_2' | 'out_3';

export interface ReportFilter {
  period: ReportPeriod;
  outletId: OutletFilterId;
}

export interface KpiSummary {
  totalRevenue: number;
  totalProfit: number; // totalAmount - totalCost
  transactionsCount: number;
  completedCount: number;
  fraudCount: number;
  pendingCount: number;
  totalStockValue: number;
  criticalStockCount: number;
  habisCount: number;
  menipisCount: number;
  amanCount: number;
}

export interface DailyReport {
  date: string; // ISO date or formatted
  label: string; // e.g. "12 Okt" or "08:00"
  revenue: number;
  profit: number;
  transactionCount: number;
}

export interface OutletMetric {
  outletId: string;
  name: string;
  code: string;
  revenue: number;
  profit: number;
  totalTransactions: number;
  completedCount: number;
  fraudCount: number;
  pendingCount: number;
  stockValue: number;
  criticalStockCount: number;
  totalStockUnits: number;
}

export interface PaymentMetric {
  method: string;
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface ChannelMetric {
  channel: string;
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface LocationMetric {
  locationId: string;
  name: string;
  type: 'outlet' | 'warehouse';
  stockValue: number;
  productCount: number;
  criticalCount: number;
  totalUnits: number;
  cartonsStored: number;
}

export interface MultiOutletReportData {
  kpi: KpiSummary;
  daily: DailyReport[];
  byOutlet: OutletMetric[];
  byPayment: PaymentMetric[];
  byChannel: ChannelMetric[];
  byLocation: LocationMetric[];
  filteredTransactions: Transaction[];
  filteredProducts: Product[];
}

export const MASTER_OUTLETS = [
  {
    id: 'out_1',
    name: 'RiskCart Flagship Store (Pusat)',
    code: 'RC-JKT-01',
    type: 'Toko Utama & Hub',
    address: 'Jl. Boulevard Raya Blok QF1 No. 12, Kelapa Gading, Jakarta Utara',
    phone: '+62 812-9988-7711',
    cashierActive: 3,
    geofenceRadius: 300,
    isHQ: true,
  },
  {
    id: 'out_2',
    name: 'RiskCart Express Tebet',
    code: 'RC-JKT-02',
    type: 'Cabang Satelit',
    address: 'Jl. Tebet Barat Dalam Raya No. 45, Jakarta Selatan',
    phone: '+62 813-2233-4455',
    cashierActive: 1,
    geofenceRadius: 250,
    isHQ: false,
  },
  {
    id: 'out_3',
    name: 'RiskCart Kios BSD Fresh',
    code: 'RC-TGR-01',
    type: 'Cabang Kios',
    address: 'Ruko Golden Madrid 2 Blok F-08, BSD City, Tangerang Selatan',
    phone: '+62 817-4455-6677',
    cashierActive: 2,
    geofenceRadius: 200,
    isHQ: false,
  },
] as const;

export const MASTER_WAREHOUSES = [
  {
    id: 'wh_1',
    name: 'Central Distribution Center (CDC Cikarang)',
    code: 'WH-CKR-CENTRAL',
    manager: 'Bambang Supriyanto',
    capacityPct: 78,
    address: 'Kawasan Industri Delta Silicon 3, Lippo Cikarang',
    temperature: 'Ambient (24°C)',
    status: 'active',
  },
  {
    id: 'wh_2',
    name: 'Hub Transit Jakarta Utara',
    code: 'WH-JKT-NORTH',
    manager: 'Rian Hidayat',
    capacityPct: 45,
    address: 'Kawasan Pergudangan Pluit Blok C No. 5, Pluit, Jakarta Utara',
    temperature: 'Cold Storage (4°C) & Ambient',
    status: 'active',
  },
] as const;

export function getStartDateForPeriod(period: ReportPeriod, now = new Date()): Date {
  const start = new Date(now);
  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (period === '7d') {
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (period === '30d') {
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return start;
}

export function computeReport(
  transactions: Transaction[],
  products: Product[],
  filter: ReportFilter
): MultiOutletReportData {
  const { period, outletId } = filter;
  const now = new Date();
  const startDate = getStartDateForPeriod(period, now);

  // Filter transactions by period and outlet
  const filteredTransactions = transactions.filter((t) => {
    // Outlet filter
    const txOutlet = t.outletId ?? 'out_1';
    if (outletId !== 'all' && txOutlet !== outletId) {
      return false;
    }

    // Period filter
    if (!t.createdAt) return true;
    const txDate = new Date(t.createdAt);
    if (isNaN(txDate.getTime())) return true;
    return txDate >= startDate && txDate <= now;
  });

  // Filter products by outlet if specific outlet selected, otherwise all products
  const filteredProducts = products.filter((p) => {
    if (outletId === 'all') return true;
    const pLoc = p.storageLocation ?? 'out_1';
    return pLoc === outletId;
  });

  // KPI Calculations
  let totalRevenue = 0;
  let totalProfit = 0;
  let completedCount = 0;
  let fraudCount = 0;
  let pendingCount = 0;

  for (const t of filteredTransactions) {
    if (t.status === 'completed') {
      completedCount++;
      totalRevenue += t.totalAmount;
      const cost = t.totalCost ?? t.totalAmount * 0.65;
      totalProfit += t.totalAmount - cost;
    } else if (t.status === 'flagged_fraud') {
      fraudCount++;
    } else if (t.status === 'pending_approval' || t.status === 'pending') {
      pendingCount++;
    }
  }

  // Stock status calculations:
  // Habis (<= 0) / Menipis (<= minStockAlert) / Aman; Kritis = Habis + Menipis
  let totalStockValue = 0;
  let habisCount = 0;
  let menipisCount = 0;
  let amanCount = 0;

  for (const p of filteredProducts) {
    const units = p.stockInUnits ?? 0;
    const cost = p.costPerUnit ?? 0;
    totalStockValue += units * cost;

    const minAlert = p.minStockAlert ?? 10;
    if (units <= 0) {
      habisCount++;
    } else if (units <= minAlert) {
      menipisCount++;
    } else {
      amanCount++;
    }
  }

  const criticalStockCount = habisCount + menipisCount;

  const kpi: KpiSummary = {
    totalRevenue,
    totalProfit,
    transactionsCount: filteredTransactions.length,
    completedCount,
    fraudCount,
    pendingCount,
    totalStockValue,
    criticalStockCount,
    habisCount,
    menipisCount,
    amanCount,
  };

  // Daily Trend calculation
  const dailyMap = new Map<string, { label: string; revenue: number; profit: number; count: number; dateObj: Date }>();

  // Initialize date buckets for period to ensure smooth continuous lines
  const numDays = period === 'today' ? 1 : period === '7d' ? 7 : 30;
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    dailyMap.set(key, { label: dayLabel, revenue: 0, profit: 0, count: 0, dateObj: d });
  }

  for (const t of filteredTransactions) {
    if (t.status !== 'completed' || !t.createdAt) continue;
    const txDate = new Date(t.createdAt);
    if (isNaN(txDate.getTime())) continue;
    const key = txDate.toISOString().split('T')[0];
    const existing = dailyMap.get(key);
    const cost = t.totalCost ?? t.totalAmount * 0.65;
    const profit = t.totalAmount - cost;
    if (existing) {
      existing.revenue += t.totalAmount;
      existing.profit += profit;
      existing.count += 1;
    } else {
      const dayLabel = txDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      dailyMap.set(key, { label: dayLabel, revenue: t.totalAmount, profit, count: 1, dateObj: txDate });
    }
  }

  const daily: DailyReport[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      label: data.label,
      revenue: data.revenue,
      profit: data.profit,
      transactionCount: data.count,
    }));

  // By Outlet Metrics
  // Note: Calculated in the selected period for comparison
  const byOutlet: OutletMetric[] = MASTER_OUTLETS.map((outlet) => {
    const outletTxs = transactions.filter((t) => {
      const txOutlet = t.outletId ?? 'out_1';
      if (txOutlet !== outlet.id) return false;
      if (!t.createdAt) return true;
      const txDate = new Date(t.createdAt);
      if (isNaN(txDate.getTime())) return true;
      return txDate >= startDate && txDate <= now;
    });

    let rev = 0;
    let prof = 0;
    let completed = 0;
    let fraud = 0;
    let pending = 0;

    for (const t of outletTxs) {
      if (t.status === 'completed') {
        completed++;
        rev += t.totalAmount;
        prof += t.totalAmount - (t.totalCost ?? t.totalAmount * 0.65);
      } else if (t.status === 'flagged_fraud') {
        fraud++;
      } else if (t.status === 'pending_approval' || t.status === 'pending') {
        pending++;
      }
    }

    const outletProds = products.filter((p) => (p.storageLocation ?? 'out_1') === outlet.id);
    let stockVal = 0;
    let critical = 0;
    let totalUnits = 0;

    for (const p of outletProds) {
      const units = p.stockInUnits ?? 0;
      stockVal += units * (p.costPerUnit ?? 0);
      totalUnits += units;
      const minAlert = p.minStockAlert ?? 10;
      if (units <= minAlert) critical++;
    }

    return {
      outletId: outlet.id,
      name: outlet.name,
      code: outlet.code,
      revenue: rev,
      profit: prof,
      totalTransactions: outletTxs.length,
      completedCount: completed,
      fraudCount: fraud,
      pendingCount: pending,
      stockValue: stockVal,
      criticalStockCount: critical,
      totalStockUnits: totalUnits,
    };
  });

  // By Payment Method (Donut)
  const paymentMap = new Map<string, { amount: number; count: number }>();
  let totalPaymentCompleted = 0;

  for (const t of filteredTransactions) {
    if (t.status !== 'completed') continue;
    const method = t.paymentMethod || 'cash';
    const entry = paymentMap.get(method) || { amount: 0, count: 0 };
    entry.amount += t.totalAmount;
    entry.count += 1;
    paymentMap.set(method, entry);
    totalPaymentCompleted += t.totalAmount;
  }

  const paymentLabels: Record<string, string> = {
    cash: 'Tunai (Cash)',
    qris: 'QRIS Statis/Dinamis',
    card: 'Debit / Kartu Kredit',
    bank_transfer: 'Transfer Bank',
    debt: 'Hutang / Kasbon',
    cod: 'COD',
  };

  const byPayment: PaymentMetric[] = Array.from(paymentMap.entries())
    .map(([method, data]) => ({
      method,
      label: paymentLabels[method] || method.toUpperCase(),
      amount: data.amount,
      count: data.count,
      percentage: totalPaymentCompleted > 0 ? (data.amount / totalPaymentCompleted) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // By Channel (POS vs PWA)
  const channelMap = new Map<string, { amount: number; count: number }>();
  let totalChannelCompleted = 0;

  for (const t of filteredTransactions) {
    if (t.status !== 'completed') continue;
    const channel = t.channel || 'pos';
    const entry = channelMap.get(channel) || { amount: 0, count: 0 };
    entry.amount += t.totalAmount;
    entry.count += 1;
    channelMap.set(channel, entry);
    totalChannelCompleted += t.totalAmount;
  }

  const channelLabels: Record<string, string> = {
    pos: 'POS Kasir Terminal',
    pwa_client: 'Client PWA (Member Self-Order)',
    offline_pos: 'POS Kasir Offline Mode',
    client_pwa: 'PWA Online Order',
  };

  const byChannel: ChannelMetric[] = Array.from(channelMap.entries()).map(([channel, data]) => ({
    channel,
    label: channelLabels[channel] || channel,
    amount: data.amount,
    count: data.count,
    percentage: totalChannelCompleted > 0 ? (data.amount / totalChannelCompleted) * 100 : 0,
  }));

  // By Location (outlets + warehouses)
  const locationList: { id: string; name: string; type: 'outlet' | 'warehouse' }[] = [
    ...MASTER_OUTLETS.map((o) => ({ id: o.id, name: o.name, type: 'outlet' as const })),
    ...MASTER_WAREHOUSES.map((w) => ({ id: w.id, name: w.name, type: 'warehouse' as const })),
  ];

  const byLocation: LocationMetric[] = locationList.map((loc) => {
    const locProds = products.filter((p) => (p.storageLocation ?? 'out_1') === loc.id);
    let sVal = 0;
    let cCount = 0;
    let tUnits = 0;
    let cartons = 0;

    for (const p of locProds) {
      const units = p.stockInUnits ?? 0;
      const cogs = p.costPerUnit ?? 0;
      sVal += units * cogs;
      tUnits += units;
      const pieces = Math.max(1, p.piecesPerCarton || 1);
      cartons += Math.floor(units / pieces);
      const minAlert = p.minStockAlert ?? 10;
      if (units <= minAlert) {
        cCount++;
      }
    }

    return {
      locationId: loc.id,
      name: loc.name,
      type: loc.type,
      stockValue: sVal,
      productCount: locProds.length,
      criticalCount: cCount,
      totalUnits: tUnits,
      cartonsStored: cartons,
    };
  });

  return {
    kpi,
    daily,
    byOutlet,
    byPayment,
    byChannel,
    byLocation,
    filteredTransactions,
    filteredProducts,
  };
}
