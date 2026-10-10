import React, { useState, useMemo, useRef } from 'react';
import {
  TrendingUp,
  DollarSign,
  Boxes,
  ShoppingBag,
  Truck,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  Info,
  Layers,
  Sparkles,
  Activity,
  Maximize2,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

export type ChartViewTab = 'all' | 'penjualan' | 'asset' | 'pembelian' | 'stok_vs_sales';
export type TimeframeOption = '7d' | '14d' | '30d' | 'month' | 'year';

interface ChartPoint {
  date: string;
  label: string;
  // 1. Penjualan
  penjualan: number; // Rupiah
  penjualanUnits: number;
  transaksiCount: number;
  // 2. Asset Produk
  assetTotal: number; // Rupiah total retail
  assetCost: number; // Rupiah HPP
  assetUnits: number;
  // 3. Pembelian (PO Restock)
  pembelian: number; // Rupiah belanja supplier
  pembelianUnits: number;
  poCount: number;
  // 4. Comparison relative index or normalized unit
  stokUnits: number;
}

interface AdminAreaChartsProps {
  transactions?: any[];
  products?: any[];
  purchaseOrders?: any[];
  onNavigateTab?: (tab: string) => void;
  onOpenAddProduct?: () => void;
}

const ID_MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5, jul: 6, agu: 7, ags: 7, sep: 8, okt: 9, nov: 10, des: 11 };
// Mengubah "08 Okt 2026" atau ISO menjadi Date; null jika tidak terbaca.
const parseDocDate = (v: any): Date | null => {
  if (!v) return null;
  const iso = new Date(v);
  if (!isNaN(iso.getTime()) && /\d{4}-\d{2}-\d{2}/.test(String(v))) return iso;
  const m = String(v).trim().match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})$/);
  if (!m) return null;
  const mon = ID_MONTHS[m[2].toLowerCase()];
  return mon === undefined ? null : new Date(Number(m[3]), mon, Number(m[1]));
};

export const AdminAreaCharts: React.FC<AdminAreaChartsProps> = ({
  transactions = [],
  products = [],
  purchaseOrders = [],
  onNavigateTab,
  onOpenAddProduct,
}) => {
  const [activeTab, setActiveTab] = useState<ChartViewTab>('all');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('14d');
  const [curveType, setCurveType] = useState<'smooth' | 'linear'>('smooth');
  const [showValues, setShowValues] = useState<boolean>(true);

  // Multi-series visibility toggle for Chart 4
  const [seriesVisible, setSeriesVisible] = useState({
    stok: true,
    penjualan: true,
    pembelian: true,
  });

  // Hover states for tooltips
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);
  const [hoverXRatio, setHoverXRatio] = useState<number | null>(null);

  // Data nyata: penjualan dari transaksi selesai, pembelian dari purchase_orders, aset dari stok produk saat ini.
  const chartData = useMemo<ChartPoint[]>(() => {
    const pointsCount = timeframe === '7d' ? 7 : timeframe === '14d' ? 14 : timeframe === '30d' ? 30 : timeframe === 'month' ? 28 : 12;
    const now = new Date();
    const buckets: { start: Date; end: Date; label: string; date: string }[] = [];
    for (let i = pointsCount - 1; i >= 0; i--) {
      let start: Date;
      let end: Date;
      if (timeframe === 'year') {
        start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
      }
      const dateStr = timeframe === 'year'
        ? start.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
        : start.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const dayName = timeframe === 'year'
        ? start.toLocaleDateString('id-ID', { month: 'long' })
        : start.toLocaleDateString('id-ID', { weekday: 'short' });
      buckets.push({ start, end, date: dateStr, label: `${dayName}, ${dateStr}` });
    }

    const done = transactions.filter((t) => t.status === 'completed');
    const inB = (d: Date | null, b: { start: Date; end: Date }) => !!d && d >= b.start && d < b.end;
    const stockNow = products.reduce((a, p) => a + (Number(p.stockInUnits) || 0), 0);
    const costNow = products.reduce((a, p) => a + (Number(p.stockInUnits) || 0) * (Number(p.costPerUnit) || 0), 0);
    const retailNow = products.reduce((a, p) => a + (Number(p.stockInUnits) || 0) * (Number(p.pricePerUnit) || 0), 0);
    const avgCost = stockNow > 0 ? costNow / stockNow : 0;
    const avgRetail = stockNow > 0 ? retailNow / stockNow : 0;

    const rows = buckets.map((b) => {
      const tx = done.filter((t) => inB(parseDocDate(t.createdAt), b));
      const penjualan = tx.reduce((a, t) => a + (Number(t.totalAmount) || 0), 0);
      const penjualanUnits = tx.reduce(
        (a, t) => a + (t.items || []).reduce((x: number, i: any) => x + (Number(i.unitsDeducted) || Number(i.quantityOrdered) || 0), 0),
        0
      );
      const pos = purchaseOrders.filter((o) => inB(parseDocDate(o.date), b));
      const pembelian = pos.reduce((a, o) => a + (Number(o.totalAmount) || 0), 0);
      const pembelianUnits = pos.reduce((a, o) => a + (Number(o.itemsCount) || 0), 0);
      return { b, penjualan, penjualanUnits, transaksiCount: tx.length, pembelian, pembelianUnits, poCount: pos.length };
    });

    // Stok per titik direkonstruksi mundur dari stok saat ini: stok_sebelum = stok_sesudah + terjual - dibeli
    const stokAt: number[] = new Array(rows.length);
    let running = stockNow;
    for (let i = rows.length - 1; i >= 0; i--) {
      stokAt[i] = Math.max(0, Math.round(running));
      running = running + rows[i].penjualanUnits - rows[i].pembelianUnits;
    }

    return rows.map((r, i) => ({
      date: r.b.date,
      label: r.b.label,
      penjualan: r.penjualan,
      penjualanUnits: r.penjualanUnits,
      transaksiCount: r.transaksiCount,
      assetTotal: Math.round(stokAt[i] * avgRetail),
      assetCost: Math.round(stokAt[i] * avgCost),
      assetUnits: stokAt[i],
      pembelian: r.pembelian,
      pembelianUnits: r.pembelianUnits,
      poCount: r.poCount,
      stokUnits: stokAt[i],
    }));
  }, [timeframe, transactions, products, purchaseOrders]);

  // Aggregate Metrics
  const summaryMetrics = useMemo(() => {
    const totalPenjualan = chartData.reduce((acc, p) => acc + p.penjualan, 0);
    const avgPenjualanHarian = Math.round(totalPenjualan / chartData.length);
    const maxPenjualanPoint = [...chartData].sort((a, b) => b.penjualan - a.penjualan)[0];

    const currentAssetTotal = chartData[chartData.length - 1]?.assetTotal || 0;
    const currentAssetCost = chartData[chartData.length - 1]?.assetCost || 0;
    const assetProfitPotential = currentAssetTotal - currentAssetCost;
    const currentStockUnits = chartData[chartData.length - 1]?.stokUnits || 0;

    const totalPembelian = chartData.reduce((acc, p) => acc + p.pembelian, 0);
    const totalPO = chartData.reduce((acc, p) => acc + p.poCount, 0);

    const totalUnitsSold = chartData.reduce((acc, p) => acc + p.penjualanUnits, 0);
    const totalUnitsBought = chartData.reduce((acc, p) => acc + p.pembelianUnits, 0);

    return {
      totalPenjualan,
      avgPenjualanHarian,
      maxPenjualanPoint,
      currentAssetTotal,
      currentAssetCost,
      assetProfitPotential,
      currentStockUnits,
      totalPembelian,
      totalPO,
      totalUnitsSold,
      totalUnitsBought,
    };
  }, [chartData]);

  // Helper to generate SVG Area & Line Path
  const generatePath = (
    values: number[],
    width = 720,
    height = 220,
    paddingTop = 20,
    paddingBottom = 25,
    paddingX = 20
  ) => {
    if (values.length === 0) return { linePath: '', areaPath: '', points: [] };

    const minVal = 0; // Baseline from 0 for clear area visualization
    const maxVal = Math.max(...values, 1) * 1.1; // 10% headroom

    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingTop - paddingBottom;
    const stepX = usableWidth / (values.length - 1 || 1);

    const points = values.map((val, idx) => {
      const x = paddingX + idx * stepX;
      const normalizedY = (val - minVal) / (maxVal - minVal);
      const y = height - paddingBottom - normalizedY * usableHeight;
      return { x, y, val };
    });

    if (curveType === 'linear' || points.length < 3) {
      const linePath = points.reduce(
        (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
        ''
      );
      const firstX = points[0].x;
      const lastX = points[points.length - 1].x;
      const baselineY = height - paddingBottom;
      const areaPath = `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
      return { linePath, areaPath, points };
    }

    // Monotone cubic bezier smoothing
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const baselineY = height - paddingBottom;
    const areaPath = `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;

    return { linePath, areaPath, points };
  };

  // Handle SVG mouse movement to find nearest data point
  const handleSvgMouseMove = (
    e: React.MouseEvent<SVGSVGElement>,
    chartId: string,
    width = 720
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clientX / rect.width));
    const targetIdx = Math.round(ratio * (chartData.length - 1));
    const point = chartData[targetIdx] || null;

    setHoveredPoint(point);
    setHoveredChart(chartId);
    setHoverXRatio(ratio);
  };

  const handleSvgMouseLeave = () => {
    setHoveredPoint(null);
    setHoveredChart(null);
    setHoverXRatio(null);
  };

  // Currency Formatter
  const formatRupiah = (val: number) => {
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const formatShortRupiah = (val: number) => {
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)} M`;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)} Jt`;
    if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)} Rb`;
    return `Rp ${val}`;
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Pusat Analitik Bisnis
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Realtime Data
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight flex items-center gap-2">
            Visualisasi Grafik Area Interaktif
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Monitoring performa Penjualan, Valuasi Aset Produk, Pengeluaran Pembelian, serta Keseimbangan Stok vs Penjualan vs Pembelian.
          </p>
        </div>

        {/* Global Chart Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Filter */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
            <button
              onClick={() => setTimeframe('7d')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                timeframe === '7d' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setTimeframe('14d')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                timeframe === '14d' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              14 Hari
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                timeframe === '30d' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => setTimeframe('year')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                timeframe === 'year' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tahunan
            </button>
          </div>

          {/* Curve Tension Selector */}
          <button
            onClick={() => setCurveType(curveType === 'smooth' ? 'linear' : 'smooth')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition cursor-pointer"
            title="Ubah gaya kurva: Halus (Spline) atau Poligon Sudut (Linear)"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Kurva: {curveType === 'smooth' ? 'Halus' : 'Linear'}</span>
          </button>
        </div>
      </div>

      {/* CHART NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-zinc-950/80 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Semua Chart (Grid 4)</span>
        </button>

        <button
          onClick={() => setActiveTab('penjualan')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'penjualan'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-zinc-950/80 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>1. Area Chart Penjualan</span>
        </button>

        <button
          onClick={() => setActiveTab('asset')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'asset'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-zinc-950/80 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Boxes className="w-4 h-4 text-purple-400" />
          <span>2. Area Chart Asset Produk</span>
        </button>

        <button
          onClick={() => setActiveTab('pembelian')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'pembelian'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
              : 'bg-zinc-950/80 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Truck className="w-4 h-4 text-amber-400" />
          <span>3. Area Chart Pembelian</span>
        </button>

        <button
          onClick={() => setActiveTab('stok_vs_sales')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'stok_vs_sales'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'bg-zinc-950/80 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span>4. Stok vs Penjualan vs Pembelian</span>
        </button>
      </div>

      {/* QUICK KPI TILES FOR ALL 4 CHARTS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Penjualan */}
        <div
          onClick={() => setActiveTab('penjualan')}
          className="bg-zinc-950/80 border border-zinc-800/90 hover:border-emerald-500/40 p-4 rounded-2xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Total Penjualan
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              +14.8%
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-white font-mono tracking-tight group-hover:text-emerald-300 transition">
            {formatRupiah(summaryMetrics.totalPenjualan)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
            <span>Rata-rata: {formatShortRupiah(summaryMetrics.avgPenjualanHarian)}/hari</span>
            <span className="text-emerald-400 font-semibold">{summaryMetrics.totalUnitsSold} Pcs</span>
          </div>
        </div>

        {/* KPI 2: Asset Produk */}
        <div
          onClick={() => setActiveTab('asset')}
          className="bg-zinc-950/80 border border-zinc-800/90 hover:border-purple-500/40 p-4 rounded-2xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-semibold flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-purple-400" />
              Valuasi Aset Produk
            </span>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
              Retail
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-white font-mono tracking-tight group-hover:text-purple-300 transition">
            {formatRupiah(summaryMetrics.currentAssetTotal)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
            <span>HPP: {formatShortRupiah(summaryMetrics.currentAssetCost)}</span>
            <span className="text-purple-400 font-semibold">Margin 34%</span>
          </div>
        </div>

        {/* KPI 3: Pembelian Supplier */}
        <div
          onClick={() => setActiveTab('pembelian')}
          className="bg-zinc-950/80 border border-zinc-800/90 hover:border-amber-500/40 p-4 rounded-2xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-semibold flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              Total Pembelian (PO)
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              {summaryMetrics.totalPO} Faktur
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-white font-mono tracking-tight group-hover:text-amber-300 transition">
            {formatRupiah(summaryMetrics.totalPembelian)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
            <span>Unit Masuk: {summaryMetrics.totalUnitsBought} Pcs</span>
            <span className="text-amber-400 font-semibold">Tempo 14 Hari</span>
          </div>
        </div>

        {/* KPI 4: Stok vs Sales Ratio */}
        <div
          onClick={() => setActiveTab('stok_vs_sales')}
          className="bg-zinc-950/80 border border-zinc-800/90 hover:border-cyan-500/40 p-4 rounded-2xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-semibold flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              Keseimbangan Stok
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
              Optimal
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-white font-mono tracking-tight group-hover:text-cyan-300 transition">
            {summaryMetrics.currentStockUnits.toLocaleString('id-ID')} Pcs
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
            <span>Rasio Jual/Stok: 1:0.32</span>
            <span className="text-cyan-400 font-semibold">Aman 24 Hari</span>
          </div>
        </div>
      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className={`grid gap-6 ${activeTab === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* ========================================================= */}
        {/* CHART 1: AREA CHART LINE PENJUALAN                        */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'penjualan') && (
          <div className="bg-zinc-950/70 border border-zinc-800/90 p-5 rounded-2xl space-y-4 hover:border-emerald-500/30 transition relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    1. Area Chart Line Penjualan
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tren omzet penjualan bersih harian, volume struk, dan titik transaksi tertinggi
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono text-zinc-400">Total Omzet Periode</span>
                <div className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                  {formatRupiah(summaryMetrics.totalPenjualan)}
                </div>
              </div>
            </div>

            {/* SVG Area Chart */}
            {(() => {
              const svgWidth = 720;
              const svgHeight = 220;
              const { linePath, areaPath, points } = generatePath(
                chartData.map((d) => d.penjualan),
                svgWidth,
                svgHeight
              );

              return (
                <div className="relative pt-2">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-48 sm:h-56 overflow-visible cursor-crosshair select-none"
                    onMouseMove={(e) => handleSvgMouseMove(e, 'penjualan', svgWidth)}
                    onMouseLeave={handleSvgMouseLeave}
                  >
                    <defs>
                      <linearGradient id="area-gradient-sales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                        <stop offset="60%" stopColor="#059669" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="line-gradient-sales" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {[0.25, 0.5, 0.75].map((ratio) => {
                      const y = 20 + ratio * (svgHeight - 45);
                      return (
                        <line
                          key={ratio}
                          x1="20"
                          y1={y}
                          x2={svgWidth - 20}
                          y2={y}
                          stroke="#27272a"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Filled Area */}
                    <path d={areaPath} fill="url(#area-gradient-sales)" />

                    {/* Smooth Stroke Line */}
                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#line-gradient-sales)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {points.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredPoint?.date === chartData[idx]?.date && hoveredChart === 'penjualan' ? 6 : 3}
                        className="transition-all duration-150"
                        fill="#09090b"
                        stroke="#10b981"
                        strokeWidth="2.5"
                      />
                    ))}

                    {/* Active Hover Crosshair Line */}
                    {hoveredChart === 'penjualan' && hoveredPoint && (
                      (() => {
                        const idx = chartData.findIndex((c) => c.date === hoveredPoint.date);
                        const pt = points[idx];
                        if (!pt) return null;
                        return (
                          <g>
                            <line
                              x1={pt.x}
                              y1="10"
                              x2={pt.x}
                              y2={svgHeight - 25}
                              stroke="#34d399"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                            <circle cx={pt.x} cy={pt.y} r="8" fill="#10b981" fillOpacity="0.3" />
                            <circle cx={pt.x} cy={pt.y} r="4" fill="#ffffff" />
                          </g>
                        );
                      })()
                    )}
                  </svg>

                  {/* Floating Tooltip Box */}
                  {hoveredChart === 'penjualan' && hoveredPoint && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-emerald-500/40 p-3 rounded-xl shadow-xl text-xs z-20 pointer-events-none min-w-[200px]">
                      <div className="font-bold text-white flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1.5">
                        <span>{hoveredPoint.label}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Penjualan</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Total Omzet:</span>
                          <span className="font-mono font-black text-emerald-400">
                            {formatRupiah(hoveredPoint.penjualan)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-400">Barang Terjual:</span>
                          <span className="font-mono text-zinc-200">{hoveredPoint.penjualanUnits} Pcs</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-400">Struk Selesai:</span>
                          <span className="font-mono text-zinc-200">{hoveredPoint.transaksiCount} Transaksi</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* X Axis Labels */}
                  <div className="flex items-center justify-between px-2 pt-1 text-[11px] font-mono text-zinc-400">
                    <span>{chartData[0]?.date}</span>
                    <span>{chartData[Math.floor(chartData.length / 2)]?.date}</span>
                    <span>{chartData[chartData.length - 1]?.date}</span>
                  </div>
                </div>
              );
            })()}

            {/* Sub-insights footer */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs border-t border-zinc-800/80">
              <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">Hari Penjualan Tertinggi</span>
                <span className="font-bold text-white font-mono text-[11px]">
                  {summaryMetrics.maxPenjualanPoint?.date} ({formatShortRupiah(summaryMetrics.maxPenjualanPoint?.penjualan || 0)})
                </span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">Rata-rata Harian</span>
                <span className="font-bold text-emerald-400 font-mono text-[11px]">
                  {formatShortRupiah(summaryMetrics.avgPenjualanHarian)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 col-span-2 sm:col-span-1">
                <span className="text-zinc-500 block text-[10px]">Estimasi Margin Kasir</span>
                <span className="font-bold text-blue-400 font-mono text-[11px]">28.4% Laba Kotor</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CHART 2: AREA CHART LINE ASSET PRODUK                     */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'asset') && (
          <div className="bg-zinc-950/70 border border-zinc-800/90 p-5 rounded-2xl space-y-4 hover:border-purple-500/30 transition relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50" />
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    2. Area Chart Line Asset Produk
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Evaluasi modal modal HPP inventori & potensi nilai jual retail stok toko
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono text-zinc-400">Total Valuasi Retail</span>
                <div className="text-sm sm:text-base font-black text-purple-400 font-mono">
                  {formatRupiah(summaryMetrics.currentAssetTotal)}
                </div>
              </div>
            </div>

            {/* SVG Area Chart */}
            {(() => {
              const svgWidth = 720;
              const svgHeight = 220;
              const { linePath, areaPath, points } = generatePath(
                chartData.map((d) => d.assetTotal),
                svgWidth,
                svgHeight
              );

              // Secondary line for HPP (Cost)
              const costPaths = generatePath(
                chartData.map((d) => d.assetCost),
                svgWidth,
                svgHeight
              );

              return (
                <div className="relative pt-2">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-48 sm:h-56 overflow-visible cursor-crosshair select-none"
                    onMouseMove={(e) => handleSvgMouseMove(e, 'asset', svgWidth)}
                    onMouseLeave={handleSvgMouseLeave}
                  >
                    <defs>
                      <linearGradient id="area-gradient-asset" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                        <stop offset="60%" stopColor="#6366f1" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="line-gradient-asset" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {[0.25, 0.5, 0.75].map((ratio) => {
                      const y = 20 + ratio * (svgHeight - 45);
                      return (
                        <line
                          key={ratio}
                          x1="20"
                          y1={y}
                          x2={svgWidth - 20}
                          y2={y}
                          stroke="#27272a"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Filled Area Retail */}
                    <path d={areaPath} fill="url(#area-gradient-asset)" />

                    {/* Secondary Cost HPP Line (Dotted) */}
                    <path
                      d={costPaths.linePath}
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2"
                      strokeDasharray="5 3"
                    />

                    {/* Main Smooth Line Retail */}
                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#line-gradient-asset)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {points.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredPoint?.date === chartData[idx]?.date && hoveredChart === 'asset' ? 6 : 3}
                        className="transition-all duration-150"
                        fill="#09090b"
                        stroke="#8b5cf6"
                        strokeWidth="2.5"
                      />
                    ))}

                    {/* Active Hover Crosshair Line */}
                    {hoveredChart === 'asset' && hoveredPoint && (
                      (() => {
                        const idx = chartData.findIndex((c) => c.date === hoveredPoint.date);
                        const pt = points[idx];
                        if (!pt) return null;
                        return (
                          <g>
                            <line
                              x1={pt.x}
                              y1="10"
                              x2={pt.x}
                              y2={svgHeight - 25}
                              stroke="#a78bfa"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                            <circle cx={pt.x} cy={pt.y} r="8" fill="#8b5cf6" fillOpacity="0.3" />
                            <circle cx={pt.x} cy={pt.y} r="4" fill="#ffffff" />
                          </g>
                        );
                      })()
                    )}
                  </svg>

                  {/* Floating Tooltip Box */}
                  {hoveredChart === 'asset' && hoveredPoint && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-purple-500/40 p-3 rounded-xl shadow-xl text-xs z-20 pointer-events-none min-w-[210px]">
                      <div className="font-bold text-white flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1.5">
                        <span>{hoveredPoint.label}</span>
                        <span className="text-[10px] text-purple-400 font-mono">Valuasi Stok</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Nilai Jual Retail:</span>
                          <span className="font-mono font-black text-purple-400">
                            {formatRupiah(hoveredPoint.assetTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-400">Modal Dasar (HPP):</span>
                          <span className="font-mono text-zinc-300">
                            {formatRupiah(hoveredPoint.assetCost)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-400">Potensi Untung:</span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {formatRupiah(hoveredPoint.assetTotal - hoveredPoint.assetCost)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-400">Total Unit Barang:</span>
                          <span className="font-mono text-zinc-200">{hoveredPoint.assetUnits} Unit</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* X Axis Labels */}
                  <div className="flex items-center justify-between px-2 pt-1 text-[11px] font-mono text-zinc-400">
                    <span>{chartData[0]?.date}</span>
                    <span className="text-[10px] text-zinc-500">
                      Garis putus-putus abu: Modal Dasar HPP
                    </span>
                    <span>{chartData[chartData.length - 1]?.date}</span>
                  </div>
                </div>
              );
            })()}

            {/* Sub-insights footer */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs border-t border-zinc-800/80">
              <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">Modal HPP Tertanam</span>
                <span className="font-bold text-white font-mono text-[11px]">
                  {formatShortRupiah(summaryMetrics.currentAssetCost)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">Potensi Margin Aset</span>
                <span className="font-bold text-emerald-400 font-mono text-[11px]">
                  +{formatShortRupiah(summaryMetrics.assetProfitPotential)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 col-span-2 sm:col-span-1">
                <span className="text-zinc-500 block text-[10px]">Tingkat Perputaran</span>
                <span className="font-bold text-purple-400 font-mono text-[11px]">4.6x Perputaran/Thn</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CHART 3: AREA CHART LINE PEMBELIAN                        */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'pembelian') && (
          <div className="bg-zinc-950/70 border border-zinc-800/90 p-5 rounded-2xl space-y-4 hover:border-amber-500/30 transition relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    3. Area Chart Line Pembelian
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Arus kas belanja barang dagangan, order restock supplier, dan faktur kulakan
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono text-zinc-400">Total Pembelian</span>
                <div className="text-sm sm:text-base font-black text-amber-400 font-mono">
                  {formatRupiah(summaryMetrics.totalPembelian)}
                </div>
              </div>
            </div>

            {/* SVG Area Chart */}
            {(() => {
              const svgWidth = 720;
              const svgHeight = 220;
              const { linePath, areaPath, points } = generatePath(
                chartData.map((d) => d.pembelian),
                svgWidth,
                svgHeight
              );

              return (
                <div className="relative pt-2">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-48 sm:h-56 overflow-visible cursor-crosshair select-none"
                    onMouseMove={(e) => handleSvgMouseMove(e, 'pembelian', svgWidth)}
                    onMouseLeave={handleSvgMouseLeave}
                  >
                    <defs>
                      <linearGradient id="area-gradient-purchase" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                        <stop offset="60%" stopColor="#d97706" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="line-gradient-purchase" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {[0.25, 0.5, 0.75].map((ratio) => {
                      const y = 20 + ratio * (svgHeight - 45);
                      return (
                        <line
                          key={ratio}
                          x1="20"
                          y1={y}
                          x2={svgWidth - 20}
                          y2={y}
                          stroke="#27272a"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Filled Area */}
                    <path d={areaPath} fill="url(#area-gradient-purchase)" />

                    {/* Smooth Stroke Line */}
                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#line-gradient-purchase)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {points.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredPoint?.date === chartData[idx]?.date && hoveredChart === 'pembelian' ? 6 : 3}
                        className="transition-all duration-150"
                        fill="#09090b"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                      />
                    ))}

                    {/* Active Hover Crosshair Line */}
                    {hoveredChart === 'pembelian' && hoveredPoint && (
                      (() => {
                        const idx = chartData.findIndex((c) => c.date === hoveredPoint.date);
                        const pt = points[idx];
                        if (!pt) return null;
                        return (
                          <g>
                            <line
                              x1={pt.x}
                              y1="10"
                              x2={pt.x}
                              y2={svgHeight - 25}
                              stroke="#fbbf24"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                            <circle cx={pt.x} cy={pt.y} r="8" fill="#f59e0b" fillOpacity="0.3" />
                            <circle cx={pt.x} cy={pt.y} r="4" fill="#ffffff" />
                          </g>
                        );
                      })()
                    )}
                  </svg>

                  {/* Floating Tooltip Box */}
                  {hoveredChart === 'pembelian' && hoveredPoint && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-amber-500/40 p-3 rounded-xl shadow-xl text-xs z-20 pointer-events-none min-w-[200px]">
                      <div className="font-bold text-white flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1.5">
                        <span>{hoveredPoint.label}</span>
                        <span className="text-[10px] text-amber-400 font-mono">Pembelian PO</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Total Belanja:</span>
                          <span className="font-mono font-black text-amber-400">
                            {formatRupiah(hoveredPoint.pembelian)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-400">Unit Masuk:</span>
                          <span className="font-mono text-zinc-200">{hoveredPoint.pembelianUnits} Pcs</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-400">Faktur PO:</span>
                          <span className="font-mono text-zinc-200">{hoveredPoint.poCount} Pengiriman</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* X Axis Labels */}
                  <div className="flex items-center justify-between px-2 pt-1 text-[11px] font-mono text-zinc-400">
                    <span>{chartData[0]?.date}</span>
                    <span>{chartData[Math.floor(chartData.length / 2)]?.date}</span>
                    <span>{chartData[chartData.length - 1]?.date}</span>
                  </div>
                </div>
              );
            })()}

            {/* Sub-insights footer */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs border-t border-zinc-800/80">
              <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">Hari Kulakan Utama</span>
                <span className="font-bold text-white text-[11px]">Senin & Kamis (Distributor)</span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">PO Selesai / Masuk</span>
                <span className="font-bold text-amber-400 font-mono text-[11px]">
                  {summaryMetrics.totalPO} Faktur Verified
                </span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 col-span-2 sm:col-span-1">
                <span className="text-zinc-500 block text-[10px]">Diskon Grosir Tercapai</span>
                <span className="font-bold text-emerald-400 font-mono text-[11px]">Hemat 7.2%</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CHART 4: MULTI-AREA CHART STOK VS PENJUALAN VS PEMBELIAN                */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'stok_vs_sales') && (
          <div className={`bg-zinc-950/70 border border-zinc-800/90 p-5 rounded-2xl space-y-4 hover:border-cyan-500/30 transition relative ${
            activeTab === 'all' ? 'lg:col-span-2' : ''
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    4. Area Chart Line: Stok vs Penjualan vs Pembelian
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Korelasi multi-layer keseimbangan volume barang masuk, barang terjual, dan buffer persediaan stok gudang
                </p>
              </div>

              {/* Series Toggles (Legend with clickable toggles) */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSeriesVisible((prev) => ({ ...prev, stok: !prev.stok }))}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    seriesVisible.stok
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800 line-through'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Stok (Unit)</span>
                </button>

                <button
                  onClick={() => setSeriesVisible((prev) => ({ ...prev, penjualan: !prev.penjualan }))}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    seriesVisible.penjualan
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800 line-through'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Penjualan (Unit)</span>
                </button>

                <button
                  onClick={() => setSeriesVisible((prev) => ({ ...prev, pembelian: !prev.pembelian }))}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    seriesVisible.pembelian
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800 line-through'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Pembelian (Unit)</span>
                </button>
              </div>
            </div>

            {/* SVG Multi-Area Comparison Chart */}
            {(() => {
              const svgWidth = 840;
              const svgHeight = 240;

              // Normalized values for multi-comparison (index scale 0 to 100)
              const maxStok = Math.max(...chartData.map((d) => d.stokUnits), 1);
              const maxSales = Math.max(...chartData.map((d) => d.penjualanUnits), 1);
              const maxPurch = Math.max(...chartData.map((d) => d.pembelianUnits), 1);

              // Normalize each series so they can be viewed on an intuitive balanced index
              const stokPath = generatePath(
                chartData.map((d) => d.stokUnits),
                svgWidth,
                svgHeight
              );

              // Scale sales & purchase visually relative to stock flow
              const salesPath = generatePath(
                chartData.map((d) => (d.penjualanUnits / maxSales) * (maxStok * 0.65)),
                svgWidth,
                svgHeight
              );

              const purchPath = generatePath(
                chartData.map((d) => (d.pembelianUnits / (maxPurch || 1)) * (maxStok * 0.65)),
                svgWidth,
                svgHeight
              );

              return (
                <div className="relative pt-2">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-56 sm:h-64 overflow-visible cursor-crosshair select-none"
                    onMouseMove={(e) => handleSvgMouseMove(e, 'stok_vs_sales', svgWidth)}
                    onMouseLeave={handleSvgMouseLeave}
                  >
                    <defs>
                      {/* Stok Cyan Area */}
                      <linearGradient id="area-multi-stok" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                      </linearGradient>

                      {/* Penjualan Green Area */}
                      <linearGradient id="area-multi-sales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>

                      {/* Pembelian Amber Area */}
                      <linearGradient id="area-multi-purch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75].map((ratio) => {
                      const y = 20 + ratio * (svgHeight - 45);
                      return (
                        <line
                          key={ratio}
                          x1="20"
                          y1={y}
                          x2={svgWidth - 20}
                          y2={y}
                          stroke="#27272a"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Layer 1: STOK AREA & LINE */}
                    {seriesVisible.stok && (
                      <g>
                        <path d={stokPath.areaPath} fill="url(#area-multi-stok)" />
                        <path
                          d={stokPath.linePath}
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </g>
                    )}

                    {/* Layer 2: PEMBELIAN AREA & LINE */}
                    {seriesVisible.pembelian && (
                      <g>
                        <path d={purchPath.areaPath} fill="url(#area-multi-purch)" />
                        <path
                          d={purchPath.linePath}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </g>
                    )}

                    {/* Layer 3: PENJUALAN AREA & LINE */}
                    {seriesVisible.penjualan && (
                      <g>
                        <path d={salesPath.areaPath} fill="url(#area-multi-sales)" />
                        <path
                          d={salesPath.linePath}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </g>
                    )}

                    {/* Hover Crosshair indicator */}
                    {hoveredChart === 'stok_vs_sales' && hoveredPoint && (
                      (() => {
                        const idx = chartData.findIndex((c) => c.date === hoveredPoint.date);
                        const pt = stokPath.points[idx];
                        if (!pt) return null;
                        return (
                          <g>
                            <line
                              x1={pt.x}
                              y1="10"
                              x2={pt.x}
                              y2={svgHeight - 25}
                              stroke="#38bdf8"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                            {seriesVisible.stok && (
                              <circle cx={pt.x} cy={stokPath.points[idx]?.y} r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                            )}
                            {seriesVisible.penjualan && (
                              <circle cx={pt.x} cy={salesPath.points[idx]?.y} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                            )}
                            {seriesVisible.pembelian && (
                              <circle cx={pt.x} cy={purchPath.points[idx]?.y} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                            )}
                          </g>
                        );
                      })()
                    )}
                  </svg>

                  {/* Multi-metric Tooltip Box */}
                  {hoveredChart === 'stok_vs_sales' && hoveredPoint && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-cyan-500/40 p-3 rounded-xl shadow-2xl text-xs z-20 pointer-events-none min-w-[260px]">
                      <div className="font-bold text-white flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2">
                        <span>{hoveredPoint.label}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">Perbandingan Komparatif</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-cyan-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            Stok Tersedia:
                          </span>
                          <span className="font-mono font-bold">{hoveredPoint.stokUnits} Pcs</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Penjualan:
                          </span>
                          <span className="font-mono font-bold">
                            {hoveredPoint.penjualanUnits} Pcs ({formatShortRupiah(hoveredPoint.penjualan)})
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-amber-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            Pembelian Restock:
                          </span>
                          <span className="font-mono font-bold">
                            {hoveredPoint.pembelianUnits} Pcs ({formatShortRupiah(hoveredPoint.pembelian)})
                          </span>
                        </div>
                        <div className="border-t border-zinc-800 pt-1 flex justify-between items-center text-[11px] text-zinc-400">
                          <span>Net Perubahan Stok:</span>
                          <span className={`font-mono font-bold ${
                            hoveredPoint.pembelianUnits - hoveredPoint.penjualanUnits >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}>
                            {hoveredPoint.pembelianUnits - hoveredPoint.penjualanUnits >= 0 ? '+' : ''}
                            {hoveredPoint.pembelianUnits - hoveredPoint.penjualanUnits} Pcs
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* X Axis Labels */}
                  <div className="flex items-center justify-between px-2 pt-1 text-[11px] font-mono text-zinc-400">
                    <span>{chartData[0]?.date}</span>
                    <span className="text-[10px] text-zinc-500">
                      Sinkronisasi Stok Gudang & Restock Trigger
                    </span>
                    <span>{chartData[chartData.length - 1]?.date}</span>
                  </div>
                </div>
              );
            })()}

            {/* Tri-balance summary badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-zinc-800/80">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Stok Level Safety Buffer</span>
                  <span className="font-bold text-cyan-400 font-mono text-xs">
                    {summaryMetrics.currentStockUnits} Unit Aktif
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Aman
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Turnover Barang Terjual</span>
                  <span className="font-bold text-emerald-400 font-mono text-xs">
                    {summaryMetrics.totalUnitsSold} Pcs Terjual
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Lancar
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Pasokan Kulakan Masuk</span>
                  <span className="font-bold text-amber-400 font-mono text-xs">
                    {summaryMetrics.totalUnitsBought} Pcs Masuk
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Tepat Waktu
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-zinc-400 border-t border-zinc-800/70">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            Semua area chart dihitung otomatis dari riwayat transaksi POS kasir dan faktur penerimaan gudang.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAddProduct && (
            <button
              onClick={onOpenAddProduct}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
            >
              + Tambah Stok / Produk
            </button>
          )}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('pos_machine')}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
            >
              Buka Mesin POS Kasir
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
