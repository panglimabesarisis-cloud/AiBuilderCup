import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Transaction, TransactionItem, Product } from '../../types';
import {
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  MapPin,
  QrCode,
  CreditCard,
  Boxes,
  Truck,
  Store,
  Receipt,
  RotateCcw,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Check,
  X,
  Package,
  Phone,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Robust phone normalization helper for Indonesian formats (+62, 62, 08, dashes, spaces)
export const normalizePhone = (p?: string): string => {
  if (!p) return '';
  let digits = p.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  if (digits.startsWith('8')) digits = '62' + digits;
  return digits;
};

export type FulfillmentStageType = 'pending' | 'processing' | 'ready' | 'completed' | 'rejected';

export interface FulfillmentInfo {
  status: FulfillmentStageType;
  step: number; // 1 to 4
  percentage: number; // 25, 50, 75, 100
  label: string;
  subLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  barColor: string;
  isFailed: boolean;
  estimatedText: string;
}

export const getFulfillmentInfo = (tx: Transaction): FulfillmentInfo => {
  // If explicitly flagged or rejected
  if (tx.status === 'rejected') {
    return {
      status: 'rejected',
      step: 1,
      percentage: 100,
      label: 'Pesanan Ditolak',
      subLabel: 'Pesanan telah dibatalkan oleh kasir atau sistem.',
      badgeBg: 'bg-rose-500/20',
      badgeText: 'text-rose-400',
      badgeBorder: 'border-rose-500/40',
      barColor: 'bg-rose-500',
      isFailed: true,
      estimatedText: 'Dibatalkan',
    };
  }

  if (tx.status === 'flagged_fraud') {
    return {
      status: 'pending',
      step: 1,
      percentage: 30,
      label: 'Pemeriksaan Anti-Fraud',
      subLabel: 'Menunggu verifikasi radius lokasi & pola belanja.',
      badgeBg: 'bg-amber-500/20',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/40',
      barColor: 'bg-amber-500',
      isFailed: false,
      estimatedText: 'Dalam Peninjauan',
    };
  }

  // Derive from fulfillmentStatus or fallback to tx.status
  const rawStatus = (tx.fulfillmentStatus || tx.status || 'pending').toLowerCase();

  if (rawStatus === 'completed') {
    return {
      status: 'completed',
      step: 4,
      percentage: 100,
      label: 'Pesanan Selesai',
      subLabel: 'Barang telah diterima dan transaksi tuntas.',
      badgeBg: 'bg-emerald-500/20',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/40',
      barColor: 'bg-emerald-500',
      isFailed: false,
      estimatedText: 'Telah Diterima',
    };
  }

  if (rawStatus === 'ready') {
    return {
      status: 'ready',
      step: 3,
      percentage: 75,
      label: 'Siap Diambil / Diantar',
      subLabel: 'Barang telah selesai dikemas rapi dan siap diserahkan.',
      badgeBg: 'bg-indigo-500/20',
      badgeText: 'text-indigo-400',
      badgeBorder: 'border-indigo-500/40',
      barColor: 'bg-indigo-500',
      isFailed: false,
      estimatedText: 'Siap sekarang',
    };
  }

  if (rawStatus === 'processing') {
    return {
      status: 'processing',
      step: 2,
      percentage: 50,
      label: 'Sedang Diproses & Dikemas',
      subLabel: 'Staf toko sedang menyiapkan dus & kemasan barang pesanan Anda.',
      badgeBg: 'bg-blue-500/20',
      badgeText: 'text-blue-400',
      badgeBorder: 'border-blue-500/40',
      barColor: 'bg-blue-500',
      isFailed: false,
      estimatedText: 'Estimasi: 5-10 menit',
    };
  }

  // pending / pending_approval
  return {
    status: 'pending',
    step: 1,
    percentage: 25,
    label: 'Menunggu Konfirmasi Kasir',
    subLabel: 'Pesanan baru masuk ke antrean terminal POS kasir.',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/40',
    barColor: 'bg-amber-500',
    isFailed: false,
    estimatedText: 'Menunggu kasir menyetujui',
  };
};

interface CustomerOrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerPhone?: string;
  onReorder?: (items: { product: Product; packageType: 'carton' | 'unit'; quantity: number }[]) => void;
  availableProducts: Product[];
}

export const CustomerOrderHistoryModal: React.FC<CustomerOrderHistoryModalProps> = ({
  isOpen,
  onClose,
  customerPhone,
  onReorder,
  availableProducts,
}) => {
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Transaction | null>(null);
  const [orderItems, setOrderItems] = useState<TransactionItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [viewAllDemo, setViewAllDemo] = useState<boolean>(false);

  // Currency helper
  const formatMoney = (val: number) => {
    if (val > 1000) {
      return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
    }
    return `$${val.toFixed(2)}`;
  };

  // Real-time listener for customer's PWA orders from transactions collection
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const path = 'transactions';
    // Query recent transactions ordered by createdAt desc to avoid composite index requirements
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const pwaDocs: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<Transaction, 'id'>;
          if (data.channel === 'pwa_client') {
            pwaDocs.push({
              id: docSnap.id,
              ...data,
            });
          }
        });

        // Strict real-time filter for logged-in user's phone number
        const targetPhoneNorm = normalizePhone(customerPhone);
        const filtered = targetPhoneNorm && !viewAllDemo
          ? pwaDocs.filter((d) => normalizePhone(d.customerPhone) === targetPhoneNorm)
          : pwaDocs;

        setOrders(filtered);

        // Update selectedOrder reactively if it exists in list
        setSelectedOrder((prev) => {
          if (!prev) {
            return filtered.length > 0 ? filtered[0] : null;
          }
          const matched = filtered.find((o) => o.id === prev.id);
          return matched || (filtered.length > 0 ? filtered[0] : null);
        });

        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen, customerPhone, viewAllDemo]);

  // Fetch items whenever selectedOrder changes
  useEffect(() => {
    if (!selectedOrder) {
      setOrderItems([]);
      return;
    }

    // If order already has embedded items, use them immediately
    if (selectedOrder.items && selectedOrder.items.length > 0) {
      setOrderItems(selectedOrder.items);
      setLoadingItems(false);
      return;
    }

    let isMounted = true;
    setLoadingItems(true);

    async function fetchItems() {
      try {
        const snap = await getDocs(collection(db, 'transactions', selectedOrder!.id, 'items'));
        const items: TransactionItem[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<TransactionItem, 'id'>) }));

        if (isMounted) {
          setOrderItems(items);
          setLoadingItems(false);
        }
      } catch (err) {
        console.warn('Could not fetch items subcollection:', err);
        if (isMounted) setLoadingItems(false);
      }
    }

    fetchItems();
    return () => {
      isMounted = false;
    };
  }, [selectedOrder?.id]);

  if (!isOpen) return null;

  // Handle reorder
  const handleReorderClick = () => {
    if (!onReorder || orderItems.length === 0) return;
    const itemsToReorder = orderItems.map((oi) => {
      const prod = availableProducts.find((p) => p.id === oi.productId) || {
        id: oi.productId,
        storeId: oi.storeId || 'store_demo_default',
        name: oi.productName,
        sku: 'SKU-REORDER',
        category: 'Groceries',
        barcode: '',
        piecesPerCarton: oi.packageType === 'carton' ? (oi.unitsDeducted / oi.quantityOrdered || 40) : 1,
        stockInUnits: 100,
        costPerUnit: oi.unitPrice * 0.7,
        pricePerUnit: oi.unitPrice,
        pricePerCarton: oi.unitPrice,
        minStockAlert: 10,
      };
      return {
        product: prod,
        packageType: oi.packageType,
        quantity: oi.quantityOrdered,
      };
    });

    onReorder(itemsToReorder);
    onClose();
  };

  // Simulate updating fulfillment stage in real-time in Firestore
  const handleSimulateStageChange = async (targetStage: 'pending' | 'processing' | 'ready' | 'completed') => {
    if (!selectedOrder || isUpdatingStatus) return;
    setIsUpdatingStatus(true);

    try {
      const orderRef = doc(db, 'transactions', selectedOrder.id);
      await updateDoc(orderRef, {
        fulfillmentStatus: targetStage,
        status: targetStage === 'completed' ? 'completed' : 'pending_approval',
        updatedAt: new Date().toISOString(),
      });

      if (targetStage === 'completed') {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error updating fulfillment status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const currentInfo = selectedOrder ? getFulfillmentInfo(selectedOrder) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-4xl h-[90vh] max-h-[850px] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Riwayat Pesanan &amp; Fulfillment Tracker</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Real-Time Live
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Pantau status pesanan, verifikasi GPS toko, dan progres pengemasan secara langsung.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Order Selector & Right Tracker Details */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Order History List with Real-time Progress Bar for Each Order */}
          <div className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950/70 overflow-y-auto p-3.5 space-y-2.5">
            {/* Logged In Member Phone Info Card */}
            <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Sinkronisasi Real-Time:</span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Aktif
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">Nomor WhatsApp:</span>
                <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {customerPhone || 'Umum'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 px-1 mb-1">
              <span>Daftar Pesanan ({orders.length})</span>
              {customerPhone && (
                <button
                  onClick={() => setViewAllDemo((prev) => !prev)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer transition"
                >
                  {viewAllDemo ? 'Filter Nomor Saya' : 'Lihat Semua Demo'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center">
                <RefreshCw className="w-5 h-5 animate-spin mb-2 text-blue-400" />
                Mengambil data pesanan real-time...
              </div>
            ) : orders.length === 0 ? (
              <div className="py-10 px-3 text-center text-zinc-500 text-xs flex flex-col items-center">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                <p className="font-semibold text-zinc-300">Belum ada pesanan untuk nomor ini</p>
                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">{customerPhone || '-'}</p>
                <p className="text-[10px] text-zinc-400 mt-2 max-w-[220px] leading-relaxed">
                  Pesanan yang dibuat via Pesan AI atau checkout PWA akan otomatis muncul di sini secara real-time.
                </p>
                {!viewAllDemo && (
                  <button
                    onClick={() => setViewAllDemo(true)}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition cursor-pointer"
                  >
                    Tampilkan Semua Pesanan Toko
                  </button>
                )}
              </div>
            ) : (
              orders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                const ordInfo = getFulfillmentInfo(ord);

                return (
                  <button
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/60 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40'
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Card Top: Order ID & Fulfillment Badge */}
                    <div className="flex items-start justify-between w-full gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-black text-white">
                            #{ord.id.slice(-8)}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          {new Date(ord.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {/* Real-Time Fulfillment Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 border ${ordInfo.badgeBg} ${ordInfo.badgeText} ${ordInfo.badgeBorder}`}
                      >
                        {!ordInfo.isFailed && ordInfo.status !== 'completed' && (
                          <span className={`w-1.5 h-1.5 rounded-full ${ordInfo.barColor} animate-pulse`} />
                        )}
                        <span>{ordInfo.status}</span>
                        <span className="opacity-80">({ordInfo.percentage}%)</span>
                      </span>
                    </div>

                    {/* Progress Bar for Each Order */}
                    <div className="w-full mt-2.5 mb-1.5">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                        <span className="truncate pr-1 text-zinc-300 font-medium">
                          {ordInfo.label}
                        </span>
                        <span className="font-mono font-bold text-white shrink-0">
                          {ordInfo.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${ordInfo.barColor} transition-all duration-500 rounded-full`}
                          style={{ width: `${ordInfo.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Card Footer: Payment method & Total Price */}
                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs w-full">
                      <span className="text-zinc-400 font-mono text-[10px] uppercase flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-zinc-500" />
                        {ord.paymentMethod}
                      </span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {formatMoney(ord.totalAmount)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Live Fulfillment Tracker & Detailed Timeline */}
          {selectedOrder && currentInfo ? (
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Top Summary Banner */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    Nomor Referensi Transaksi
                  </div>
                  <div className="text-base sm:text-lg font-black text-white font-mono mt-0.5">
                    #{selectedOrder.id}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                    <span>Dipesan: {new Date(selectedOrder.createdAt).toLocaleString()}</span>
                    <span>&bull;</span>
                    <span className="text-blue-400 font-medium">RiskCart PWA</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">Total Tagihan</div>
                    <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                      {formatMoney(selectedOrder.totalAmount)}
                    </div>
                  </div>

                  {/* Anti-Fraud Telemetry Shield Badge */}
                  <div
                    className={`px-3 py-2 rounded-xl border flex items-center gap-2 ${
                      selectedOrder.fraudScore >= 70
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {selectedOrder.fraudScore >= 70 ? (
                      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider">
                        {selectedOrder.fraudScore >= 70 ? 'Risk Alert' : 'Verified Order'}
                      </div>
                      <div className="text-[10px] opacity-80">
                        Skor: {selectedOrder.fraudScore}/100
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE FULFILLMENT TRACKER & MULTI-STAGE PROGRESS BAR */}
              <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Live Fulfillment Status
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentInfo.badgeBg} ${currentInfo.badgeText} ${currentInfo.badgeBorder}`}
                  >
                    {!currentInfo.isFailed && currentInfo.status !== 'completed' && (
                      <span className={`w-2 h-2 rounded-full ${currentInfo.barColor} animate-pulse`} />
                    )}
                    <span>{currentInfo.label}</span>
                    <span className="font-mono opacity-90">({currentInfo.percentage}%)</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {currentInfo.subLabel}
                </p>

                {/* Animated Horizontal Progress Bar Track */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>Progress: {currentInfo.percentage}%</span>
                    <span className="text-zinc-300">{currentInfo.estimatedText}</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden relative shadow-inner">
                    <div
                      className={`h-full ${currentInfo.barColor} transition-all duration-700 ease-out rounded-full relative`}
                      style={{ width: `${currentInfo.percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/15 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* 4-Stage Stepper Checkpoints: Pending -> Processing -> Ready -> Completed */}
                <div className="grid grid-cols-4 gap-2 text-center pt-3 border-t border-zinc-850">
                  {/* Step 1: Pending */}
                  <div className="space-y-1.5 flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        currentInfo.step >= 1
                          ? 'bg-amber-500 text-zinc-950 ring-4 ring-amber-500/20 shadow-md shadow-amber-500/30'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {currentInfo.step > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                    </div>
                    <span className="text-[11px] font-bold text-white">Pending</span>
                    <span className="text-[10px] text-zinc-400 hidden sm:inline">Diterima POS</span>
                  </div>

                  {/* Step 2: Processing */}
                  <div className="space-y-1.5 flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        currentInfo.isFailed
                          ? 'bg-rose-600 text-white'
                          : currentInfo.step >= 2
                          ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md shadow-blue-500/30'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {currentInfo.isFailed ? (
                        '✕'
                      ) : currentInfo.step > 2 ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : currentInfo.step === 2 ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        '2'
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-white">Processing</span>
                    <span className="text-[10px] text-zinc-400 hidden sm:inline">Sedang Dikemas</span>
                  </div>

                  {/* Step 3: Ready */}
                  <div className="space-y-1.5 flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        currentInfo.step >= 3
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-md shadow-indigo-500/30'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {currentInfo.step > 3 ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : currentInfo.step === 3 ? (
                        <Boxes className="w-4 h-4" />
                      ) : (
                        '3'
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-white">Ready</span>
                    <span className="text-[10px] text-zinc-400 hidden sm:inline">Siap Diserahkan</span>
                  </div>

                  {/* Step 4: Completed */}
                  <div className="space-y-1.5 flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        currentInfo.step >= 4
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20 shadow-md shadow-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {currentInfo.step >= 4 ? <Check className="w-4 h-4 stroke-[3]" /> : '4'}
                    </div>
                    <span className="text-[11px] font-bold text-white">Completed</span>
                    <span className="text-[10px] text-zinc-400 hidden sm:inline">Pesanan Selesai</span>
                  </div>
                </div>

                {/* Real-time Status Simulator Buttons (For demo & testing live fulfillment transitions) */}
                <div className="pt-3 border-t border-zinc-850 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Uji Status Kasir Real-Time:</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSimulateStageChange('pending')}
                      disabled={isUpdatingStatus || currentInfo.status === 'pending'}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        currentInfo.status === 'pending'
                          ? 'bg-amber-500 text-zinc-950 font-black'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                      title="Set status to Pending"
                    >
                      1. Pending
                    </button>
                    <button
                      onClick={() => handleSimulateStageChange('processing')}
                      disabled={isUpdatingStatus || currentInfo.status === 'processing'}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        currentInfo.status === 'processing'
                          ? 'bg-blue-600 text-white font-black'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                      title="Set status to Processing"
                    >
                      2. Processing
                    </button>
                    <button
                      onClick={() => handleSimulateStageChange('ready')}
                      disabled={isUpdatingStatus || currentInfo.status === 'ready'}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        currentInfo.status === 'ready'
                          ? 'bg-indigo-600 text-white font-black'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                      title="Set status to Ready"
                    >
                      3. Ready
                    </button>
                    <button
                      onClick={() => handleSimulateStageChange('completed')}
                      disabled={isUpdatingStatus || currentInfo.status === 'completed'}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                        currentInfo.status === 'completed'
                          ? 'bg-emerald-600 text-white font-black'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                      title="Set status to Completed"
                    >
                      4. Completed
                    </button>
                  </div>
                </div>

                {/* Location & Geofence GPS Details */}
                <div className="pt-3 border-t border-zinc-850 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Radius Toko RiskCart: 500m</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedOrder.distanceToStoreMeters !== undefined && (
                      <span className="font-mono text-zinc-300">
                        GPS Pelanggan: {selectedOrder.distanceToStoreMeters}m dari toko
                      </span>
                    )}
                    {selectedOrder.customerLatitude && selectedOrder.customerLongitude && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedOrder.customerLatitude},${selectedOrder.customerLongitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-1 text-[10px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Peta Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Itemized Order Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Daftar Barang Pesanan</span>
                  <span className="text-zinc-500 font-normal">
                    {orderItems.length} jenis produk
                  </span>
                </div>

                {loadingItems ? (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2 text-blue-400" />
                    Mengambil rincian produk...
                  </div>
                ) : orderItems.length === 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 text-center">
                    Rincian produk tercatat di transaksi terminal kasir.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map((it, idx) => (
                      <div
                        key={it.id || idx}
                        className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-white">{it.productName}</div>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                            <span
                              className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                                it.packageType === 'carton'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {it.packageType === 'carton' ? 'Dus / Karton' : 'Satuan'}
                            </span>
                            <span>{it.quantityOrdered}x @ {formatMoney(it.unitPrice)}</span>
                            {it.packageType === 'carton' && (
                              <span className="text-zinc-500">
                                ({it.unitsDeducted} pcs)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="font-bold text-white font-mono">
                          {formatMoney(it.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Verification Note */}
              {selectedOrder.aiExplanation && (
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    <span>Catatan Verifikasi & Anti-Fraud</span>
                  </div>
                  <p className="leading-relaxed text-zinc-400 italic text-[11px]">
                    &quot;{selectedOrder.aiExplanation}&quot;
                  </p>
                </div>
              )}

              {/* Action Buttons at Bottom */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition cursor-pointer"
                  >
                    Cetak Salinan Nota
                  </button>

                  {selectedOrder.customerPhone && (
                    <a
                      href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                        `Halo Kasir RiskCart, saya ingin konfirmasi status pesanan saya #${selectedOrder.id.slice(-8)} (Status: ${currentInfo.label}).`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-xs font-semibold text-white transition flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat Kasir Toko</span>
                    </a>
                  )}
                </div>

                {onReorder && orderItems.length > 0 && (
                  <button
                    onClick={handleReorderClick}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-600/30 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Pesan Ulang Barang Ini</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-zinc-500 text-xs">
              Pilih salah satu pesanan dari daftar di sebelah kiri untuk melihat status pemenuhan barang secara langsung.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
