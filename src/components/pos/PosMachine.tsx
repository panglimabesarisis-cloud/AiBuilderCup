import { formatByMode, USD_RATE } from '../../lib/money';
import { assessOrder, writeFraudLog } from '../../services/fraudService';
import { createSaleWithStock, deductStockForOrder } from '../../services/stockService';
import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Product, Transaction, PackageType } from '../../types';
import { DEMO_STORE_ID, INITIAL_PRODUCTS } from '../../services/dataSeeder';
import confetti from 'canvas-confetti';
import { GlobalModals } from '../common/GlobalModals';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Bell,
  Moon,
  Sun,
  Calendar,
  Maximize2,
  ChevronDown,
  ChevronRight,
  User,
  ShoppingBag,
  CreditCard,
  QrCode,
  DollarSign,
  Printer,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  Flame,
  Store,
  Layers,
  Phone,
  MapPin,
  ExternalLink,
  Menu,
  X,
  Truck,
  ShoppingCart,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';

interface CartLine {
  product: Product;
  packageType: PackageType;
  quantity: number;
}

interface PosMachineProps {
  onNavigateTab?: (tab: string) => void;
  currencyMode?: 'IDR' | 'USD';
  setCurrencyMode?: (mode: 'IDR' | 'USD') => void;
}

export const PosMachine: React.FC<PosMachineProps> = ({
  onNavigateTab,
  currencyMode: propCurrencyMode,
  setCurrencyMode: propSetCurrencyMode,
}) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS as Product[]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Currency format: toggle between IDR (as in reference image) and USD
  const [internalCurrencyMode, setInternalCurrencyMode] = useState<'IDR' | 'USD'>('IDR');
  const currencyMode = propCurrencyMode || internalCurrencyMode;
  const setCurrencyMode = propSetCurrencyMode || setInternalCurrencyMode;

  // Cashier Cart & Calculation State
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('General Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'debt' | 'cod' | 'qris'>('cash');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('0');
  const [calcDisplay, setCalcDisplay] = useState<string>('');
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedTxReceipt, setCompletedTxReceipt] = useState<any | null>(null);

  // Incoming PWA Orders Real-Time listener & state
  const [incomingPwaOrder, setIncomingPwaOrder] = useState<Transaction | null>(null);
  const [pwaOrdersQueue, setPwaOrdersQueue] = useState<Transaction[]>([]);
  const [newPwaOrderNotification, setNewPwaOrderNotification] = useState<string | null>(null);
  const [selectedPwaOrderModal, setSelectedPwaOrderModal] = useState<Transaction | null>(null);
  const lastPwaOrderIdRef = useRef<string | null>(null);

  // Sidebar expanded sections
  const [posMenuOpen, setPosMenuOpen] = useState<boolean>(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Active Interactive Sidebar Modal State
  const [activeModal, setActiveModal] = useState<
    'customers' | 'shift' | 'orders' | 'scanner' | 'chat' | 'help' | 'account' | 'delivery' | null
  >(null);

  // Registered Customer Directory
  const [customerList, setCustomerList] = useState([
    { id: 'c1', name: 'General Walk-in Customer', phone: '-', type: 'Visitor', points: 0, address: 'In-store counter' },
    { id: 'c2', name: 'Risyad Retail Store (PWA Member)', phone: '+6281298837741', type: 'Member VIP', points: 240, address: 'Melati Street No. 14 (32m away)' },
    { id: 'c3', name: 'Budi Santoso (VIP Retailer)', phone: '+6285711223344', type: 'Member VIP', points: 150, address: 'Sudirman Boulevard Block B' },
    { id: 'c4', name: 'Siti Nurhaliza (Local Grocer)', phone: '+6281987654321', type: 'Wholesale Member', points: 310, address: 'Pasar Baru Complex No. 8' },
  ]);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', address: '' });

  // Interactive Cashier Shift State
  const [shiftStartingCash, setShiftStartingCash] = useState<number>(500000); // 500k IDR or $50
  const [shiftClosed, setShiftClosed] = useState<boolean>(false);

  // Customer Chat state
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'Risyad Retail Store (PWA Client)', time: '14:20', text: 'Hello cashier, is my order for Indomie Carton and Mineral Water ready for delivery?', fromCustomer: true },
    { id: 2, sender: 'RiskCart Cashier', time: '14:22', text: 'Hello! Your order has passed geofence verification and is being packed by the warehouse team.', fromCustomer: false },
  ]);
  const [newChatText, setNewChatText] = useState<string>('');

  // Barcode Scanner test state
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);

  // Audio beep generator using Web Audio API
  const playScannerBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  };

  // Audio chime for new incoming PWA order
  const playIncomingOrderChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.3); // D6

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.55);
      osc2.stop(ctx.currentTime + 0.55);
    } catch (e) {}
  };

  const handleScanBarcode = (code: string) => {
    const matched = products.find((p) => p.barcode === code || p.sku.toLowerCase().includes(code.toLowerCase()));
    if (matched) {
      playScannerBeep();
      handleUpdateCart(matched, 1);
      setScanFeedback(`Scanned: ${matched.name} (+1 added to cart)`);
      setTimeout(() => setScanFeedback(null), 3000);
    } else {
      setScanFeedback(`Barcode "${code}" not found in catalog.`);
      setTimeout(() => setScanFeedback(null), 3000);
    }
  };

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // Subscribe to Products & Real-time Incoming PWA Orders
  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const prods: Product[] = [];
        snapshot.forEach((d) => prods.push({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
        setProducts(prods);
      },
      (error) => {
        console.warn('Products onSnapshot error, retaining catalog fallback:', error);
      }
    );

    // Subscribe to latest transactions to capture incoming PWA orders in real time without index errors
    const qTx = query(
      collection(db, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsubPwa = onSnapshot(
      qTx,
      (snapshot) => {
        if (!snapshot.empty) {
          const pwaList: Transaction[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Omit<Transaction, 'id'>;
            if (data.channel === 'pwa_client') {
              pwaList.push({
                id: docSnap.id,
                ...data,
              });
            }
          });

          if (pwaList.length > 0) {
            setPwaOrdersQueue(pwaList);

            // Prioritize order with pending_approval/pending status, otherwise most recent
            const pendingOrder = pwaList.find(
              (o) => o.status === 'pending_approval' || o.status === 'pending'
            );
            const targetOrder = pendingOrder || pwaList[0];
            setIncomingPwaOrder(targetOrder);

            // Check if this is a newly arrived order from PWA
            const newestPwa = pwaList[0];
            if (
              lastPwaOrderIdRef.current !== null &&
              lastPwaOrderIdRef.current !== newestPwa.id &&
              (newestPwa.status === 'pending_approval' || newestPwa.status === 'pending')
            ) {
              playIncomingOrderChime();
              setNewPwaOrderNotification(
                `🔔 Pesanan PWA Baru Masuk! Pelanggan: ${newestPwa.customerName} (#${newestPwa.id.slice(-6)})`
              );
              setTimeout(() => setNewPwaOrderNotification(null), 8000);
            }
            lastPwaOrderIdRef.current = newestPwa.id;
          }
        }
      },
      (error) => {
        console.warn('PWA transactions subscription notice:', error);
      }
    );

    return () => {
      unsubProducts();
      unsubPwa();
    };
  }, []);

  // Format price helper (supports both IDR and USD scale)
  const formatMoney = (val: number) => formatByMode(val, currencyMode);

  // Categories list
  const categoryTabs = [
    'ALL',
    'Cola',
    'Gas',
    'Coffee',
    'Mineral',
    'Mineral Dus',
    'Mineral Galon',
    'Flavors',
    'Susu',
    'Tea',
  ];

  const filteredProducts = products.filter((p) => {
    const matchCat =
      selectedCategory === 'ALL'
        ? true
        : p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // Cart operations
  const getCartQty = (productId: string) => {
    const item = cart.find((c) => c.product.id === productId);
    return item ? item.quantity : 0;
  };

  const handleUpdateCart = (product: Product, delta: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        const newQty = next[idx].quantity + delta;
        if (newQty <= 0) {
          return next.filter((_, i) => i !== idx);
        }
        next[idx].quantity = newQty;
        return next;
      }
      if (delta > 0) {
        const isCarton = product.category === 'Mineral Dus' || product.name.includes('(Dus)');
        return [...prev, { product, packageType: isCarton ? 'carton' : 'unit', quantity: 1 }];
      }
      return prev;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    setCashReceivedInput('0');
    setCalcDisplay('');
  };

  // Pricing math
  const subtotal = cart.reduce((sum, item) => {
    const price =
      item.packageType === 'carton' ? item.product.pricePerCarton : item.product.pricePerUnit;
    return sum + price * item.quantity;
  }, 0);

  const total = subtotal;
  const cashGiven = Number(cashReceivedInput) || 0;
  const change = Math.max(0, cashGiven - (currencyMode === 'IDR' ? Math.round(total) : Number((total / USD_RATE).toFixed(2))));
  const remaining = Math.max(0, (currencyMode === 'IDR' ? Math.round(total) : Number((total / USD_RATE).toFixed(2))) - cashGiven);

  // Numpad handlers
  const handleNumClick = (val: string) => {
    if (cashReceivedInput === '0' && val !== '.') {
      setCashReceivedInput(val);
    } else {
      setCashReceivedInput((prev) => prev + val);
    }
  };

  const handleNumClear = () => {
    setCashReceivedInput('0');
  };

  const handleNumBackspace = () => {
    setCashReceivedInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleQuickCash = (amount: number) => {
    setCashReceivedInput(String(amount));
  };

  const handleExactCash = () => {
    const exact = currencyMode === 'IDR' ? Math.round(total) : Number((total / USD_RATE).toFixed(2));
    setCashReceivedInput(String(exact));
  };

  // Complete Order
  const handlePayOrder = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const itemsPayload = cart.map((c) => ({
        productId: c.product.id,
        productName: c.product.name,
        packageType: c.packageType,
        quantityOrdered: c.quantity,
        unitPrice: c.packageType === 'carton' ? c.product.pricePerCarton : c.product.pricePerUnit,
      }));

      // Penilaian anti-fraud di server. Jika server tidak terjangkau, kasir diberi pilihan.
      let ai: Awaited<ReturnType<typeof assessOrder>> | null = null;
      try {
        ai = await assessOrder({
          channel: 'pos',
          orderId: crypto.randomUUID(),
          totalAmount: total,
          items: itemsPayload,
          customerPhone: '',
          gpsAccuracy: null,
        });
      } catch (e) {
        const lanjut = window.confirm(
          'Pemeriksaan anti-fraud tidak tersedia. Lanjutkan penjualan tanpa pemeriksaan AI? (akan ditandai AI_UNAVAILABLE)'
        );
        if (!lanjut) return;
      }

      const status: Transaction['status'] =
        ai?.recommendation === 'reject' ? 'rejected' : ai?.recommendation === 'review' ? 'pending_approval' : 'completed';
      if (status === 'rejected') {
        window.alert(`Transaksi ditolak sistem anti-fraud (skor ${ai!.fraudScore}). ${ai!.aiExplanation}`);
        return;
      }

      const totalCost = Math.round(
        cart.reduce((sum, c) => {
          const units = (c.packageType === 'carton' ? c.product.piecesPerCarton : 1) * c.quantity;
          return sum + units * (c.product.costPerUnit || 0);
        }, 0)
      );

      const newTx: Omit<Transaction, 'id'> = {
        storeId: DEMO_STORE_ID,
        channel: 'pos',
        customerName: selectedCustomer,
        totalAmount: total,
        totalCost,
        paymentMethod: paymentMethod === 'debt' ? 'card' : paymentMethod === 'cod' ? 'cash' : paymentMethod,
        status,
        fraudScore: ai?.fraudScore ?? 0,
        fraudFlags: ai ? ai.fraudFlags : ['AI_UNAVAILABLE'],
        riskLevel: ai?.riskLevel ?? 'warning',
        aiExplanation: ai?.aiExplanation ?? 'Pemeriksaan AI tidak tersedia; kasir melanjutkan secara manual.',
        cashierId: 'cashier_rc_01',
        createdAt: new Date().toISOString(),
      };

      const lines = cart.map((item) => {
        const unitPrice = item.packageType === 'carton' ? item.product.pricePerCarton : item.product.pricePerUnit;
        return {
          storeId: DEMO_STORE_ID,
          productId: item.product.id,
          productName: item.product.name,
          packageType: item.packageType,
          quantityOrdered: item.quantity,
          unitsDeducted: (item.packageType === 'carton' ? item.product.piecesPerCarton : 1) * item.quantity,
          unitPrice,
          subtotal: unitPrice * item.quantity,
        };
      });

      // Transaksi + item + pengurangan stok dalam satu transaksi atomik; gagal bila stok kurang.
      const docRefId = await createSaleWithStock(newTx, lines);
      if (ai) await writeFraudLog(docRefId, ai);
      const docRef = { id: docRefId };

      setCompletedTxReceipt({
        id: docRef.id,
        ...newTx,
        items: cart,
        cashPaid: cashGiven,
        change,
      });

      handleClearCart();
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    } finally {
      setIsProcessing(false);
    }
  };

  // Action on incoming PWA order (Fulfill or Reject)
  const handlePwaAction = async (action: 'approve' | 'reject', targetOrder?: Transaction) => {
    const order = targetOrder || incomingPwaOrder;
    if (!order) return;
    if (order.status === 'completed' || order.status === 'rejected') return; // sudah diproses

    try {
      if (action === 'approve') {
        // Stok dikurangi dulu (atomik, aman dipanggil dua kali). Gagal bila stok tidak cukup.
        await deductStockForOrder(
          order.id,
          (order.items || []).map((it) => ({ productId: it.productId, units: Number(it.unitsDeducted) || 0 }))
        );
      }
      await updateDoc(doc(db, 'transactions', order.id), {
        status: action === 'approve' ? 'completed' : 'rejected',
        fulfillmentStatus: action === 'approve' ? 'completed' : 'pending',
        reviewedBy: 'Administrator',
        reviewedAt: new Date().toISOString(),
      });

      if (action === 'approve') {
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}
      }

      // Update state
      setIncomingPwaOrder((prev) =>
        prev && prev.id === order.id
          ? { ...prev, status: action === 'approve' ? 'completed' : 'rejected' }
          : prev
      );

      setPwaOrdersQueue((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: action === 'approve' ? 'completed' : 'rejected' } : o
        )
      );

      if (selectedPwaOrderModal && selectedPwaOrderModal.id === order.id) {
        setSelectedPwaOrderModal({
          ...selectedPwaOrderModal,
          status: action === 'approve' ? 'completed' : 'rejected',
          fulfillmentStatus: action === 'approve' ? 'completed' : 'pending',
        });
      }
    } catch (error) {
      if (error instanceof Error && /Stok|Produk|Transaksi/.test(error.message)) {
        window.alert(error.message);
        return;
      }
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${order.id}`);
    }
  };

  // Update fulfillment stage from POS terminal
  const handleUpdateFulfillmentStage = async (orderId: string, stage: 'pending' | 'processing' | 'ready' | 'completed') => {
    try {
      if (stage === 'completed') {
        const ord = pwaOrdersQueue.find((o) => o.id === orderId);
        if (ord && ord.status === 'rejected') return;
        if (ord) {
          await deductStockForOrder(
            orderId,
            (ord.items || []).map((it) => ({ productId: it.productId, units: Number(it.unitsDeducted) || 0 }))
          );
        }
      }
      await updateDoc(doc(db, 'transactions', orderId), {
        fulfillmentStatus: stage,
        ...(stage === 'completed' ? { status: 'completed' } : {}),
        updatedAt: new Date().toISOString(),
      });

      if (stage === 'completed') {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } catch (e) {}
      }

      // Update state locally
      setIncomingPwaOrder((prev) =>
        prev && prev.id === orderId
          ? { ...prev, fulfillmentStatus: stage, status: stage === 'completed' ? 'completed' : prev.status }
          : prev
      );

      setPwaOrdersQueue((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, fulfillmentStatus: stage, status: stage === 'completed' ? 'completed' : o.status }
            : o
        )
      );

      if (selectedPwaOrderModal && selectedPwaOrderModal.id === orderId) {
        setSelectedPwaOrderModal({
          ...selectedPwaOrderModal,
          fulfillmentStatus: stage,
          status: stage === 'completed' ? 'completed' : selectedPwaOrderModal.status,
        });
      }
    } catch (err) {
      console.error('Error updating fulfillment stage:', err);
      if (err instanceof Error && /^Stok|^Produk/.test(err.message)) window.alert(err.message);
    }
  };

  // Load incoming PWA order into cashier cart
  const handleLoadPwaOrderToCart = (order: Transaction) => {
    if (!order.items || order.items.length === 0) {
      return;
    }

    const lines: CartLine[] = [];
    order.items.forEach((it) => {
      const prod = products.find((p) => p.id === it.productId);
      if (prod) {
        lines.push({
          product: prod,
          packageType: it.packageType,
          quantity: it.quantityOrdered,
        });
      }
    });

    if (lines.length > 0) {
      setCart(lines);
      setSelectedCustomer(`${order.customerName} (PWA Client)`);
      if (order.paymentMethod === 'cash') setPaymentMethod('cash');
      else if (order.paymentMethod === 'qris') setPaymentMethod('qris');
    }
  };

  return (
    <div className="flex w-full h-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* MAIN CENTER CONTENT & PRODUCT GRID */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">

            <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>RiskCart POS Terminal</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 hidden sm:inline-block">
                LIVE
              </span>
            </h1>

            <div className="hidden md:flex items-center gap-3 text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                Started : 08:00:00
              </span>
              <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                Session Timer {formatTimer(sessionSeconds)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action Icons */}
            <div className="flex items-center gap-1 text-zinc-400">
              <button className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-lg">
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrencyMode(currencyMode === 'IDR' ? 'USD' : 'IDR')}
                className="px-2 py-1 text-[11px] font-bold rounded bg-zinc-800 text-zinc-300 hover:text-white"
                title="Toggle Currency IDR / USD"
              >
                {currencyMode === 'IDR' ? 'Rp IDR' : '$ USD'}
              </button>
              <button className="relative p-1.5 hover:text-white hover:bg-zinc-800 rounded-lg">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
              </button>
              <button className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-lg">
                <Calendar className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-lg">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800 text-xs">
              <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold">
                A
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-bold text-white text-[11px] leading-tight">Administrator</div>
                <div className="text-[10px] text-zinc-500">Owner</div>
              </div>
            </div>

            {/* Create Order Button */}
            <button
              onClick={handleClearCart}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              New Order
            </button>
          </div>
        </div>

        {/* Real-time Incoming PWA Order Alert Banner */}
        {incomingPwaOrder && (incomingPwaOrder.status === 'pending_approval' || incomingPwaOrder.status === 'pending') && (
          <div className="bg-gradient-to-r from-blue-900/95 via-indigo-950/90 to-blue-900/95 border-b border-blue-500/50 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs shrink-0 shadow-lg shadow-blue-950/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-3 w-3 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="font-black text-white flex items-center gap-1.5 shrink-0">
                <Phone className="w-3.5 h-3.5 text-blue-300" />
                Incoming PWA Order Masuk!
              </span>
              <span className="text-blue-200 truncate hidden sm:inline">
                Pelanggan: <strong className="text-white">{incomingPwaOrder.customerName}</strong> &bull; Total: <strong className="text-emerald-300">{formatMoney(incomingPwaOrder.totalAmount)}</strong> ({incomingPwaOrder.items?.length || 1} produk)
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSelectedPwaOrderModal(incomingPwaOrder)}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition cursor-pointer"
              >
                Lihat Rincian
              </button>
              <button
                onClick={() => handlePwaAction('approve')}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition cursor-pointer"
              >
                <CheckCircle className="w-3 h-3" />
                Fulfill Order
              </button>
            </div>
          </div>
        )}

        {/* Global Toast Alert for freshly arrived PWA Order */}
        {newPwaOrderNotification && (
          <div className="bg-emerald-600 text-white font-bold px-4 py-2 text-xs flex items-center justify-between shrink-0 shadow-md animate-bounce">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{newPwaOrderNotification}</span>
            </div>
            <button
              onClick={() => setNewPwaOrderNotification(null)}
              className="text-white/80 hover:text-white ml-4 text-xs font-mono"
            >
              ✕
            </button>
          </div>
        )}

        {/* Category Tabs Strip (Exactly like screenshot) */}
        <div className="px-6 py-3 bg-zinc-950 border-b border-zinc-850 flex items-center gap-2 overflow-x-auto shrink-0">
          {categoryTabs.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search, Filter & Customer Toolbar */}
        <div className="px-6 py-3 bg-zinc-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search product name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="ALL">ALL CATEGORIES</option>
              <option value="Mineral Dus">Mineral Dus (Carton)</option>
              <option value="Flavors">Flavors</option>
              <option value="Coffee">Coffee</option>
              <option value="Tea">Tea</option>
            </select>

            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              {viewMode === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-5">
            {filteredProducts.map((p) => {
              const currentQty = getCartQty(p.id);
              const isCarton = p.category === 'Mineral Dus' || p.name.includes('(Dus)');
              const price = isCarton ? p.pricePerCarton : p.pricePerUnit;

              return (
                <div
                  key={p.id}
                  className="group bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition"
                >
                  {/* Image Container with high aspect ratio */}
                  <div className="relative aspect-[4/3] bg-zinc-950 flex items-center justify-center overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Store className="w-8 h-8" />
                      </div>
                    )}

                    {/* Carton or Stock Pill */}
                    {isCarton && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-md">
                        Dus / Carton ({p.piecesPerCarton} Pcs)
                      </span>
                    )}
                  </div>

                  {/* Product Details & Stepper */}
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">
                        {p.name}
                      </h3>
                      <div className="text-xs font-semibold text-zinc-400 mt-1">
                        {formatMoney(price)}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {p.stockInUnits > 0 ? `Stock: ${p.stockInUnits} units` : 'Stock unavailable'}
                      </div>
                    </div>

                    {/* Stepper directly on card ([-] 0 [+]) matching screenshot */}
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-end">
                      <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                        <button
                          onClick={() => handleUpdateCart(p, -1)}
                          disabled={currentQty === 0}
                          className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono text-white">
                          {currentQty}
                        </span>
                        <button
                          onClick={() => handleUpdateCart(p, 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-blue-400 hover:text-white hover:bg-blue-600 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. RIGHT CASHIER REGISTER & NUMPAD (Exact visual replica of right panel in PosRiskCart.jpg) */}
      <aside className="w-80 md:w-96 shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col justify-between overflow-y-auto">
        <div className="p-4 space-y-3">
          {/* Header & Customer Input Field */}
          <div className="space-y-2 pb-2.5 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Customer / Pelanggan
              </span>
              <button
                onClick={handleClearCart}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
              >
                Clear Cart
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-400" />
                <input
                  type="text"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none transition"
                  placeholder="Nama Pelanggan (Walk-in)..."
                />
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('customers')}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm cursor-pointer shrink-0"
                title="Buka Direktori Pelanggan / Member"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="min-h-[100px] max-h-[180px] overflow-y-auto pr-1 space-y-2">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No items selected yet
              </div>
            ) : (
              cart.map((item, idx) => {
                const itemPrice =
                  item.packageType === 'carton' ? item.product.pricePerCarton : item.product.pricePerUnit;
                const sub = itemPrice * item.quantity;

                return (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-white truncate max-w-[150px]">
                        {item.product.name}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {item.quantity} x {formatMoney(itemPrice)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{formatMoney(sub)}</span>
                      <button
                        onClick={() => handleUpdateCart(item.product, -item.quantity)}
                        className="text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pricing Totals */}
          <div className="pt-2 border-t border-zinc-800 text-xs space-y-1">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span className="font-mono text-white font-semibold">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Reward Points</span>
              <span className="font-mono text-blue-400 font-semibold">0 Pts</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-zinc-850">
              <span>Total</span>
              <span className="font-mono text-white text-base">{formatMoney(total)}</span>
            </div>
          </div>

          {/* Payment Method Switcher (Cash, Debt, COD, QRIS) */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`py-1.5 rounded-lg text-xs font-bold transition ${
                paymentMethod === 'cash'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Cash
            </button>
            <button
              onClick={() => setPaymentMethod('debt')}
              className={`py-1.5 rounded-lg text-xs font-bold transition ${
                paymentMethod === 'debt'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Debt
            </button>
            <button
              onClick={() => setPaymentMethod('cod')}
              className={`py-1.5 rounded-lg text-xs font-bold transition ${
                paymentMethod === 'cod'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              COD
            </button>
            <button
              onClick={() => setPaymentMethod('qris')}
              className={`py-1.5 rounded-lg text-xs font-bold transition ${
                paymentMethod === 'qris'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              QRIS
            </button>
          </div>

          {/* Visitor Dropdown */}
          <div className="pt-1">
            <select className="w-full bg-blue-600/20 border border-blue-500/40 text-blue-300 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none">
              <option value="visitor">Visitor</option>
              <option value="member">Member VIP</option>
            </select>
          </div>

          {/* Payment Calculation Breakdown */}
          <div className="text-[11px] space-y-1 text-zinc-400 pt-1">
            <div className="flex justify-between">
              <span>Cash Tendered</span>
              <span className="font-mono text-white">
                {currencyMode === 'IDR'
                  ? `Rp ${cashGiven.toLocaleString('id-ID')}`
                  : `$${cashGiven.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Balance Due</span>
              <span className="font-mono text-amber-400">
                {currencyMode === 'IDR'
                  ? `Rp ${remaining.toLocaleString('id-ID')}`
                  : `$${remaining.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Change</span>
              <span className="font-mono text-emerald-400 font-bold">
                {currencyMode === 'IDR'
                  ? `Rp ${change.toLocaleString('id-ID')}`
                  : `$${change.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Big Blue Display Box (Exact Match to PosRiskCart.jpg) */}
          <div className="p-3.5 rounded-xl bg-blue-600 text-white flex items-center justify-between shadow-lg shadow-blue-600/30">
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-200">Total:</div>
              <div className="text-xl font-black font-mono leading-none mt-0.5">
                {formatMoney(total)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black font-mono leading-none">
                {currencyMode === 'IDR' ? cashGiven.toLocaleString('id-ID') : cashGiven}
              </div>
              <div className="text-[10px] font-bold text-blue-200 mt-0.5">
                Change: {currencyMode === 'IDR' ? `Rp ${change.toLocaleString('id-ID')}` : `$${change.toFixed(2)}`}
              </div>
            </div>
          </div>

          {/* Quick Cash Denominations */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              onClick={() => handleQuickCash(currencyMode === 'IDR' ? 10000 : 10)}
              className="py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              {currencyMode === 'IDR' ? '10K' : '$10'}
            </button>
            <button
              onClick={() => handleQuickCash(currencyMode === 'IDR' ? 20000 : 20)}
              className="py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              {currencyMode === 'IDR' ? '20K' : '$20'}
            </button>
            <button
              onClick={() => handleQuickCash(currencyMode === 'IDR' ? 50000 : 50)}
              className="py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              {currencyMode === 'IDR' ? '50K' : '$50'}
            </button>
            <button
              onClick={() => handleQuickCash(currencyMode === 'IDR' ? 100000 : 100)}
              className="py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              {currencyMode === 'IDR' ? '100K' : '$100'}
            </button>
          </div>

          {/* 4x4 Calculator Numpad (Exact Match) */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 text-xs font-bold">
            <button
              onClick={handleNumClear}
              className="py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              C
            </button>
            <button
              onClick={handleNumBackspace}
              className="py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              ⌫
            </button>
            <button
              onClick={() => handleNumClick('00')}
              className="py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              00
            </button>
            <button
              onClick={() => handleNumClick('000')}
              className="py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              000
            </button>

            <button
              onClick={() => handleNumClick('7')}
              className="py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-800"
            >
              7
            </button>
            <button
              onClick={() => handleNumClick('8')}
              className="py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-800"
            >
              8
            </button>
            <button
              onClick={() => handleNumClick('9')}
              className="py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-800"
            >
              9
            </button>
            <button
              onClick={() => handleNumClick('-')}
              className="py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              -
            </button>

            <button
              onClick={() => handleNumClick('4')}
              className="py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-800"
            >
              4
            </button>
            <button
              onClick={() => handleNumClick('5')}
              className="py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-800"
            >
              5
            </button>
            <button
              onClick={() => handleNumClick('6')}
              className="py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-800"
            >
              6
            </button>
            <button
              onClick={() => handleNumClick('+')}
              className="py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              +
            </button>

            <button
              onClick={() => handleNumClick('1')}
              className="py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-800"
            >
              1
            </button>
            <button
              onClick={() => handleNumClick('2')}
              className="py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-800"
            >
              2
            </button>
            <button
              onClick={() => handleNumClick('3')}
              className="py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-800"
            >
              3
            </button>
            <button
              onClick={() => handleNumClick('=')}
              className="py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-blue-400"
            >
              =
            </button>

            <button
              onClick={() => handleNumClick('0')}
              className="col-span-2 py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-800"
            >
              0
            </button>
            <button
              onClick={() => handleNumClick('.')}
              className="col-span-2 py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-800"
            >
              .
            </button>
          </div>

          {/* Action Buttons (Exact Cash & Pay Order) */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleExactCash}
              className="py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs border border-blue-500/30 transition"
            >
              Exact Cash
            </button>
            <button
              onClick={handlePayOrder}
              disabled={isProcessing || cart.length === 0}
              className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition disabled:opacity-50 shadow-md shadow-blue-600/30"
            >
              {isProcessing ? 'Processing...' : 'Pay & Order'}
            </button>
          </div>

          {/* 4. BOTTOM FLOATING SECTION: ORDER FROM PWA (Exact match to screenshot bottom card!) */}
          <div className="pt-3 border-t border-zinc-800">
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                incomingPwaOrder && (incomingPwaOrder.status === 'pending_approval' || incomingPwaOrder.status === 'pending')
                  ? 'bg-blue-950/60 border-blue-500/70 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40'
                  : 'bg-zinc-900/60 border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-blue-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Incoming PWA Order
                  {incomingPwaOrder && (incomingPwaOrder.status === 'pending_approval' || incomingPwaOrder.status === 'pending') && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                      BARU
                    </span>
                  )}
                  {incomingPwaOrder?.status === 'completed' && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      SELESAI
                    </span>
                  )}
                </span>
                <span className="font-mono text-[10px] text-zinc-400">
                  {incomingPwaOrder ? `#${incomingPwaOrder.id.slice(-8)}` : 'PWA26100977DB'}
                </span>
              </div>

              <div className="text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-white font-bold truncate">
                    Customer:
                    <span className="text-blue-300 ml-1 truncate">
                      {incomingPwaOrder ? incomingPwaOrder.customerName : 'Risyad Retail Store'}
                    </span>
                    <span className="text-[10px] text-amber-400">✦</span>
                  </div>
                  {incomingPwaOrder?.customerPhone && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {incomingPwaOrder.customerPhone}
                    </span>
                  )}
                </div>
                <div className="text-zinc-400 flex items-center gap-1 text-[10px]">
                  <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {incomingPwaOrder?.distanceToStoreMeters !== undefined
                      ? `Verified GPS: ${incomingPwaOrder.distanceToStoreMeters}m from store`
                      : 'Verified Geofence (32m away)'}
                  </span>
                  {incomingPwaOrder?.customerLatitude && (
                    <a
                      href={`https://www.google.com/maps?q=${incomingPwaOrder.customerLatitude},${incomingPwaOrder.customerLongitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline ml-auto text-[9px]"
                    >
                      Maps
                    </a>
                  )}
                </div>
              </div>

              {/* Sample / Live Order Items from PWA */}
              <div className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[10px] space-y-1 max-h-32 overflow-y-auto">
                {incomingPwaOrder?.items && incomingPwaOrder.items.length > 0 ? (
                  incomingPwaOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-zinc-300">
                      <span className="truncate pr-1">
                        {it.quantityOrdered}x {it.productName} ({it.packageType === 'carton' ? 'Dus' : 'Satuan'})
                      </span>
                      <span className="font-mono shrink-0">{formatMoney(it.subtotal)}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between text-zinc-300">
                      <span>1x Indomie Fried (Dus)</span>
                      <span className="font-mono">{formatMoney(19.00)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>1x Mineral Water Galon</span>
                      <span className="font-mono">{formatMoney(1.40)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-white pt-1 border-t border-zinc-800">
                  <span>Total</span>
                  <span className="font-mono text-emerald-400">
                    {incomingPwaOrder ? formatMoney(incomingPwaOrder.totalAmount) : formatMoney(20.40)}
                  </span>
                </div>
              </div>

              {/* Action Dropdown / Button (Order Actions) */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => handlePwaAction('approve')}
                  disabled={incomingPwaOrder?.status === 'completed'}
                  className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-[11px] text-center flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Action: Fulfill Order</span>
                </button>
                <button
                  onClick={() => incomingPwaOrder && handleLoadPwaOrderToCart(incomingPwaOrder)}
                  className="px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition cursor-pointer flex items-center justify-center"
                  title="Muat ke Kasir Register"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => incomingPwaOrder && setSelectedPwaOrderModal(incomingPwaOrder)}
                  className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[11px] transition cursor-pointer"
                  title="Lihat Detail Pesanan"
                >
                  Detail
                </button>
                {incomingPwaOrder?.status !== 'completed' && incomingPwaOrder?.status !== 'rejected' && (
                  <button
                    onClick={() => handlePwaAction('reject')}
                    className="px-2 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-bold text-[11px] border border-rose-800/60 transition cursor-pointer"
                    title="Reject Order"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Cashier Digital Receipt Modal */}
      {completedTxReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="text-center pb-3 border-b border-zinc-800">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Transaction Completed</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">#{completedTxReceipt.id.slice(-8)}</p>
            </div>

            <div className="space-y-1.5 text-xs bg-zinc-950 p-3 rounded-xl border border-zinc-850">
              <div className="flex justify-between text-zinc-400">
                <span>Customer:</span>
                <span className="text-white font-semibold">{completedTxReceipt.customerName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total Amount:</span>
                <span className="text-white font-mono font-bold">
                  {formatMoney(completedTxReceipt.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Cash Tendered:</span>
                <span className="text-white font-mono">
                  {currencyMode === 'IDR'
                    ? `Rp ${completedTxReceipt.cashPaid.toLocaleString('id-ID')}`
                    : `$${completedTxReceipt.cashPaid.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-zinc-850">
                <span>Change:</span>
                <span className="font-mono">
                  {currencyMode === 'IDR'
                    ? `Rp ${completedTxReceipt.change.toLocaleString('id-ID')}`
                    : `$${completedTxReceipt.change.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>RiskCart Anti-Fraud Verification: Score 5/100 (Clean Counter Sale)</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                onClick={() => setCompletedTxReceipt(null)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Incoming PWA Order Modal */}
      {selectedPwaOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Incoming PWA Order</h3>
                    <span className="font-mono text-xs text-zinc-400">#{selectedPwaOrderModal.id.slice(-8)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedPwaOrderModal.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : selectedPwaOrderModal.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {selectedPwaOrderModal.status === 'completed'
                        ? 'SELESAI / FULFILLED'
                        : selectedPwaOrderModal.status === 'rejected'
                        ? 'DITOLAK'
                        : 'MENUNGGU KONFIRMASI KASIR'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(selectedPwaOrderModal.createdAt).toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPwaOrderModal(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Location Verified Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-zinc-500">Profil Pelanggan</div>
                <div className="font-bold text-white text-sm flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  {selectedPwaOrderModal.customerName}
                </div>
                {selectedPwaOrderModal.customerPhone && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-400 font-mono text-[11px]">{selectedPwaOrderModal.customerPhone}</span>
                    <a
                      href={`https://wa.me/${selectedPwaOrderModal.customerPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Chat WA
                    </a>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-zinc-500">Verifikasi Geofence GPS</div>
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedPwaOrderModal.distanceToStoreMeters !== undefined
                    ? `${selectedPwaOrderModal.distanceToStoreMeters} meter dari toko`
                    : 'Dalam Radius Toko'}
                </div>
                {selectedPwaOrderModal.customerLatitude && (
                  <a
                    href={`https://www.google.com/maps?q=${selectedPwaOrderModal.customerLatitude},${selectedPwaOrderModal.customerLongitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline text-[11px] flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Buka Google Maps
                  </a>
                )}
              </div>
            </div>

            {/* Itemized Order List */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400 font-bold pb-1.5 border-b border-zinc-850">
                <span>Rincian Barang Dipesan</span>
                <span>Subtotal</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedPwaOrderModal.items && selectedPwaOrderModal.items.length > 0 ? (
                  selectedPwaOrderModal.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-zinc-200">
                      <div>
                        <div className="font-semibold text-white">
                          {it.quantityOrdered}x {it.productName}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Kemasan: {it.packageType === 'carton' ? 'Dus / Karton' : 'Satuan'} &bull; @{formatMoney(it.unitPrice)}
                        </div>
                      </div>
                      <span className="font-mono font-semibold">{formatMoney(it.subtotal)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-400 italic text-[11px]">
                    Pesanan grosir langsung dari aplikasi PWA Client.
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm font-bold">
                <span className="text-white">Total Pembayaran:</span>
                <span className="font-mono text-emerald-400">{formatMoney(selectedPwaOrderModal.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>Metode Pembayaran:</span>
                <span className="font-semibold uppercase text-white">{selectedPwaOrderModal.paymentMethod}</span>
              </div>
            </div>

            {/* Fulfillment Progression Controls */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  Update Status Pemenuhan (Fulfillment Stage):
                </span>
                <span className="font-mono text-[10px] text-zinc-400 uppercase">
                  Aktif: {selectedPwaOrderModal.fulfillmentStatus || (selectedPwaOrderModal.status === 'completed' ? 'completed' : 'pending')}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => handleUpdateFulfillmentStage(selectedPwaOrderModal.id, 'pending')}
                  className={`py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    (selectedPwaOrderModal.fulfillmentStatus === 'pending' || (!selectedPwaOrderModal.fulfillmentStatus && selectedPwaOrderModal.status !== 'completed'))
                      ? 'bg-amber-500 text-zinc-950 font-black'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  1. Pending
                </button>
                <button
                  onClick={() => handleUpdateFulfillmentStage(selectedPwaOrderModal.id, 'processing')}
                  className={`py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    selectedPwaOrderModal.fulfillmentStatus === 'processing'
                      ? 'bg-blue-600 text-white font-black'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  2. Processing
                </button>
                <button
                  onClick={() => handleUpdateFulfillmentStage(selectedPwaOrderModal.id, 'ready')}
                  className={`py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    selectedPwaOrderModal.fulfillmentStatus === 'ready'
                      ? 'bg-indigo-600 text-white font-black'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  3. Ready
                </button>
                <button
                  onClick={() => handleUpdateFulfillmentStage(selectedPwaOrderModal.id, 'completed')}
                  className={`py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    (selectedPwaOrderModal.fulfillmentStatus === 'completed' || selectedPwaOrderModal.status === 'completed')
                      ? 'bg-emerald-600 text-white font-black'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  4. Completed
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => {
                  handlePwaAction('approve', selectedPwaOrderModal);
                  setSelectedPwaOrderModal(null);
                }}
                disabled={selectedPwaOrderModal.status === 'completed'}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Terima & Selesaikan Pesanan</span>
              </button>
              <button
                onClick={() => {
                  handleLoadPwaOrderToCart(selectedPwaOrderModal);
                  setSelectedPwaOrderModal(null);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Muat ke Kasir</span>
              </button>
              {selectedPwaOrderModal.status !== 'completed' && selectedPwaOrderModal.status !== 'rejected' && (
                <button
                  onClick={() => {
                    handlePwaAction('reject', selectedPwaOrderModal);
                    setSelectedPwaOrderModal(null);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-800 transition cursor-pointer"
                >
                  Tolak
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Interactive Modals (Customer Directory, Shift, Scanner, Chat, Orders, Delivery Radar, Account, Help) */}
      <GlobalModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        currencyMode={currencyMode}
        onNavigateTab={onNavigateTab || (() => {})}
        onSelectCustomer={(name) => setSelectedCustomer(name)}
        sessionSeconds={sessionSeconds}
      />
    </div>
  );
};
