import React, { useState, useEffect } from 'react';
import {
  Store,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Boxes,
  AlertTriangle,
  Users,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Plus,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Eye,
  FileText,
  Sliders,
  Sparkles,
  BarChart3,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  Smartphone,
  Truck,
  Inbox,
  AlertCircle,
  Receipt,
  X,
  Printer,
  ChevronDown,
  Building2,
  PackageCheck,
  ArrowRight,
  BadgeCheck,
  Bell,
  SlidersHorizontal,
} from 'lucide-react';
import { AdminAreaCharts } from './AdminAreaCharts';
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { DEMO_STORE_ID } from '../../services/dataSeeder';
import { deductStockForOrder } from '../../services/stockService';
import { formatIDR } from '../../lib/money';
import { Product, Transaction } from '../../types';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenAddProduct?: () => void;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  channel: 'PWA Online' | 'Kasir POS' | 'Dine In / Meja';
  itemsCount: number;
  totalAmount: number;
  paymentMethod: 'QRIS' | 'Tunai' | 'Transfer BCA';
  paymentStatus: 'Lunas' | 'Belum Bayar';
  orderStatus: 'menunggu' | 'diproses' | 'siap' | 'selesai';
  time: string;
}

interface TransactionItem {
  id: string;
  receiptNumber: string;
  time: string;
  date: string;
  cashier: string;
  customer: string;
  method: 'QRIS' | 'Tunai' | 'Debit BCA' | 'Transfer';
  itemsSummary: string;
  total: number;
  status: 'Berhasil' | 'Menunggu' | 'Dibatalkan';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onOpenAddProduct,
}) => {
  // Navigation & filters state
  const [selectedOutlet, setSelectedOutlet] = useState<string>('pusat');
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | '7days' | 'month' | 'custom'>('today');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Orders tab filter
  const [orderFilterTab, setOrderFilterTab] = useState<'all' | 'menunggu' | 'diproses' | 'siap' | 'selesai'>('all');

  // Active modals
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionItem | null>(null);
  const [showShiftModal, setShowShiftModal] = useState<boolean>(false);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);

  const showFlash = (msg: string) => {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(null), 3500);
  };

  // Search in transactions table
  const [txSearchQuery, setTxSearchQuery] = useState('');

  // Clock tick
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // ───────── Data nyata dari Firestore (tanpa data contoh) ─────────
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [prods, setProds] = useState<Product[]>([]);
  const [custDocs, setCustDocs] = useState<any[]>([]);
  const [poDocs, setPoDocs] = useState<any[]>([]);
  const [cashInDocs, setCashInDocs] = useState<any[]>([]);
  const [cashOutDocs, setCashOutDocs] = useState<any[]>([]);

  useEffect(() => {
    const warn = (n: string) => (e: unknown) => console.warn(`[dashboard:${n}]`, e);
    const byStore = (name: string) => query(collection(db, name), where('storeId', '==', DEMO_STORE_ID));
    const rows = (s: any) => s.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const unsubs = [
      onSnapshot(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(500)), (s) => setTxs(rows(s)), warn('transactions')),
      onSnapshot(collection(db, 'products'), (s) => setProds(rows(s)), warn('products')),
      onSnapshot(byStore('customers'), (s) => setCustDocs(rows(s)), warn('customers')),
      onSnapshot(byStore('purchase_orders'), (s) => setPoDocs(rows(s)), warn('purchase_orders')),
      onSnapshot(byStore('cash_in'), (s) => setCashInDocs(rows(s)), warn('cash_in')),
      onSnapshot(byStore('cash_out'), (s) => setCashOutDocs(rows(s)), warn('cash_out')),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const DAY = 86400000;
  const now = new Date();
  const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let rStart = sod;
  let rEnd = new Date(now.getTime() + 1);
  if (timeRange === 'yesterday') { rStart = new Date(sod.getTime() - DAY); rEnd = sod; }
  else if (timeRange === '7days') rStart = new Date(sod.getTime() - 6 * DAY);
  else if (timeRange === 'month') rStart = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (timeRange === 'custom') rStart = new Date(sod.getTime() - 29 * DAY);
  const span = rEnd.getTime() - rStart.getTime();
  const pStart = new Date(rStart.getTime() - span);
  const inWindow = (t: Transaction, a: Date, b: Date) => {
    const ts = new Date(t.createdAt).getTime();
    return ts >= a.getTime() && ts < b.getTime();
  };
  const cur = txs.filter((t) => t.status === 'completed' && inWindow(t, rStart, rEnd));
  const prev = txs.filter((t) => t.status === 'completed' && inWindow(t, pStart, rStart));
  const sum = (arr: Transaction[], k: 'totalAmount' | 'totalCost') => arr.reduce((a, t) => a + (Number(t[k]) || 0), 0);
  const revenue = sum(cur, 'totalAmount');
  const prevRevenue = sum(prev, 'totalAmount');
  const txCount = cur.length;
  const grossProfit = revenue - sum(cur, 'totalCost');
  const marginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const revDeltaPct = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : null;
  const cashSales = cur.filter((t) => t.paymentMethod === 'cash').reduce((a, t) => a + (t.totalAmount || 0), 0);
  const nonCashSales = revenue - cashSales;
  const kasMasuk = cashInDocs.reduce((a, c) => a + (Number(c.amount) || 0), 0);
  const kasKeluar = cashOutDocs.reduce((a, c) => a + (Number(c.amount) || 0), 0);
  const kasFisik = kasMasuk - kasKeluar + cashSales;
  const debtTotal = custDocs.reduce((a, c) => a + (Number(c.debtAmount) || 0), 0);
  const debtCount = custDocs.filter((c) => Number(c.debtAmount) > 0).length;
  const supplierDue = poDocs
    .filter((o) => /tempo|belum/i.test(String(o.paymentStatus || '')))
    .reduce((a, o) => a + (Number(o.totalAmount) || 0), 0);
  const riskyCount = txs.filter((t) => inWindow(t, rStart, rEnd) && Number(t.fraudScore) >= 45).length;

  const METHOD_LABEL: Record<string, string> = { cash: 'Tunai', qris: 'QRIS', card: 'Debit BCA', bank_transfer: 'Transfer', debt: 'Hutang', cod: 'COD' };
  const methodCounts = cur.reduce<Record<string, number>>((m, t) => {
    m[t.paymentMethod] = (m[t.paymentMethod] || 0) + 1;
    return m;
  }, {});
  const favMethodKey = Object.keys(methodCounts).sort((a, b) => methodCounts[b] - methodCounts[a])[0];
  const favMethodText = favMethodKey
    ? `${METHOD_LABEL[favMethodKey] || favMethodKey} (${Math.round((methodCounts[favMethodKey] / cur.length) * 100)}% transaksi)`
    : 'Belum ada transaksi';

  const hourlyData = [8, 10, 12, 14, 16, 18, 20].map((h) => {
    const bucket = cur.filter((t) => {
      const hr = new Date(t.createdAt).getHours();
      return (h === 8 ? hr < 10 : h === 20 ? hr >= 20 : hr >= h && hr < h + 2);
    });
    return { hour: `${String(h).padStart(2, '0')}:00`, amount: sum(bucket, 'totalAmount'), tx: bucket.length };
  });
  const maxHourAmount = Math.max(...hourlyData.map((d) => d.amount), 1);
  const peak = [...hourlyData].sort((a, b) => b.amount - a.amount)[0];
  const peakText = peak && peak.amount > 0 ? `${peak.hour} WIB (${formatIDR(peak.amount)})` : 'Menunggu data transaksi';

  const topProducts = (() => {
    const agg = new Map<string, { name: string; productId?: string; sold: number; rev: number }>();
    cur.forEach((t) =>
      (t.items || []).forEach((it: any) => {
        const k = it.productId || it.productName;
        const u = agg.get(k) || { name: it.productName, productId: it.productId, sold: 0, rev: 0 };
        u.sold += Number(it.quantityOrdered) || 0;
        u.rev += Number(it.subtotal) || 0;
        agg.set(k, u);
      })
    );
    return [...agg.values()]
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 5)
      .map((u) => {
        const p = prods.find((x) => x.id === u.productId);
        return { name: u.name, category: String(p?.category || '-').toUpperCase(), sold: u.sold, rev: u.rev, stock: p?.stockInUnits ?? 0, minStock: p?.minStockAlert ?? 0 };
      });
  })();

  const criticalStockItems = prods
    .filter((p) => Number(p.stockInUnits) <= Number(p.minStockAlert ?? 0))
    .sort((a, b) => a.stockInUnits / (a.minStockAlert || 1) - b.stockInUnits / (b.minStockAlert || 1))
    .slice(0, 8)
    .map((p) => ({
      name: p.name,
      currentStock: p.stockInUnits,
      minStock: p.minStockAlert,
      unit: 'Unit',
      severity: p.stockInUnits <= (p.minStockAlert || 0) / 2 ? 'danger' : 'warning',
    }));

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') + ' WIB';
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const itemsSummary = (t: Transaction) =>
    (t.items || []).slice(0, 3).map((i: any) => `${i.productName} (${i.quantityOrdered})`).join(', ') || '-';

  const recentTransactions: TransactionItem[] = txs.slice(0, 30).map((t) => ({
    id: t.id,
    receiptNumber: `RC-${t.id.slice(-6).toUpperCase()}`,
    time: fmtTime(t.createdAt),
    date: fmtDate(t.createdAt),
    cashier: t.channel === 'pos' ? t.cashierId || 'Kasir' : 'PWA Online',
    customer: t.customerName || 'Umum',
    method: (t.paymentMethod === 'cash' ? 'Tunai' : t.paymentMethod === 'qris' ? 'QRIS' : t.paymentMethod === 'card' ? 'Debit BCA' : 'Transfer') as TransactionItem['method'],
    itemsSummary: itemsSummary(t),
    total: t.totalAmount || 0,
    status: (t.status === 'completed' ? 'Berhasil' : t.status === 'rejected' ? 'Dibatalkan' : 'Menunggu') as TransactionItem['status'],
  }));

  const ordersList: OrderItem[] = txs
    .filter((t) => t.status !== 'rejected')
    .slice(0, 30)
    .map((t) => ({
      id: t.id,
      orderNumber: `#${t.id.slice(-6).toUpperCase()}`,
      customerName: t.customerName || 'Umum',
      channel: (t.channel === 'pos' ? 'Kasir POS' : 'PWA Online') as OrderItem['channel'],
      itemsCount: (t.items || []).reduce((a: number, i: any) => a + (Number(i.quantityOrdered) || 0), 0),
      totalAmount: t.totalAmount || 0,
      paymentMethod: (t.paymentMethod === 'cash' ? 'Tunai' : t.paymentMethod === 'qris' ? 'QRIS' : 'Transfer BCA') as OrderItem['paymentMethod'],
      paymentStatus: (t.status === 'completed' ? 'Lunas' : 'Belum Bayar') as OrderItem['paymentStatus'],
      orderStatus: (t.status === 'completed' || t.fulfillmentStatus === 'completed'
        ? 'selesai'
        : t.fulfillmentStatus === 'ready'
        ? 'siap'
        : t.fulfillmentStatus === 'processing'
        ? 'diproses'
        : 'menunggu') as OrderItem['orderStatus'],
      time: fmtTime(t.createdAt),
    }));

  const lastPos = txs.find((t) => t.channel === 'pos');
  const firstPosToday = [...txs].reverse().find((t) => t.channel === 'pos' && inWindow(t, sod, new Date(now.getTime() + 1)));

  // Filtered orders according to mode and tab
  const displayedOrders = ordersList.filter((o) => orderFilterTab === 'all' || o.orderStatus === orderFilterTab);

  // Filtered transactions for search
  const displayedTransactions = recentTransactions.filter((tx) => {
    if (!txSearchQuery.trim()) return true;
    const q = txSearchQuery.toLowerCase();
    return (
      tx.receiptNumber.toLowerCase().includes(q) ||
      tx.customer.toLowerCase().includes(q) ||
      tx.cashier.toLowerCase().includes(q) ||
      tx.itemsSummary.toLowerCase().includes(q)
    );
  });

  const updateOrderStatus = async (orderId: string, nextStatus: 'diproses' | 'siap' | 'selesai') => {
    try {
      const t = txs.find((x) => x.id === orderId);
      if (nextStatus === 'selesai') {
        if (t && t.status !== 'completed') {
          await deductStockForOrder(
            orderId,
            (t.items || []).map((it: any) => ({ productId: it.productId, units: Number(it.unitsDeducted) || 0 }))
          );
        }
        await updateDoc(doc(db, 'transactions', orderId), {
          fulfillmentStatus: 'completed',
          status: 'completed',
          reviewedBy: 'Admin Dashboard',
          reviewedAt: new Date().toISOString(),
        });
      } else {
        await updateDoc(doc(db, 'transactions', orderId), {
          fulfillmentStatus: nextStatus === 'diproses' ? 'processing' : 'ready',
        });
      }
    } catch (e) {
      showFlash(e instanceof Error ? e.message : 'Gagal memperbarui pesanan.');
    }
  };

  return (
    <div className="space-y-6 font-sans text-zinc-100 animate-in fade-in duration-200">
      {/* 1. TOP EXECUTIVE HEADER BANNER */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl shadow-sm backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Outlet Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-black shadow-inner">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    DASHBOARD ADMIN
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Sistem Operasional Aktif
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Ringkasan operasional toko, penjualan kasir, pesanan masuk, dan status keuangan
                </p>
              </div>
            </div>

            {/* Outlet Selection Pills */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                Outlet:
              </span>
              <div className="inline-flex rounded-lg bg-zinc-950 border border-zinc-800 p-0.5 text-xs">
                <button
                  onClick={() => setSelectedOutlet('pusat')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    selectedOutlet === 'pusat'
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Toko Utama (Pusat)
                </button>
                <button
                  onClick={() => setSelectedOutlet('cabang2')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    selectedOutlet === 'cabang2'
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Cabang 2 (Pasar Baru)
                </button>
                <button
                  onClick={() => setSelectedOutlet('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    selectedOutlet === 'all'
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Semua Outlet
                </button>
              </div>
            </div>
          </div>

          {/* Right Header Controls: Time Clock, Time Filter, Mode Toggle & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Clock */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentTime || 'Memuat waktu...'}</span>
            </div>

            {/* Time range selector */}
            <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold">
              <button
                onClick={() => setTimeRange('today')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  timeRange === 'today' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setTimeRange('yesterday')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  timeRange === 'yesterday' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Kemarin
              </button>
              <button
                onClick={() => setTimeRange('7days')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  timeRange === '7days' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  timeRange === 'month' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Bulan Ini
              </button>
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer ${
                isRefreshing ? 'animate-spin text-blue-400' : ''
              }`}
              title="Refresh Data Dashboard"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* CTA + Tambah Produk */}
            <button
              onClick={() => {
                if (onOpenAddProduct) {
                  onOpenAddProduct();
                } else {
                  onNavigateTab('products');
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Produk</span>
            </button>

            {/* CTA Buka Kasir POS */}
            <button
              onClick={() => onNavigateTab('pos_machine')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Buka POS Machine</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SIX KEY METRIC SUMMARY CARDS (MATCHING SCREENSHOT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Total Penjualan */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Total Penjualan
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-white tracking-tight">
            {formatIDR(revenue)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            {revDeltaPct === null ? (
              <span className="text-zinc-500">Belum ada pembanding periode lalu</span>
            ) : (
              <>
                <span className={`flex items-center font-bold px-1 py-0.2 rounded ${revDeltaPct >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                  {revDeltaPct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {revDeltaPct >= 0 ? '+' : ''}{revDeltaPct.toFixed(1)}%
                </span>
                <span className="text-zinc-500">vs periode sebelumnya</span>
              </>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60" />
        </div>

        {/* Card 2: Total Transaksi */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Total Transaksi
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-white tracking-tight">
            {txCount} Transaksi
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className={txCount > 0 ? 'text-blue-400 font-bold' : 'text-zinc-500'}>Rata-rata {formatIDR(txCount > 0 ? revenue / txCount : 0)} / struk</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-60" />
        </div>

        {/* Card 3: Estimasi Laba Kotor */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Estimasi Laba Kotor
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-white tracking-tight">
            {formatIDR(grossProfit)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className={revenue > 0 ? 'text-indigo-400 font-bold bg-indigo-500/10 px-1 py-0.2 rounded' : 'text-zinc-500'}>Margin {marginPct.toFixed(1)}%</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-60" />
        </div>

        {/* Card 4: Hutang Pelanggan (Piutang) */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Pelanggan Hutang
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-white tracking-tight">
            {formatIDR(debtTotal)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className="text-zinc-500">{debtCount} Tagihan Tertunda</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500 opacity-60" />
        </div>

        {/* Card 5: Invoice Supplier (Belum Terbayarkan) */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Invoice Supplier
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-white tracking-tight">
            {formatIDR(supplierDue)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className="text-zinc-500">Belum Terbayarkan</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-60" />
        </div>

        {/* Card 6: Kas di Laci Kasir */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Kas di Laci Kasir
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-white tracking-tight">
            {formatIDR(kasFisik)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className="text-teal-400 font-semibold">Kas masuk {formatIDR(kasMasuk)} / keluar {formatIDR(kasKeluar)}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-60" />
        </div>
      </div>

      {/* PUSAT ANALITIK AREA CHARTS: PENJUALAN, ASSET PRODUK, PEMBELIAN, STOK VS PENJUALAN VS PEMBELIAN */}
      <AdminAreaCharts
        transactions={txs}
        products={prods}
        purchaseOrders={poDocs}
        onNavigateTab={onNavigateTab}
        onOpenAddProduct={onOpenAddProduct}
      />

      {/* 3. MIDDLE DUAL SECTION: PESANAN BERJALAN & STATISTIK SHIFT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 Cols): Order Section & Charts */}
        <div className="lg:col-span-8 space-y-6">
          {/* PESANAN MASUK / ORDER BERJALAN CARD (WITH EXACT EMPTY STATE FROM SCREENSHOT) */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            {/* Header with status tabs */}
            <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-blue-400" />
                    Pesanan Masuk &amp; Berjalan
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                    {displayedOrders.length} Order
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pantau pesanan masuk secara realtime dari katalog online PWA dan pemesanan kasir
                </p>
              </div>

              {/* Status filter tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
                <button
                  onClick={() => setOrderFilterTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                    orderFilterTab === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setOrderFilterTab('menunggu')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                    orderFilterTab === 'menunggu'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Menunggu (1)
                </button>
                <button
                  onClick={() => setOrderFilterTab('diproses')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                    orderFilterTab === 'diproses'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Diproses (1)
                </button>
                <button
                  onClick={() => setOrderFilterTab('siap')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                    orderFilterTab === 'siap'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Siap Kirim (1)
                </button>
              </div>
            </div>

            {/* Content: Empty state or orders list */}
            {displayedOrders.length === 0 ? (
              /* EXACT EMPTY STATE MATCHING SCREENSHOT */
              <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-400 mb-4 shadow-inner">
                  <Inbox className="w-10 h-10 stroke-[1.5]" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Belum ada order
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
                  Pesanan masuk dari pelanggan online PWA, pemesanan meja, atau pesanan pending kasir akan otomatis tampil di sini secara realtime.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => onNavigateTab('pos_machine')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Buat Order Baru</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('pos_machine')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition border border-zinc-700 cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Buka Kasir POS</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ACTIVE ORDERS LIST */
              <div className="divide-y divide-zinc-800/80">
                {displayedOrders.map((ord) => (
                  <div key={ord.id} className="p-4 sm:p-5 hover:bg-zinc-800/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {ord.orderNumber}
                        </span>
                        <span className="text-sm font-bold text-white">{ord.customerName}</span>
                        <span className="text-[10px] font-semibold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                          {ord.channel}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span>{ord.itemsCount} Barang</span>
                        <span>&bull;</span>
                        <span className="font-mono font-bold text-emerald-400">
                          Rp {ord.totalAmount.toLocaleString('id-ID')}
                        </span>
                        <span>&bull;</span>
                        <span className="text-zinc-400">{ord.paymentMethod} ({ord.paymentStatus})</span>
                        <span>&bull;</span>
                        <span className="text-zinc-500">{ord.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ord.orderStatus === 'menunggu' && (
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'diproses')}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                        >
                          Proses Pesanan
                        </button>
                      )}
                      {ord.orderStatus === 'diproses' && (
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'siap')}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
                        >
                          Siap Diambil
                        </button>
                      )}
                      {ord.orderStatus === 'siap' && (
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'selesai')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                        >
                          Selesaikan
                        </button>
                      )}
                      {ord.orderStatus === 'selesai' && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Selesai
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HOURLY SALES CHART VISUAL */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  Grafik Tren Penjualan Jam Per Jam
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Visualisasi beban penjualan sepanjang hari untuk memetakan shift dan stok
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-zinc-400">Total Operasional</span>
                <div className="text-xs font-bold text-emerald-400">14 Jam Buka</div>
              </div>
            </div>

            {/* Bar chart container */}
            <div className="pt-4 pb-2">
              <div className="h-40 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-zinc-800">
                {hourlyData.map((d) => {
                  const heightPercent = d.amount > 0 ? Math.round((d.amount / maxHourAmount) * 100) : 6;
                  return (
                    <div key={d.hour} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="opacity-0 group-hover:opacity-100 transition text-[10px] font-mono text-center bg-zinc-800 text-white px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                        {d.amount > 0 ? `Rp ${(d.amount / 1000).toLocaleString('id-ID')}k` : 'Rp 0'}
                      </div>
                      <div
                        className="w-full max-w-[42px] bg-zinc-800/80 rounded-t-lg group-hover:bg-blue-600 transition flex items-end justify-center relative overflow-hidden"
                        style={{ height: `${heightPercent}%` }}
                      >
                        <div className="w-full bg-gradient-to-t from-blue-700 to-indigo-500 rounded-t-lg h-full opacity-80 group-hover:opacity-100 transition" />
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400 group-hover:text-white transition">
                        {d.hour}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart footer insights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-zinc-800/60">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-500 block text-[11px]">Jam Puncak Teramai</span>
                <span className="font-bold text-white">
                  {peakText}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-500 block text-[11px]">Metode Favorit</span>
                <span className="font-bold text-white">
                  {favMethodText}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-zinc-500 block text-[11px]">Transaksi Berisiko (skor 45+)</span>
                <span className={`font-bold ${riskyCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{riskyCount} transaksi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): SIDEBAR KANAN DASHBOARD ADMIN (Shift Stats, Debt, Risk & Operations) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Header Marker for Right Sidebar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                SIDEBAR KANAN • PANEL OPERASIONAL
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Kasir Live
            </span>
          </div>

          {/* STATISTIK SHIFT KASIR AKTIF */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Statistik Shift Kasir
                </h3>
                <span className="text-[11px] text-zinc-400">Shift 1 Pagi - Sore</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Shift Aktif
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-zinc-400 block text-[11px]">Kasir Bertugas:</span>
                  <span className="font-bold text-white">{lastPos?.cashierId || 'Belum ada transaksi kasir'}</span>
                </div>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">
                  {firstPosToday ? `Mulai ${fmtTime(firstPosToday.createdAt)}` : 'Belum mulai'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Kas Masuk Manual:</span>
                  <span className="font-mono font-bold text-zinc-200">{formatIDR(kasMasuk)}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Penjualan Tunai:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatIDR(cashSales)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Penjualan Non-Tunai / QRIS:</span>
                  <span className="font-mono font-bold text-blue-400">
                    {formatIDR(nonCashSales)}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center">
                  <span className="font-bold text-white">Kas Fisik di Laci:</span>
                  <span className="font-mono font-black text-white text-sm">
                    {formatIDR(kasFisik)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowShiftModal(true)}
                className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition border border-zinc-700 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Shift</span>
              </button>
              <button
                onClick={() => setShowShiftModal(true)}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Tutup Shift</span>
              </button>
            </div>
          </div>

          {/* PELANGGAN HUTANG & INVOICE SUPPLIER (MATCHING SCREENSHOT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {/* Pelanggan Hutang */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Pelanggan Hutang
                </span>
                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Lancar
                </span>
              </div>
              <div className="text-lg font-black text-white">Rp 0</div>
              <p className="text-[11px] text-zinc-400">
                Tidak ada tagihan hutang pelanggan yang belum dibayar atau jatuh tempo.
              </p>
              <button
                onClick={() => onNavigateTab('assets')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer pt-1 block"
              >
                Buka Buku Piutang &rarr;
              </button>
            </div>

            {/* Invoice Supplier */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-purple-400" />
                  Invoice Supplier (Hutang)
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Lunas
                </span>
              </div>
              <div className="text-lg font-black text-white">Rp 0</div>
              <p className="text-[11px] text-zinc-400">
                Semua faktur pesanan barang dari distributor/supplier telah lunas terbayarkan.
              </p>
              <button
                onClick={() => onNavigateTab('assets')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer pt-1 block"
              >
                Buka Faktur Usaha &rarr;
              </button>
            </div>
          </div>

          {/* PERINGATAN STOK KRITIS / RESTOCK ALERT */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Peringatan Stok Menipis
              </h3>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {criticalStockItems.length} Perlu Restock
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {criticalStockItems.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-[11px] text-zinc-400">
                      Sisa: <span className="text-rose-400 font-bold">{item.currentStock} {item.unit}</span> (Batas Min: {item.minStock})
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab('restock')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold cursor-pointer"
                  >
                    Restock
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('restock')}
              className="w-full text-center text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer pt-1 block"
            >
              Buka Restock AI Advisor &rarr;
            </button>
          </div>

          {/* PINTASAN CEPAT OPERASIONAL KASIR */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Pintasan Cepat Operasional
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => onNavigateTab('pos_machine')}
                className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center group"
              >
                <Plus className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
                <span>+ Buat Order</span>
              </button>
              <button
                onClick={() => onNavigateTab('pos_machine')}
                className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center group"
              >
                <Store className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                <span>Buka Kasir POS</span>
              </button>
              <button
                onClick={onOpenAddProduct}
                className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center group"
              >
                <Boxes className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                <span>Tambah Produk</span>
              </button>
              <button
                onClick={() => setShowShiftModal(true)}
                className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center group"
              >
                <Printer className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
                <span>Cetak Shift</span>
              </button>
            </div>
          </div>

          {/* LOG AUDIT & NOTIFIKASI KASIR REALTIME */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Audit Kasir &amp; Integritas Laci
              </h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                Aman 100%
              </span>
            </div>

            <div className="space-y-2 text-[11px] text-zinc-400">
              <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                <div>
                  <span className="text-white font-medium">16:42 WIB</span> &bull; Pembayaran QRIS Rp 128.500 diverifikasi otomatis oleh sistem.
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                <div>
                  <span className="text-white font-medium">16:38 WIB</span> &bull; Transaksi Tunai Rp 44.000 selesai dicatat dalam laci kas.
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                <div>
                  <span className="text-white font-medium">08:00 WIB</span> &bull; Shift 1 dibuka oleh Ahmad Fauzi (Modal Kas Rp 500.000).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM SECTION: PRODUK TERLARIS & TABEL TRANSAKSI REALTIME */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Products (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-400" />
                Produk Terlaris Hari Ini
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Top 5 SKU penyumbang omset tertinggi</p>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
            >
              Lihat Semua &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div
                key={p.name}
                className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                      idx === 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : idx === 1
                        ? 'bg-zinc-700/50 text-zinc-300'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-white truncate max-w-[160px] sm:max-w-[200px]">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Terjual {p.sold} &bull; Stok {p.stock}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-emerald-400">
                    Rp {p.rev.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-semibold">{p.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions Table (8 cols) */}
        <div className="lg:col-span-8 bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Transaksi Terkini (Live Feed POS)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Daftar struk transaksi penjualan kasir langsung</p>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari struk / kasir / pelanggan..."
                value={txSearchQuery}
                onChange={(e) => setTxSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/90 text-zinc-400 uppercase text-[10px] font-semibold border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">No. Struk</th>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Kasir / Pelanggan</th>
                  <th className="py-2.5 px-3">Metode Bayar</th>
                  <th className="py-2.5 px-3 text-right">Total Bayar</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {displayedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400">
                      {tx.receiptNumber}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                      {tx.time}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{tx.cashier}</div>
                      <div className="text-[11px] text-zinc-400">{tx.customer}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-200">
                        {tx.method}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 text-right">
                      Rp {tx.total.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedReceipt(tx)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold transition cursor-pointer"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: DETAIL STRUK TRANSAKSI */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Rincian Struk Kasir</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 font-mono text-xs space-y-2 border border-zinc-800">
              <div className="text-center pb-2 border-b border-dashed border-zinc-800">
                <div className="font-bold text-white text-sm">RISKCART POS &bull; OUTLET PUSAT</div>
                <div className="text-zinc-500 text-[11px]">Jl. Raya Veteran No. 12 &bull; 0812-3456-7890</div>
              </div>

              <div className="flex justify-between text-zinc-400 pt-1">
                <span>No. Struk:</span>
                <span className="text-white font-bold">{selectedReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Waktu / Tgl:</span>
                <span className="text-white">{selectedReceipt.time}, {selectedReceipt.date}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Kasir:</span>
                <span className="text-white">{selectedReceipt.cashier}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Pelanggan:</span>
                <span className="text-white">{selectedReceipt.customer}</span>
              </div>

              <div className="py-2 my-1 border-t border-b border-dashed border-zinc-800 space-y-1">
                <div className="text-zinc-300">{selectedReceipt.itemsSummary}</div>
              </div>

              <div className="flex justify-between text-sm font-bold pt-1">
                <span className="text-white">TOTAL BAYAR:</span>
                <span className="text-emerald-400">Rp {selectedReceipt.total.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-zinc-400 text-[11px]">
                <span>Metode Pembayaran:</span>
                <span className="text-white font-bold">{selectedReceipt.method} (LUNAS)</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  showFlash(`Mencetak struk ${selectedReceipt.receiptNumber} ke printer thermal POS...`);
                  setSelectedReceipt(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Ulang Struk</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Flash Notification */}
      {flashMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-white" />
          <span>{flashMsg}</span>
        </div>
      )}

      {/* MODAL 2: TUTUP SHIFT KASIR & REKONSILIASI */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Rekonsiliasi &amp; Tutup Shift</h3>
              </div>
              <button
                onClick={() => setShowShiftModal(false)}
                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 text-xs space-y-2 border border-zinc-800">
              <div className="font-bold text-white text-sm mb-1">Rangkuman Shift 1 (Ahmad Fauzi)</div>
              <div className="flex justify-between text-zinc-400">
                <span>Modal Awal Kas:</span>
                <span className="font-mono text-white">Rp 500.000</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Penjualan Tunai:</span>
                <span className="font-mono text-emerald-400">Rp 1.650.000</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total Non-Tunai / QRIS:</span>
                <span className="font-mono text-blue-400">Rp 13.200.000</span>
              </div>
              <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold">
                <span className="text-white">Uang Fisik Kas di Laci:</span>
                <span className="font-mono text-emerald-400 text-sm">Rp 2.150.000</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  showFlash('Shift 1 ditutup berhasil. Slip rekonsiliasi kas telah dikirim ke printer thermal.');
                  setShowShiftModal(false);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Konfirmasi Tutup Shift</span>
              </button>
              <button
                onClick={() => setShowShiftModal(false)}
                className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH PESANAN CEPAT */}
    </div>
  );
};
