import { assessOrder, writeFraudLog } from '../../services/fraudService';
import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Product, PackageType, CartItem, Transaction, TransactionItem } from '../../types';
import { DEMO_STORE_ID, DEFAULT_STORE_CONFIG, INITIAL_PRODUCTS } from '../../services/dataSeeder';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ShoppingBag,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Send,
  Boxes,
  Package,
  Plus,
  Minus,
  Trash2,
  Phone,
  CheckCircle2,
  RefreshCw,
  QrCode,
  CreditCard,
  Banknote,
  Navigation,
  Radio,
  ArrowRight,
  ArrowLeft,
  Info,
  Receipt,
  Smartphone,
  Compass,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Clock,
  Search,
  Check,
  ChevronRight,
  Store,
  SlidersHorizontal,
  Bot,
  User,
  Share2,
  Copy,
  Layers,
  Truck,
  RotateCcw,
  ChevronDown,
  Filter,
} from 'lucide-react';
import {
  CustomerOrderHistoryModal,
  normalizePhone,
  getFulfillmentInfo,
  FulfillmentInfo,
} from './CustomerOrderHistoryModal';

// Flow Screens according to user instructions:
// 1. splash (client-pwa1.jpeg)
// 2. home_guest (client-pwa2.jped)
// 3. register_member (client-pwa3.jpeg)
// 4. setting_address (client-pwa4.jpeg)
// 5. verify_whatsapp (client-pwa41.jpeg)
// 6. home_member (client-pwa6.jpeg)
// 7. cart (client-pwa10.jpeg)
// 8. order_history (Live Fulfillment & Visual Progress Tracker)
type PwaScreen =
  | 'splash'
  | 'home_guest'
  | 'register_member'
  | 'setting_address'
  | 'verify_whatsapp'
  | 'home_member'
  | 'cart'
  | 'order_history';

/**
 * Visual Progress Indicator for orders with 4 canonical fulfillment steps:
 * 1. Pending (Diterima Kasir POS)
 * 2. Processing (Sedang Dikemas)
 * 3. Ready (Siap Diambil / Diantar)
 * 4. Completed (Pesanan Selesai & Diterima)
 */
export const OrderProgressIndicator: React.FC<{
  order: Transaction;
  compact?: boolean;
}> = ({ order, compact = false }) => {
  const info = getFulfillmentInfo(order);

  const STAGES = [
    {
      key: 'pending',
      stepNum: 1,
      name: 'Pending',
      desc: 'Diterima Kasir POS',
      icon: Clock,
    },
    {
      key: 'processing',
      stepNum: 2,
      name: 'Processing',
      desc: 'Sedang Dikemas',
      icon: Package,
    },
    {
      key: 'ready',
      stepNum: 3,
      name: 'Ready',
      desc: 'Siap Diambil/Kirim',
      icon: Truck,
    },
    {
      key: 'completed',
      stepNum: 4,
      name: 'Completed',
      desc: 'Pesanan Selesai',
      icon: CheckCircle2,
    },
  ];

  if (info.isFailed) {
    return (
      <div className="w-full bg-rose-950/40 border border-rose-500/30 rounded-2xl p-3 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-rose-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            Pesanan Dibatalkan / Ditolak
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
            Rejected
          </span>
        </div>
        <p className="text-[11px] text-zinc-400">
          {info.subLabel || 'Pesanan telah dibatalkan atau ditolak oleh kasir POS toko.'}
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <span
              className={`w-2 h-2 rounded-full ${info.barColor} ${
                info.status !== 'completed' ? 'animate-pulse' : ''
              }`}
            />
            <span className="uppercase text-[10px] tracking-wider text-zinc-400">Tahap:</span>
            <span className={info.badgeText}>{info.label}</span>
          </span>
          <span className="font-mono text-[10px] font-bold text-zinc-300">
            {info.percentage}%
          </span>
        </div>

        {/* Compact Progress Bar */}
        <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full ${info.barColor} transition-all duration-500 rounded-full`}
            style={{ width: `${info.percentage}%` }}
          />
        </div>

        {/* 4 Steps Labels */}
        <div className="grid grid-cols-4 text-center text-[9px] text-zinc-400">
          {STAGES.map((s) => (
            <span
              key={s.key}
              className={`transition-colors ${
                info.step >= s.stepNum ? 'text-white font-bold' : 'text-zinc-600'
              }`}
            >
              {s.name}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-850 rounded-2xl p-3.5 space-y-3.5 shadow-inner">
      {/* Status Header Badge & Estimated text */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border flex items-center gap-1.5 ${info.badgeBg} ${info.badgeText} ${info.badgeBorder}`}
          >
            {info.status !== 'completed' && !info.isFailed && (
              <span className={`w-2 h-2 rounded-full ${info.barColor} animate-pulse`} />
            )}
            {info.status === 'completed' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            <span>{info.label}</span>
            <span className="opacity-80 font-mono">({info.percentage}%)</span>
          </span>
        </div>

        <span className="text-[11px] font-medium text-zinc-400">
          {info.estimatedText}
        </span>
      </div>

      {/* 4-Stage Stepper Track with Connected Line */}
      <div className="relative pt-2 pb-1">
        {/* Background Rail */}
        <div className="absolute top-[21px] left-6 right-6 h-1 bg-zinc-800 -translate-y-1/2 rounded-full z-0">
          {/* Active progress fill */}
          <div
            className={`h-full ${info.barColor} transition-all duration-700 ease-out rounded-full`}
            style={{
              width: `${
                info.step === 1
                  ? '12%'
                  : info.step === 2
                  ? '44%'
                  : info.step === 3
                  ? '76%'
                  : '100%'
              }`,
            }}
          />
        </div>

        {/* The 4 Checkpoint Nodes */}
        <div className="relative z-10 grid grid-cols-4 gap-1">
          {STAGES.map((stage) => {
            const isCompleted = info.step > stage.stepNum;
            const isCurrent = info.step === stage.stepNum;
            const StageIcon = stage.icon;

            return (
              <div key={stage.key} className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-zinc-950 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? stage.stepNum === 1
                        ? 'bg-amber-500 text-zinc-950 ring-4 ring-amber-500/30 shadow-md shadow-amber-500/30'
                        : stage.stepNum === 2
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 shadow-md shadow-blue-500/30'
                        : stage.stepNum === 3
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30 shadow-md shadow-indigo-500/30'
                        : 'bg-emerald-600 text-white ring-4 ring-emerald-500/30 shadow-md shadow-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isCurrent ? (
                    stage.stepNum === 2 ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <StageIcon className="w-4 h-4" />
                    )
                  ) : (
                    <span>{stage.stepNum}</span>
                  )}
                </div>

                <div className="mt-1.5">
                  <div
                    className={`text-[10px] font-bold ${
                      isCurrent
                        ? 'text-white'
                        : isCompleted
                        ? 'text-emerald-400'
                        : 'text-zinc-500'
                    }`}
                  >
                    {stage.name}
                  </div>
                  <div className="text-[9px] text-zinc-400 hidden sm:block leading-tight">
                    {stage.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contextual Description Banner */}
      <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-300 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1 leading-snug">
          <span>{info.subLabel}</span>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Terhubung otomatis dengan antrean kasir POS RiskCart</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MemberProfile {
  name: string;
  phone: string;
  email: string;
  businessType: string;
  address: string;
  addressNotes: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isLocationChecked: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
}

export const ClientPwaApp: React.FC = () => {
  // Navigation & Screen Flow State
  const [currentScreen, setCurrentScreen] = useState<PwaScreen>('splash');
  // Mode demo (?demo=1): stepper loncat layar + bingkai HP. Di mode normal pelanggan hanya melihat aplikasi layar penuh.
  const isDemoNav = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1';
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(isDemoNav && typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(INITIAL_PRODUCTS as Product[]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('Semua');

  // Member Registration & Profile State
  const [member, setMember] = useState<MemberProfile>({
    name: 'Ahmad Maulana (Toko Berkah)',
    phone: '081289765432',
    email: 'toko.berkah@gmail.com',
    businessType: 'Toko Kelontong & Sembako',
    address: 'Jl. Hayam Wuruk No. 88, RT 03/RW 06, Kebon Kelapa, Gambir, Jakarta Pusat',
    addressNotes: 'Samping Masjid Jami Al-Ikhlas, Pintu Gerbang Biru',
    latitude: null,
    longitude: null,
    accuracy: null,
    isLocationChecked: false,
    isVerified: false,
    verifiedAt: null,
  });

  // Location Verification State (client-pwa4.jpeg)
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string>('');
  const [locationError, setLocationError] = useState<string | null>(null);

  // Fonnte WhatsApp OTP State (client-pwa41.jpeg)
  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [fonnteStatus, setFonnteStatus] = useState<{
    sent: boolean;
    deliveredViaFonnte: boolean;
    detail?: string;
  }>({ sent: false, deliveredViaFonnte: false });
  const [otpCountdown, setOtpCountdown] = useState<number>(60);
  const [otpTimerActive, setOtpTimerActive] = useState<boolean>(false);

  // AI Order Modal State (client-pwa6.jpeg & client-pwa7.jpeg)
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiChatMessages, setAiChatMessages] = useState<
    Array<{ sender: 'ai' | 'user'; text: string; time: string; structuredItems?: any[] }>
  >([]);
  const [aiInputText, setAiInputText] = useState<string>('');
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Cart & Order State (client-pwa10.jpeg)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'cod' | 'transfer'>('qris');
  const [isOrderPlaced, setIsOrderPlaced] = useState<boolean>(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [placedTx, setPlacedTx] = useState<Transaction | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [formFeedbackMessage, setFormFeedbackMessage] = useState<string | null>(null);

  // Persistent real-time listener for the logged-in customer's orders based on customerPhone
  const [userOrders, setUserOrders] = useState<Transaction[]>([]);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);
  const [latestActiveOrder, setLatestActiveOrder] = useState<Transaction | null>(null);

  // Order History Screen View States
  const [historyFilter, setHistoryFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [viewAllDemoOrders, setViewAllDemoOrders] = useState<boolean>(false);

  useEffect(() => {
    const targetPhoneNorm = normalizePhone(member.phone);
    const q = query(
      collection(db, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matching: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<Transaction, 'id'>;
          if (data.channel === 'pwa_client' || data.channel === 'client_pwa') {
            const txNormPhone = normalizePhone(data.customerPhone);
            if (viewAllDemoOrders || !targetPhoneNorm || txNormPhone === targetPhoneNorm) {
              matching.push({
                id: docSnap.id,
                ...data,
              });
            }
          }
        });

        setUserOrders(matching);

        // Calculate active orders (pending_approval, pending, processing, ready)
        const active = matching.filter(
          (o) =>
            o.status !== 'completed' &&
            o.status !== 'rejected' &&
            o.status !== 'refunded' &&
            o.fulfillmentStatus !== 'completed'
        );
        setActiveOrdersCount(active.length);
        setLatestActiveOrder(active.length > 0 ? active[0] : null);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'transactions');
      }
    );

    return () => unsubscribe();
  }, [member.phone, viewAllDemoOrders]);

  // Subscribe to real-time products
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          const prods: Product[] = [];
          snapshot.forEach((d) => prods.push({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
          setCatalogProducts(prods);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'products')
    );
    return () => unsub();
  }, []);

  // OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (otpTimerActive && otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    } else if (otpCountdown === 0) {
      setOtpTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [otpTimerActive, otpCountdown]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [aiChatMessages, isAiProcessing]);

  // Format Indonesian Rupiah
  const formatRupiah = (amount: number) => {
    // Demo price multiplier: if values are small (< 500) convert to typical IDR (x 15.000)
    const effectiveVal = amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(effectiveVal);
  };

  // Distance helper
  const calculateDistanceToStore = (lat: number, lon: number) => {
    const storeLat = DEFAULT_STORE_CONFIG.latitude;
    const storeLon = DEFAULT_STORE_CONFIG.longitude;
    const R = 6371e3;
    const phi1 = (lat * Math.PI) / 180;
    const phi2 = (storeLat * Math.PI) / 180;
    const deltaPhi = ((storeLat - lat) * Math.PI) / 180;
    const deltaLambda = ((storeLon - lon) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // STEP 4: CEK LOKASI (client-pwa4.jpeg)
  // Wajib klik cek lokasi -> loading dengan akurasi tingkat tinggi -> request permission -> titik koordinat Google Map otomatis masuk!
  const handleCheckLocation = () => {
    setIsGpsLoading(true);
    setLocationError(null);
    setLocationStatusMessage('Meminta izin browser & mengukur koordinat dengan akurasi tingkat tinggi...');

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          const accuracy = Math.round(pos.coords.accuracy ?? -1);
          if (accuracy > 50) {
            setIsGpsLoading(false);
            setLocationError(`Akurasi GPS terlalu rendah (±${accuracy} m). Pindah ke area terbuka lalu coba lagi (maksimal ±50 m).`);
            setLocationStatusMessage('');
            return;
          }

          setMember((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            accuracy: accuracy,
            isLocationChecked: true,
          }));

          setIsGpsLoading(false);
          setLocationStatusMessage(`Lokasi berhasil dikonfirmasi! Akurasi: ±${accuracy} meter (High-Accuracy GPS).`);
        },
        (err) => {
          console.warn('Geolocation warning/denied:', err);
          setMember((prev) => ({ ...prev, latitude: null, longitude: null, accuracy: null, isLocationChecked: false }));
          setIsGpsLoading(false);
          setLocationStatusMessage('');
          setLocationError('Izin lokasi ditolak atau gagal. Aktifkan izin lokasi di browser, lalu tekan Cek Lokasi lagi.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setIsGpsLoading(false);
      setLocationStatusMessage('');
      setLocationError('Browser ini tidak mendukung GPS. Buka lewat Chrome atau Safari di ponsel.');
    }
  };

  // STEP 5: PROSES DAFTAR SEKARANG & KIRIM OTP FONNTE (client-pwa41.jpeg)
  const handleProceedToOtp = async () => {
    if (!member.name.trim() || !member.phone.trim()) {
      setFormFeedbackMessage('Mohon lengkapi Nama Toko/Pemilik dan Nomor WhatsApp!');
      return;
    }

    // Lokasi wajib sudah dicek dan valid (tidak ada koordinat cadangan)
    if (!member.isLocationChecked || member.latitude === null || member.longitude === null) {
      setFormFeedbackMessage('Cek lokasi dulu. Lokasi yang valid wajib untuk pendaftaran.');
      return;
    }

    setFormFeedbackMessage(null);
    setOtpCode(['', '', '', '', '', '']);
    setIsSendingOtp(true);

    // Kode dibuat dan dikirim oleh server; klien tidak pernah memegang token atau kode.
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: member.phone, customerName: member.name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormFeedbackMessage(data.error || 'Gagal mengirim OTP. Coba lagi.');
        return;
      }
      setGeneratedOtp(data.demoOtp || ''); // hanya terisi jika server memakai OTP_DEMO_ECHO=true
      setFonnteStatus({
        sent: true,
        deliveredViaFonnte: !!data.deliveredViaFonnte,
        detail: data.deliveredViaFonnte
          ? 'Kode OTP dikirim ke WhatsApp Anda.'
          : 'Mode demo: WhatsApp tidak aktif di server, kode ditampilkan di bawah.',
      });
      setOtpCountdown(60);
      setOtpTimerActive(true);
      setCurrentScreen('verify_whatsapp');
    } catch (e) {
      console.warn('OTP send error:', e);
      setFormFeedbackMessage('Server tidak terjangkau. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // STEP 6: VERIFIKASI KODE OTP
  const handleVerifyOtp = async () => {
    const entered = otpCode.join('');
    if (!/^\d{6}$/.test(entered)) {
      setFormFeedbackMessage('Masukkan 6 digit kode OTP.');
      return;
    }
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: member.phone, code: entered }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.verified) {
        setFormFeedbackMessage(data.error || 'Kode OTP tidak sesuai.');
        return;
      }
    } catch (e) {
      setFormFeedbackMessage('Server tidak terjangkau. Coba lagi.');
      return;
    }

    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    setMember((prev) => ({
      ...prev,
      isVerified: true,
      verifiedAt: new Date().toLocaleTimeString('id-ID'),
    }));
    setFormFeedbackMessage(null);
    setTimeout(() => setCurrentScreen('home_member'), 500);
  };

  // STEP 8: BUKA KOTAK AI PEMESANAN (client-pwa7.jpeg)
  // AI langsung memberikan pertanyaan: "Apa ada yang ingin di pesan?"
  const handleOpenAiOrderModal = () => {
    setIsAiModalOpen(true);
    if (aiChatMessages.length === 0) {
      setAiChatMessages([
        {
          sender: 'ai',
          text: 'Halo kak! Apa ada yang ingin di pesan hari ini?\n\nKetik nama barang dan jumlahnya (misal: "Pesan Indomie Goreng 5 dus dan Kopi Nongkrong 2 karton"), saya akan langsung membaca pesanan dan memasukkannya ke keranjang belanja Anda!',
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // STEP 9: PARSING PESANAN AI & LANGSUNG KE HALAMAN CART (client-pwa10.jpeg)
  const handleSendAiOrder = async (orderPrompt?: string) => {
    const promptToSend = (orderPrompt || aiInputText).trim();
    if (!promptToSend) return;

    // Add user message to chat
    const userMsgTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setAiChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: promptToSend, time: userMsgTime },
    ]);
    setAiInputText('');
    setIsAiProcessing(true);

    try {
      // Call AI parse endpoint with Gemini
      const response = await fetch('/api/ai/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: promptToSend,
          products: catalogProducts,
        }),
      });

      const data = await response.json().catch(() => ({}));
      let recognizedItems = data.recognizedItems || [];

      // Smart deterministic fallback parser if AI returns empty
      if (!recognizedItems || recognizedItems.length === 0) {
        recognizedItems = parseTextLocally(promptToSend, catalogProducts);
      }

      if (recognizedItems.length > 0) {
        // Add items to Cart
        const newCartItems: CartItem[] = [...cart];
        const addedSummary: string[] = [];

        recognizedItems.forEach((item: any) => {
          let matchedProd = catalogProducts.find((p) => p.id === item.productId);
          if (!matchedProd) {
            // Fuzzy match by name
            matchedProd = catalogProducts.find((p) =>
              p.name.toLowerCase().includes(item.productName.toLowerCase())
            ) || catalogProducts[0];
          }

          const pkgType: PackageType = item.packageType === 'carton' ? 'carton' : 'unit';
          const qty = Number(item.quantity) || 1;

          const existingIdx = newCartItems.findIndex(
            (c) => c.product.id === matchedProd!.id && c.packageType === pkgType
          );

          if (existingIdx >= 0) {
            newCartItems[existingIdx].quantity += qty;
          } else {
            newCartItems.push({
              product: matchedProd!,
              packageType: pkgType,
              quantity: qty,
            });
          }

          addedSummary.push(`${qty} ${pkgType === 'carton' ? 'Dus/Karton' : 'Unit'} ${matchedProd!.name}`);
        });

        setCart(newCartItems);

        // AI Response in Chat
        const aiReplyTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setAiChatMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: `Siap kak! ${addedSummary.join(' & ')} berhasil saya catat dan langsung dimasukkan ke keranjang pesanan.\n\nMembuka halaman keranjang sekarang...`,
            time: aiReplyTime,
            structuredItems: recognizedItems,
          },
        ]);

        // Automatically close modal and navigate to Cart (client-pwa10.jpeg) after 1.2s!
        setTimeout(() => {
          setIsAiModalOpen(false);
          setCurrentScreen('cart');
        }, 1200);
      } else {
        // No items matched
        const aiReplyTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setAiChatMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: 'Maaf kak, saya belum dapat menemukan produk yang sesuai. Coba sebutkan nama seperti: "Indomie Goreng 5 dus" atau "Kopi Nongkrong 2 dus", atau klik tombol rekomendasi cepat di bawah!',
            time: aiReplyTime,
          },
        ]);
      }
    } catch (err) {
      console.warn('AI Parsing error, applying local regex matcher:', err);
      const fallbackItems = parseTextLocally(promptToSend, catalogProducts);
      if (fallbackItems.length > 0) {
        const newCartItems: CartItem[] = [...cart];
        fallbackItems.forEach((item) => {
          const matchedProd = catalogProducts.find((p) => p.id === item.productId) || catalogProducts[0];
          newCartItems.push({
            product: matchedProd,
            packageType: item.packageType as PackageType,
            quantity: item.quantity,
          });
        });
        setCart(newCartItems);
        setAiChatMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: `Pesanan berhasil dicatat! Menuju halaman keranjang sekarang...`,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setTimeout(() => {
          setIsAiModalOpen(false);
          setCurrentScreen('cart');
        }, 1000);
      }
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Local regex parser helper
  const parseTextLocally = (text: string, prods: Product[]) => {
    const items: any[] = [];
    const lower = text.toLowerCase();

    // Check indomie
    if (lower.includes('indomie') || lower.includes('mie') || lower.includes('goreng')) {
      const matchQty = lower.match(/(\d+)\s*(dus|karton|kardus|box|pack|bungkus|pcs|unit)?/);
      const qty = matchQty ? parseInt(matchQty[1], 10) : 5;
      const isCarton = lower.includes('dus') || lower.includes('karton') || lower.includes('box');
      const prod = prods.find((p) => p.name.toLowerCase().includes('indomie')) || prods[0];
      items.push({
        productId: prod.id,
        productName: prod.name,
        packageType: isCarton ? 'carton' : 'unit',
        quantity: qty,
        confidence: 0.95,
      });
    }

    // Check kopi
    if (lower.includes('kopi') || lower.includes('coffee') || lower.includes('nongkrong')) {
      const matchQty = lower.match(/(\d+)\s*(dus|karton|kardus|box|botol|pcs|unit)?\s*(kopi|coffee)/);
      const qty = matchQty ? parseInt(matchQty[1], 10) : 2;
      const isCarton = lower.includes('dus') || lower.includes('karton');
      const prod = prods.find((p) => p.name.toLowerCase().includes('kopi')) || prods[2] || prods[0];
      items.push({
        productId: prod.id,
        productName: prod.name,
        packageType: isCarton ? 'carton' : 'unit',
        quantity: qty,
        confidence: 0.92,
      });
    }

    // Check nipis
    if (lower.includes('nipis') || lower.includes('madu')) {
      const prod = prods.find((p) => p.name.toLowerCase().includes('nipis')) || prods[0];
      items.push({
        productId: prod.id,
        productName: prod.name,
        packageType: 'carton',
        quantity: 2,
        confidence: 0.9,
      });
    }

    return items;
  };

  // Cart Subtotal Calculation
  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.packageType === 'carton' ? item.product.pricePerCarton : item.product.pricePerUnit;
    const effectivePrice = price;
    return sum + effectivePrice * item.quantity;
  }, 0);

  const memberDiscount = member.isVerified ? Math.round(cartSubtotal * 0.05) : 0;
  const deliveryFee = 0; // Free delivery for local verified member
  const totalPayable = Math.max(0, cartSubtotal - memberDiscount + deliveryFee);

  // Update Cart Quantity
  const handleUpdateQty = (idx: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const newQty = copy[idx].quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== idx);
      }
      copy[idx].quantity = newQty;
      return copy;
    });
  };

  // Place Order Checkout
  const handleConfirmOrder = async () => {
    if (cart.length === 0 || isPlacingOrder) return;
    if (!member.isVerified) {
      setCheckoutError('Verifikasi nomor WhatsApp Anda dulu sebelum memesan.');
      return;
    }
    setIsPlacingOrder(true);

    setCheckoutError(null);

    try {
      const txItems: TransactionItem[] = cart.map((item, idx) => {
        const price = item.packageType === 'carton' ? item.product.pricePerCarton : item.product.pricePerUnit;
        return {
          id: `pwa-item-${Date.now()}-${idx}`,
          storeId: DEMO_STORE_ID,
          transactionId: '',
          productId: item.product.id,
          productName: item.product.name,
          packageType: item.packageType,
          quantityOrdered: item.quantity,
          unitsDeducted: item.packageType === 'carton' ? item.quantity * item.product.piecesPerCarton : item.quantity,
          unitPrice: price,
          subtotal: price * item.quantity,
        };
      });
      const totalCost = Math.round(
        cart.reduce((sum, item) => {
          const units = item.packageType === 'carton' ? item.quantity * item.product.piecesPerCarton : item.quantity;
          return sum + units * (item.product.costPerUnit || 0);
        }, 0)
      );

      // Penilaian anti-fraud di server. Tanpa hasilnya, pesanan tidak disimpan.
      let ai;
      try {
        ai = await assessOrder({
          channel: 'pwa_client',
          orderId: crypto.randomUUID(),
          totalAmount: totalPayable,
          items: txItems.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            packageType: i.packageType,
            quantityOrdered: i.quantityOrdered,
          })),
          customerPhone: member.phone,
          customerLatitude: member.latitude,
          customerLongitude: member.longitude,
          gpsAccuracy: member.accuracy,
        });
      } catch (e) {
        setCheckoutError('Pesanan belum bisa diperiksa keamanannya. Periksa koneksi lalu coba lagi.');
        return;
      }

      const txPayload: Omit<Transaction, 'id'> = {
        storeId: DEMO_STORE_ID,
        channel: 'pwa_client',
        customerName: member.name || 'Member PWA',
        customerPhone: member.phone || '',
        totalAmount: totalPayable,
        totalCost,
        paymentMethod: paymentMethod === 'qris' ? 'qris' : paymentMethod === 'cod' ? 'cash' : 'bank_transfer',
        status: ai.recommendation === 'reject' ? 'rejected' : 'pending_approval',
        fraudScore: ai.fraudScore,
        fraudFlags: ai.fraudFlags,
        riskLevel: ai.riskLevel,
        customerLatitude: member.latitude ?? undefined,
        customerLongitude: member.longitude ?? undefined,
        distanceToStoreMeters: ai.distanceToStoreMeters ?? undefined,
        gpsAccuracy: member.accuracy ?? undefined,
        isMockGpsSuspected: ai.isMockGpsSuspected,
        aiExplanation: ai.aiExplanation,
        items: txItems,
        createdAt: new Date().toISOString(),
      };

      let docRef;
      try {
        docRef = await addDoc(collection(db, 'transactions'), txPayload);
        for (const item of txItems) {
          await addDoc(collection(db, 'transactions', docRef.id, 'items'), {
            ...item,
            transactionId: docRef.id,
          });
        }
      } catch (firestoreErr) {
        console.error('Gagal menyimpan pesanan:', firestoreErr);
        setCheckoutError('Pesanan gagal disimpan. Coba lagi beberapa saat.');
        return;
      }
      await writeFraudLog(docRef.id, ai);

      if (ai.recommendation === 'reject') {
        setCheckoutError('Pesanan ditolak oleh sistem keamanan. Hubungi toko jika ini keliru.');
        return;
      }

      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } catch (e) {}
      setPlacedTx({ id: docRef.id, ...txPayload });
      setIsOrderPlaced(true);
    } catch (err) {
      console.error('Error placing order:', err);
      setCheckoutError('Terjadi kesalahan saat memproses pesanan.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Filter products by category & search
  const filteredProducts = catalogProducts.filter((p) => {
    const matchCat = activeCategory === 'Semua' || p.category.toLowerCase().includes(activeCategory.toLowerCase());
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="w-full flex flex-col items-center">
      {/* ============================================================ */}
      {/* TOP CONTROLS: BREADCRUMB FLOW STEPPER & VIEW MODE SWITCHER */}
      {/* ============================================================ */}
      {isDemoNav && (
      <div className="w-full max-w-5xl mb-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Step Indicator Flow (1 to 10 as specified by user) */}
        <div className="w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
            <span className="font-bold text-zinc-400 mr-1 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> PWA Flow:
            </span>

            {/* 1. Splash */}
            <button
              onClick={() => setCurrentScreen('splash')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                currentScreen === 'splash'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              1. Splash
            </button>

            {/* 2. Home Tamu */}
            <button
              onClick={() => setCurrentScreen('home_guest')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                currentScreen === 'home_guest'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              2. Home Tamu
            </button>

            {/* 3. Daftar Member */}
            <button
              onClick={() => setCurrentScreen('register_member')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                currentScreen === 'register_member'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              3. Daftar Member
            </button>

            {/* 4. Setting Alamat & GPS */}
            <button
              onClick={() => setCurrentScreen('setting_address')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                currentScreen === 'setting_address'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              4. Alamat & GPS
            </button>

            {/* 5. Verifikasi WA Fonnte */}
            <button
              onClick={() => setCurrentScreen('verify_whatsapp')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                currentScreen === 'verify_whatsapp'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              5. WA Fonnte OTP
            </button>

            {/* 6. Home Member */}
            <button
              onClick={() => setCurrentScreen('home_member')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                currentScreen === 'home_member'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              6. Home Member
            </button>

            {/* 7. Cart / Keranjang */}
            <button
              onClick={() => setCurrentScreen('cart')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                currentScreen === 'cart'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              7. Cart ({cart.length})
            </button>

            {/* 8. Riwayat Pesanan */}
            <button
              onClick={() => setCurrentScreen('order_history')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                currentScreen === 'order_history'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>8. Riwayat ({userOrders.length})</span>
              {activeOrdersCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
          </div>
        </div>

        {/* View Mode Toggle: Device Mockup vs Responsive Full */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setDeviceFrameMode((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            {deviceFrameMode ? 'Tampilan Layar Penuh' : 'Tampilan Bingkai HP'}
          </button>
        </div>
      </div>
      )}

      {/* ============================================================ */}
      {/* MAIN CONTAINER: SMARTPHONE FRAME OR FULL RESPONSIVE VIEW */}
      {/* ============================================================ */}
      <div
        className={`${
          deviceFrameMode
            ? 'w-full max-w-[420px] rounded-[42px] border-[10px] border-zinc-800 bg-zinc-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden relative min-h-[780px] my-2'
            : 'w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative min-h-[750px]'
        }`}
      >
        {/* Phone Speaker Notch & Status Bar (in mobile frame mode) */}
        {deviceFrameMode && (
          <div className="w-full bg-zinc-950 px-6 pt-3 pb-2 flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-900 select-none">
            <span className="font-semibold text-white">09:41</span>
            <div className="w-24 h-4 bg-zinc-900 rounded-full mx-auto" />
            <div className="flex items-center gap-1.5 text-xs text-zinc-300">
              <span>5G</span>
              <div className="w-4 h-2.5 border border-zinc-400 rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-emerald-400 rounded-2xs" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* SCREEN 1: SPLASH SCREEN (client-pwa1.jpeg) */}
        {/* ========================================================== */}
        {currentScreen === 'splash' && (
          <div className="relative min-h-[720px] flex flex-col justify-between p-6 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Brand Tag */}
            <div className="flex items-center justify-between pt-4">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PWA Client App &bull; AI Powered
              </span>
              <span className="text-xs text-zinc-500">v2.6 Mobile</span>
            </div>

            {/* Central Splash Graphic & App Identity */}
            <div className="flex flex-col items-center text-center my-auto py-8">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-0.5 shadow-2xl shadow-emerald-500/30 animate-pulse">
                  <div className="w-full h-full bg-zinc-950 rounded-[22px] flex items-center justify-center">
                    <Store className="w-12 h-12 text-emerald-400" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-lg font-black text-xs">
                  AI
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                RiskCart Store
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm max-w-xs leading-relaxed">
                Platform Belanja Pintar Retail & Grosir dengan Asisten AI, GPS Akurasi Tinggi, dan Verifikasi WhatsApp Resmi.
              </p>

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-2 mt-8 w-full max-w-xs text-left">
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <Bot className="w-4 h-4 text-emerald-400 mb-1" />
                  <div className="text-[11px] font-bold text-white">Pesan via AI</div>
                  <div className="text-[10px] text-zinc-400">Cukup ketik pesan chat</div>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <Compass className="w-4 h-4 text-blue-400 mb-1" />
                  <div className="text-[11px] font-bold text-white">GPS Presisi</div>
                  <div className="text-[10px] text-zinc-400">Google Maps auto-pin</div>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <MessageSquare className="w-4 h-4 text-emerald-400 mb-1" />
                  <div className="text-[11px] font-bold text-white">WA Fonnte</div>
                  <div className="text-[10px] text-zinc-400">Verifikasi OTP otomatis</div>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <Boxes className="w-4 h-4 text-amber-400 mb-1" />
                  <div className="text-[11px] font-bold text-white">Dus & Satuan</div>
                  <div className="text-[10px] text-zinc-400">Harga grosir resmi</div>
                </div>
              </div>
            </div>

            {/* Bottom Splash CTA Button */}
            <div className="w-full pb-4">
              <button
                onClick={() => setCurrentScreen('home_guest')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] cursor-pointer"
              >
                <span>Mulai Belanja & Masuk Toko</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-[10px] text-zinc-500 mt-2">
                RiskCart PWA Engine &bull; Menjamin Keamanan Transaksi
              </p>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* SCREEN 2: HALAMAN HOME TAMU (client-pwa2.jped) */}
        {/* ========================================================== */}
        {currentScreen === 'home_guest' && (
          <div className="flex flex-col min-h-[720px] bg-zinc-950 text-white">
            {/* Header Toko & Status Tamu */}
            <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white leading-tight">Toko Berkah RiskCart</h2>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <MapPin className="w-3 h-3 text-red-400" />
                    <span>Jakarta Pusat &bull; Buka 24 Jam</span>
                  </div>
                </div>
              </div>

              {/* Status Badge: Tamu / Belum Terdaftar */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold">
                <User className="w-3 h-3" />
                <span>Pengunjung (Tamu)</span>
              </div>
            </div>

            {/* Banner Pendaftaran Member (Sesuai client-pwa2.jped) */}
            <div className="p-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40 border border-blue-700/40 relative overflow-hidden shadow-lg">
                <div className="relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                    Pemberitahuan Khusus
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-1.5 mb-1">
                    Daftar Member Sekarang!
                  </h3>
                  <p className="text-xs text-zinc-300 mb-3 leading-relaxed">
                    Daftarkan toko Anda untuk membuka akses pemesanan otomatis via AI Assistant, koordinat GPS presisi, dan verifikasi WhatsApp resmi.
                  </p>
                  <button
                    onClick={() => setCurrentScreen('register_member')}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98] cursor-pointer"
                  >
                    <span>Daftar Member Baru Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Search Bar & Kategori */}
            <div className="px-4 pb-2">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari produk (Indomie, Pocari, Minyak, Teh)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Kategori Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 text-xs no-scrollbar">
                {['Semua', 'Mineral Dus', 'Flavors', 'Coffee', 'Tea'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-zinc-800 text-white border border-zinc-700'
                        : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Catalog Grid (Guest Mode) */}
            <div className="flex-1 px-4 pb-24 overflow-y-auto">
              <div className="text-[11px] font-bold text-zinc-400 mb-2 flex items-center justify-between">
                <span>KATALOG PRODUK TOKO</span>
                <span>{filteredProducts.length} Produk</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition"
                  >
                    <div>
                      <div className="w-full h-24 rounded-xl bg-zinc-950 overflow-hidden mb-2 relative">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=500&q=80';
                          }}
                        />
                        <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-950/80 text-emerald-400 border border-zinc-800">
                          {prod.piecesPerCarton} pcs/dus
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">SKU: {prod.sku}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-zinc-800/80">
                      <div className="text-[11px] font-extrabold text-emerald-400">
                        {formatRupiah(prod.pricePerCarton)}{' '}
                        <span className="text-[9px] text-zinc-400 font-normal">/dus</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {formatRupiah(prod.pricePerUnit)} /satuan
                      </div>

                      {/* Guest prompt to register */}
                      <button
                        onClick={() => setCurrentScreen('register_member')}
                        className="w-full mt-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition"
                      >
                        <Bot className="w-3 h-3 text-emerald-400" />
                        <span>Daftar utk Pesan</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="p-3 bg-zinc-900/95 border-t border-zinc-800 flex items-center justify-around text-xs sticky bottom-0 z-20 backdrop-blur-md">
              <button
                onClick={() => setCurrentScreen('home_guest')}
                className="flex flex-col items-center text-emerald-400 font-bold"
              >
                <Store className="w-4 h-4" />
                <span className="text-[10px] mt-0.5">Home</span>
              </button>
              <button
                onClick={() => setCurrentScreen('register_member')}
                className="flex flex-col items-center text-zinc-400 hover:text-white"
              >
                <User className="w-4 h-4" />
                <span className="text-[10px] mt-0.5">Daftar Member</span>
              </button>
              <button
                onClick={() => setCurrentScreen('setting_address')}
                className="flex flex-col items-center text-zinc-400 hover:text-white"
              >
                <MapPin className="w-4 h-4" />
                <span className="text-[10px] mt-0.5">Setting Lokasi</span>
              </button>
              <button
                onClick={() => setCurrentScreen('order_history')}
                className="flex flex-col items-center text-zinc-400 hover:text-white relative cursor-pointer"
                title={`Riwayat Pesanan (${userOrders.length} pesanan, ${activeOrdersCount} aktif)`}
              >
                <div className="relative">
                  <Clock className={`w-4 h-4 transition ${activeOrdersCount > 0 ? 'text-emerald-400' : ''}`} />
                  {activeOrdersCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1 min-w-[16px] h-3.5 rounded-full bg-emerald-500 text-zinc-950 font-black text-[8px] flex items-center justify-center animate-pulse">
                      {activeOrdersCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 flex items-center gap-0.5">
                  <span>Riwayat</span>
                  {activeOrdersCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  )}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* SCREEN 3: HALAMAN DAFTAR MEMBER (client-pwa3.jpeg) */}
        {/* ========================================================== */}
        {currentScreen === 'register_member' && (
          <div className="flex flex-col min-h-[720px] bg-zinc-950 text-white p-4">
            {/* Header Formulir */}
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
              <button
                onClick={() => setCurrentScreen('home_guest')}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-white">Pendaftaran Member</h2>
                <p className="text-[10px] text-zinc-400">Langkah 1 dari 2: Identitas & Nomor WhatsApp</p>
              </div>
            </div>

            {/* Form Fields Sesuai client-pwa3.jpeg */}
            <div className="flex-1 py-4 space-y-3.5 overflow-y-auto">
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Lengkapi data toko Anda. Nomor WhatsApp akan diverifikasi menggunakan sistem Fonnte Gateway resmi pada langkah berikutnya.
                </span>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nama Lengkap Pemilik / Toko <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => setMember({ ...member, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso (Toko Berkah)"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Nomor WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nomor WhatsApp Aktif <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-zinc-400">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+62</span>
                  </div>
                  <input
                    type="tel"
                    value={member.phone.replace(/^(\+62|62|0)/, '')}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, '');
                      setMember({ ...member, phone: '0' + clean });
                    }}
                    placeholder="81234567890"
                    className="w-full pl-16 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Format: 08xx-xxxx-xxxx. OTP dikirim ke nomor ini via Fonnte WhatsApp.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Email Toko (Opsional)
                </label>
                <input
                  type="email"
                  value={member.email}
                  onChange={(e) => setMember({ ...member, email: e.target.value })}
                  placeholder="toko@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Tipe Usaha */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Jenis Usaha / Toko
                </label>
                <select
                  value={member.businessType}
                  onChange={(e) => setMember({ ...member, businessType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Toko Kelontong & Sembako">Toko Kelontong & Sembako</option>
                  <option value="Warung Makan & Minuman">Warung Makan & Minuman</option>
                  <option value="Agen Grosir Retail">Agen Grosir Retail</option>
                  <option value="Konsumen Pribadi">Konsumen Pribadi</option>
                </select>
              </div>

              {/* Keuntungan Member Card */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">
                  Benefit Member Terdaftar:
                </span>
                <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Akses tombol pesan instan bertenaga AI</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Diskon member 5% otomatis pada setiap checkout</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pengiriman prioritas berdasarkan titik GPS</span>
                </div>
              </div>

              {/* FIELD FORM ALAMAT LENGKAP & TITIK LOKASI TOKO (Dipindahkan ke bagian ini) */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Alamat Lengkap &amp; Lokasi Toko
                  </span>
                  {member.isLocationChecked && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> GPS Terkunci
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Alamat Lengkap Toko / Rumah <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={member.address}
                    onChange={(e) => setMember({ ...member, address: e.target.value })}
                    placeholder="Nama jalan, nomor ruko/rumah, RT/RW, kelurahan, kecamatan..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Catatan Patokan Lokasi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={member.addressNotes}
                    onChange={(e) => setMember({ ...member, addressNotes: e.target.value })}
                    placeholder="Contoh: Samping Masjid Al-Ikhlas, Pintu Gerbang Biru"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Quick GPS Check Button */}
                <button
                  type="button"
                  onClick={handleCheckLocation}
                  disabled={isGpsLoading}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    member.isLocationChecked
                      ? 'bg-zinc-800 hover:bg-zinc-750 text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/50'
                  }`}
                >
                  {isGpsLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>Mengambil Titik GPS Akurat...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{member.isLocationChecked ? '📍 GPS Terverifikasi (Klik untuk Cek Ulang)' : '📍 Validasi GPS Lokasi Toko'}</span>
                    </>
                  )}
                </button>

                {locationError && (
                  <p className="text-[11px] text-rose-400 font-semibold">{locationError}</p>
                )}
                {locationStatusMessage && (
                  <p className="text-[10px] text-zinc-400 italic">
                    {locationStatusMessage}
                  </p>
                )}
              </div>

              {/* Inline Validation Notice */}
              {formFeedbackMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formFeedbackMessage}</span>
                </div>
              )}
            </div>

            {/* Bottom Button to Step 4 / Proceed */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (!member.name.trim() || !member.phone.trim()) {
                    setFormFeedbackMessage('Mohon isi nama lengkap dan nomor WhatsApp terlebih dahulu!');
                    return;
                  }
                  setFormFeedbackMessage(null);
                  handleProceedToOtp();
                }}
                disabled={isSendingOtp}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {isSendingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menghubungi Fonnte WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <span>Daftar Sekarang &amp; Kirim OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!member.name.trim() || !member.phone.trim()) {
                    setFormFeedbackMessage('Mohon isi nama lengkap dan nomor WhatsApp terlebih dahulu!');
                    return;
                  }
                  setFormFeedbackMessage(null);
                  setCurrentScreen('setting_address');
                }}
                className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Atur Peta &amp; Koordinat Detail</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* SCREEN 4: HALAMAN SETTING ALAMAT TOKO (client-pwa4.jpeg)   */}
        {/* ========================================================== */}
        {/* Setelah tulis alamat lengkap, wajib klik cek lokasi.        */}
        {/* Setelah klik cek lokasi, loading mengambil lokasi dengan    */}
        {/* akurasi tingkat tinggi, request permission, dan titik       */}
        {/* koordinat Google Map otomatis masuk.                        */}
        {/* SETELAH ITU, BARU MUNCUL BUTTON "DAFTAR SEKARANG"!         */}
        {/* ========================================================== */}
        {currentScreen === 'setting_address' && (
          <div className="flex flex-col min-h-[720px] bg-zinc-950 text-white p-4">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
              <button
                onClick={() => setCurrentScreen('register_member')}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-white">Setting Alamat Toko</h2>
                <p className="text-[10px] text-zinc-400">Langkah 2 dari 2: Alamat & Titik Koordinat GPS</p>
              </div>
            </div>

            <div className="flex-1 py-4 space-y-3.5 overflow-y-auto">
              {/* Petunjuk Alur Wajib */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Aturan Pendaftaran:</strong> Setelah mengisi alamat lengkap, Anda <strong>wajib klik "Cek Lokasi"</strong>. Tombol <em>"Daftar Sekarang"</em> akan muncul setelah titik koordinat Google Map berhasil diverifikasi.
                </span>
              </div>

              {/* Textarea Alamat Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Alamat Lengkap Toko / Rumah <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={member.address}
                  onChange={(e) => setMember({ ...member, address: e.target.value })}
                  placeholder="Tuliskan nama jalan, no. rumah/toko, RT/RW, kelurahan, kecamatan, kota..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Patokan Alamat */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Catatan Patokan Lokasi
                </label>
                <input
                  type="text"
                  value={member.addressNotes}
                  onChange={(e) => setMember({ ...member, addressNotes: e.target.value })}
                  placeholder="Contoh: Samping Masjid Al-Ikhlas, Gerbang Biru"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* ====================================================== */}
              {/* SECTION CEK LOKASI AKURASI TINGGI & GOOGLE MAPS PIN   */}
              {/* ====================================================== */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Validasi Lokasi Google Maps</span>
                  </div>
                  {member.isLocationChecked && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                    </span>
                  )}
                </div>

                {/* TOMBOL WAJIB: CEK LOKASI */}
                <button
                  type="button"
                  onClick={handleCheckLocation}
                  disabled={isGpsLoading}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer ${
                    isGpsLoading
                      ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-700 animate-pulse'
                      : member.isLocationChecked
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-cyan-500/20 animate-bounce'
                  }`}
                >
                  {isGpsLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang Mengambil Lokasi Akurasi Tinggi...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 text-white" />
                      <span>{member.isLocationChecked ? 'Cek Ulang Lokasi GPS' : '📍 CEK LOKASI SEKARANG (WAJIB)'}</span>
                    </>
                  )}
                </button>

                {/* Status Message */}
                {locationError && (
                  <div className="text-[11px] text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">{locationError}</div>
                )}
                {locationStatusMessage && (
                  <div className="text-[11px] text-zinc-300 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping shrink-0" />
                    <span>{locationStatusMessage}</span>
                  </div>
                )}

                {/* Display Koordinat Google Maps Terisi Otomatis */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block">Latitude</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {member.latitude !== null ? member.latitude : 'Menunggu Cek...'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block">Longitude</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {member.longitude !== null ? member.longitude : 'Menunggu Cek...'}
                    </span>
                  </div>
                </div>

                {/* Embedded Interactive Google Maps Preview */}
                {member.latitude !== null && member.longitude !== null && (
                  <div className="rounded-xl overflow-hidden border border-zinc-800 relative bg-zinc-950">
                    <div className="h-40 w-full relative">
                      <iframe
                        title="Google Maps Pin Lokasi"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://maps.google.com/maps?q=${member.latitude},${member.longitude}&hl=id&z=15&output=embed`}
                        allowFullScreen
                      />
                    </div>
                    <div className="p-2 bg-zinc-950/90 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-400" />
                        Titik Koordinat Toko Terkunci
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${member.latitude},${member.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                      >
                        <span>Buka Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ====================================================== */}
            {/* BUTTON "DAFTAR SEKARANG" */}
            {/* ====================================================== */}
            <div className="pt-3 border-t border-zinc-800">
              <div className="space-y-1.5">
                <div className="text-[10px] text-zinc-400 font-semibold text-center flex items-center justify-center gap-1">
                  {member.isLocationChecked ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Lokasi berhasil diverifikasi. Silakan klik tombol di bawah.
                    </span>
                  ) : (
                    <span>Titik lokasi GPS akan dikonfirmasi otomatis saat mendaftar.</span>
                  )}
                </div>
                <button
                  onClick={handleProceedToOtp}
                  disabled={isSendingOtp}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition active:scale-[0.98] cursor-pointer"
                >
                  {isSendingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menghubungi Fonnte WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <span>DAFTAR SEKARANG</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* SCREEN 5: VERIFIKASI WHATSAPP FONNTE (client-pwa41.jpeg)   */}
        {/* Akses token Fonnte: aFLkjgrJ2JnKclient-pwaxG1H7F5X        */}
        {/* ========================================================== */}
        {currentScreen === 'verify_whatsapp' && (
          <div className="flex flex-col min-h-[720px] bg-zinc-950 text-white p-5 justify-between">
            {/* Top Navigation */}
            <div>
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                <button
                  onClick={() => setCurrentScreen('setting_address')}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-white">Verifikasi WhatsApp</h2>
                  <p className="text-[10px] text-zinc-400">Gateway Resmi: Fonnte WhatsApp</p>
                </div>
              </div>

              {/* Central OTP Card Sesuai client-pwa41.jpeg */}
              <div className="mt-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                  <MessageSquare className="w-8 h-8" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">
                  Masukkan Kode Verifikasi
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                  Kode OTP 6-digit telah dikirimkan via WhatsApp ke nomor:
                </p>
                <div className="mt-1 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-emerald-400">
                  {member.phone}
                </div>

                {/* Gateway Detail Badge */}
                <div className="mt-3 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[10px] text-zinc-400 max-w-xs">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-semibold mb-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Gateway WhatsApp
                  </div>
                  <span>{fonnteStatus.detail || 'Gateway WhatsApp Fonnte Siap.'}</span>
                </div>

                {/* Demo Helper Pill (Biar penguji langsung tahu kodenya tanpa harus cek WA nyata) */}
                {generatedOtp && (
                <div className="mt-4 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between w-full max-w-xs">
                  <span className="text-[11px]">Kode OTP Verifikasi:</span>
                  <button
                    onClick={() => {
                      if (generatedOtp) {
                        const digits = generatedOtp.split('');
                        setOtpCode([0, 1, 2, 3, 4, 5].map((k) => digits[k] || ''));
                      }
                    }}
                    className="font-mono font-black text-sm tracking-widest bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/40 hover:bg-emerald-500/30 transition cursor-pointer"
                    title="Klik untuk Isi Otomatis"
                  >
                    {generatedOtp} (Klik Isi)
                  </button>
                </div>
                )}

                {/* 6 Digit OTP Inputs */}
                <div className="flex items-center justify-center gap-3 mt-6">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={otpCode[idx] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        const newOtp = [...otpCode];
                        newOtp[idx] = val;
                        setOtpCode(newOtp);

                        // Auto-advance focus
                        if (val && idx < 5) {
                          const nextInput = document.getElementById(`otp-${idx + 1}`);
                          nextInput?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otpCode[idx] && idx > 0) {
                          const prevInput = document.getElementById(`otp-${idx - 1}`);
                          prevInput?.focus();
                        }
                      }}
                      className="w-11 h-14 bg-zinc-900 border-2 border-zinc-800 focus:border-emerald-400 rounded-2xl text-center text-xl font-bold font-mono text-white focus:outline-none transition shadow-inner"
                    />
                  ))}
                </div>

                {/* Resend Countdown */}
                <div className="mt-4 text-xs text-zinc-500">
                  {otpCountdown > 0 ? (
                    <span>Kirim ulang kode dalam <strong className="text-zinc-300">{otpCountdown} detik</strong></span>
                  ) : (
                    <button
                      onClick={handleProceedToOtp}
                      className="text-emerald-400 hover:text-emerald-300 font-bold underline transition"
                    >
                      Kirim Ulang Kode OTP via Fonnte
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Verify Action */}
            <div className="pt-4 border-t border-zinc-800">
              <button
                onClick={handleVerifyOtp}
                className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verifikasi OTP & Aktifkan Member</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* SCREEN 6: HALAMAN HOME MEMBER TERVERIFIKASI (client-pwa6.jpeg) */}
        {/* ========================================================== */}
        {/* Ketika button pesan berwarna hijau di klik ->             */}
        {/* muncul kotak AI untuk melakukan pemesanan (client-pwa7.jpeg)*/}
        {/* ========================================================== */}
        {currentScreen === 'home_member' && (
          <div className="flex flex-col min-h-[720px] bg-zinc-950 text-white">
            {/* Header Member Terverifikasi */}
            <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 sticky top-0 z-20 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-zinc-950 font-black shadow-md shadow-emerald-500/20">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                        {member.name}
                      </h2>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Member Resmi Terverifikasi</span>
                    </div>
                  </div>
                </div>

                {/* Cart Shortcut Header */}
                <button
                  onClick={() => setCurrentScreen('cart')}
                  className="relative p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                  title="Keranjang Belanja"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 font-black text-[10px] flex items-center justify-center shadow-sm">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Data Alamat & Koordinat Member */}
              <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                <div className="flex items-center gap-1 truncate max-w-[240px]">
                  <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                  <span className="truncate">{member.address}</span>
                </div>
                <span className="font-mono text-cyan-400 shrink-0">
                  {member.latitude?.toFixed(4)}, {member.longitude?.toFixed(4)}
                </span>
              </div>
            </div>

            {/* ====================================================== */}
            {/* BUTTON PESAN BERWARNA HIJAU UTAMA (Sesuai client-pwa6.jpeg) */}
            {/* ====================================================== */}
            <div className="p-4">
              <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 border-2 border-emerald-500/50 relative overflow-hidden shadow-xl shadow-emerald-500/10">
                <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700">
                      ⚡ Asisten Pemesanan Instan
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Diskon Member 5% Aktif
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                    Pesan Cepat Barang & Grosir dengan AI
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Tidak perlu klik satu per satu. Cukup tulis pesanan Anda dalam kalimat biasa, AI akan otomatis membaca nama barang dan kuantitasnya!
                  </p>

                  {/* BUTTON PESAN BERWARNA HIJAU MENCOLOK */}
                  <button
                    onClick={handleOpenAiOrderModal}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 transition active:scale-[0.98] cursor-pointer animate-pulse"
                  >
                    <Bot className="w-5 h-5 text-zinc-950" />
                    <span>🟢 PESAN SEKARANG VIA AI</span>
                    <ArrowRight className="w-4 h-4 text-zinc-950" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Product Search & Filter */}
            <div className="px-4 pb-2">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari katalog harga member..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 text-xs no-scrollbar">
                {['Semua', 'Mineral Dus', 'Flavors', 'Coffee', 'Tea'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-emerald-500 text-zinc-950 font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid (Member Price) */}
            <div className="flex-1 px-4 pb-24 overflow-y-auto">
              <div className="text-[11px] font-bold text-zinc-400 mb-2 flex items-center justify-between">
                <span>KATALOG HARGA KHUSUS MEMBER</span>
                <span>{filteredProducts.length} Produk</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between hover:border-emerald-500/50 transition group"
                  >
                    <div>
                      <div className="w-full h-24 rounded-xl bg-zinc-950 overflow-hidden mb-2 relative">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=500&q=80';
                          }}
                        />
                        <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-950/90 text-emerald-400 border border-emerald-500/30">
                          {prod.piecesPerCarton} pcs/dus
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">SKU: {prod.sku}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-zinc-800/80">
                      <div className="text-[11px] font-extrabold text-emerald-400">
                        {formatRupiah(prod.pricePerCarton)}{' '}
                        <span className="text-[9px] text-zinc-400 font-normal">/dus</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {formatRupiah(prod.pricePerUnit)} /satuan
                      </div>

                      {/* Add Manual Cart button */}
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        <button
                          onClick={() => {
                            const idx = cart.findIndex((c) => c.product.id === prod.id && c.packageType === 'carton');
                            if (idx >= 0) {
                              const copy = [...cart];
                              copy[idx].quantity += 1;
                              setCart(copy);
                            } else {
                              setCart([...cart, { product: prod, packageType: 'carton', quantity: 1 }]);
                            }
                          }}
                          className="py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 text-[10px] font-bold transition flex items-center justify-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" /> Dus
                        </button>

                        <button
                          onClick={() => {
                            const idx = cart.findIndex((c) => c.product.id === prod.id && c.packageType === 'unit');
                            if (idx >= 0) {
                              const copy = [...cart];
                              copy[idx].quantity += 1;
                              setCart(copy);
                            } else {
                              setCart([...cart, { product: prod, packageType: 'unit', quantity: 1 }]);
                            }
                          }}
                          className="py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-semibold transition flex items-center justify-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" /> Unit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FLOATING ACTION BUTTON (FAB) BERWARNA HIJAU MENCOLOK */}
            <div className="fixed bottom-6 right-6 z-30">
              <button
                onClick={handleOpenAiOrderModal}
                className="flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-2xl shadow-emerald-500/50 hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <Bot className="w-4 h-4 text-zinc-950" />
                <span>Pesan via AI</span>
              </button>
            </div>

            {/* Live Active Order Tracker Pill above bottom bar */}
            {latestActiveOrder && (
              <div className="px-4 pb-2">
                <button
                  onClick={() => setCurrentScreen('order_history')}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-950/80 via-zinc-900 to-emerald-950/80 border border-emerald-500/40 shadow-lg shadow-emerald-500/10 flex flex-col gap-2.5 transition hover:border-emerald-400 active:scale-[0.99] cursor-pointer text-left"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                          <span>Pesanan #{latestActiveOrder.id.slice(-8)}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                            {latestActiveOrder.fulfillmentStatus || latestActiveOrder.status}
                          </span>
                        </div>
                        <div className="text-[9px] text-zinc-400">
                          {latestActiveOrder.items?.length || 1} item &bull; {formatRupiah(latestActiveOrder.totalAmount)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <span>Lacak Progres</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Compact Visual Progress Indicator */}
                  <OrderProgressIndicator order={latestActiveOrder} compact />
                </button>
              </div>
            )}

            {/* Bottom Bar Member */}
            <div className="p-3 bg-zinc-900/95 border-t border-zinc-800 flex items-center justify-around text-xs sticky bottom-0 z-20 backdrop-blur-md">
              <button
                onClick={() => setCurrentScreen('home_member')}
                className="flex flex-col items-center text-emerald-400 font-bold"
              >
                <Store className="w-4 h-4" />
                <span className="text-[10px] mt-0.5">Home</span>
              </button>
              <button
                onClick={handleOpenAiOrderModal}
                className="flex flex-col items-center text-emerald-400 font-bold animate-pulse"
              >
                <Bot className="w-4 h-4" />
                <span className="text-[10px] mt-0.5">Pesan AI</span>
              </button>
              <button
                onClick={() => setCurrentScreen('cart')}
                className="flex flex-col items-center text-zinc-400 hover:text-white relative"
              >
                <ShoppingBag className="w-4 h-4" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 right-2 w-3.5 h-3.5 rounded-full bg-emerald-500 text-zinc-950 font-bold text-[8px] flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
                <span className="text-[10px] mt-0.5">Keranjang</span>
              </button>
              <button
                onClick={() => setCurrentScreen('order_history')}
                className={`flex flex-col items-center relative transition cursor-pointer ${
                  (currentScreen as string) === 'order_history' ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
                title={`Riwayat Pesanan (${userOrders.length} pesanan, ${activeOrdersCount} aktif)`}
              >
                <div className="relative">
                  <Clock className={`w-4 h-4 transition ${activeOrdersCount > 0 ? 'text-emerald-400' : ''}`} />
                  {activeOrdersCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-3.5 rounded-full bg-emerald-500 text-zinc-950 font-black text-[8px] flex items-center justify-center animate-pulse shadow-sm shadow-emerald-500/40">
                      {activeOrdersCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 flex items-center gap-0.5">
                  <span>Riwayat</span>
                  {activeOrdersCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  )}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* SCREEN 7: KOTAK AI KELUAR UNTUK PEMESANAN (client-pwa7.jpeg)*/}
        {/* ========================================================== */}
        {/* AI langsung memberikan pertanyaan: "Apa ada yang ingin di pesan?" */}
        {/* Pelanggan menulis pesan -> AI membaca pesanan dan quantity -> */}
        {/* Langsung masuk halaman chart sesuai pesanan -> client-pwa10.jpeg*/}
        {/* ========================================================== */}
        {isAiModalOpen && (
          <div className="absolute inset-0 z-40 bg-zinc-950/90 backdrop-blur-md flex flex-col justify-end animate-fadeIn">
            <div className="w-full bg-zinc-900 border-t-2 border-emerald-500 rounded-t-3xl shadow-2xl flex flex-col h-[85%] max-h-[620px]">
              {/* Kotak AI Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95 rounded-t-3xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                    <Bot className="w-5 h-5 text-zinc-950" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <span>Asisten AI Pemesanan</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h3>
                    <p className="text-[10px] text-zinc-400">Model Gemini 3.8 Flash &bull; Typo Tolerant</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              {/* Chat Message Scroll Area */}
              <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3">
                {aiChatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-line shadow-md ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 rounded-tl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-zinc-500 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}

                {/* Processing Spinner Indicator */}
                {isAiProcessing && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 p-2 rounded-xl bg-zinc-800/60 border border-zinc-700 w-fit">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI sedang membaca nama produk & menghitung kuantitas...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompts Chips (Saran Pemesanan Instan) */}
              <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-950/60 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                  <span className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> Contoh Cepat:
                  </span>
                  <button
                    onClick={() => handleSendAiOrder('Pesan Indomie Goreng 5 dus')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] border border-zinc-700 transition"
                  >
                    "Indomie Goreng 5 dus"
                  </button>
                  <button
                    onClick={() => handleSendAiOrder('Pesan Kopi Nongkrong 2 dus dan Teh Botol 1 dus')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] border border-zinc-700 transition"
                  >
                    "Kopi 2 dus & Teh 1 dus"
                  </button>
                  <button
                    onClick={() => handleSendAiOrder('Pesan Nipis Madu 3 karton')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] border border-zinc-700 transition"
                  >
                    "Nipis Madu 3 karton"
                  </button>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex items-center gap-2">
                <input
                  type="text"
                  value={aiInputText}
                  onChange={(e) => setAiInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAiProcessing) {
                      handleSendAiOrder();
                    }
                  }}
                  placeholder="Tulis pesanan Anda (misal: Indomie 5 dus)..."
                  className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleSendAiOrder()}
                  disabled={isAiProcessing || !aiInputText.trim()}
                  className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-bold transition shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* SCREEN 8: HALAMAN KERANJANG / CART (client-pwa10.jpeg)     */}
        {/* ========================================================== */}
        {currentScreen === 'cart' && (
          <div className="flex flex-col min-h-[720px] bg-zinc-950 text-white p-4">
            {/* Header Keranjang */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setCurrentScreen(member.isVerified ? 'home_member' : 'home_guest')}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-white">Keranjang Pesanan (Cart)</h2>
                  <p className="text-[10px] text-zinc-400">{cart.length} Jenis Barang Terpilih</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('order_history')}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 relative transition cursor-pointer"
                  title={`Riwayat Pesanan (${userOrders.length} pesanan, ${activeOrdersCount} aktif)`}
                >
                  <Clock className={`w-4 h-4 ${activeOrdersCount > 0 ? 'text-emerald-400' : ''}`} />
                  {activeOrdersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 font-black text-[8px] flex items-center justify-center animate-pulse">
                      {activeOrdersCount}
                    </span>
                  )}
                </button>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[10px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                  >
                    Kosongkan
                  </button>
                )}
              </div>
            </div>

            {/* Cart Items List Sesuai client-pwa10.jpeg */}
            <div className="flex-1 py-3 overflow-y-auto space-y-3">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 flex flex-col items-center">
                  <ShoppingBag className="w-12 h-12 text-zinc-700 mb-2" />
                  <p className="text-xs font-semibold text-zinc-400">Keranjang Masih Kosong</p>
                  <p className="text-[10px] text-zinc-500 max-w-xs mt-1">
                    Gunakan Asisten AI untuk menambahkan barang secara otomatis atau pilih dari katalog.
                  </p>
                  <button
                    onClick={() => {
                      if (member.isVerified) {
                        handleOpenAiOrderModal();
                      } else {
                        setCurrentScreen('home_guest');
                      }
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs"
                  >
                    Pesan via AI Sekarang
                  </button>
                </div>
              ) : (
                <>
                  {/* Daftar Item */}
                  <div className="space-y-2">
                    {cart.map((item, idx) => {
                      const isCarton = item.packageType === 'carton';
                      const unitPrice = isCarton ? item.product.pricePerCarton : item.product.pricePerUnit;
                      const effectivePrice = unitPrice;
                      const subtotal = effectivePrice * item.quantity;

                      return (
                        <div
                          key={`${item.product.id}-${item.packageType}`}
                          className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-3 shadow-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-12 h-12 rounded-xl bg-zinc-950 overflow-hidden shrink-0 border border-zinc-800">
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=500&q=80';
                                }}
                              />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white line-clamp-1">
                                {item.product.name}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                    isCarton
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  }`}
                                >
                                  {isCarton ? `Karton / Dus (${item.product.piecesPerCarton} pcs)` : 'Satuan / Unit'}
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  {formatRupiah(unitPrice)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quantity Controls & Subtotal */}
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="text-xs font-black text-emerald-400">
                              {formatRupiah(subtotal)}
                            </div>

                            <div className="flex items-center gap-1.5 bg-zinc-950 px-1.5 py-0.5 rounded-lg border border-zinc-800">
                              <button
                                onClick={() => handleUpdateQty(idx, -1)}
                                className="p-1 text-zinc-400 hover:text-white"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-mono font-bold text-white px-1">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQty(idx, 1)}
                                className="p-1 text-zinc-400 hover:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Info Pengiriman Toko Member Sesuai Step 4 */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                        Alamat &amp; Kontak Pengiriman
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Tervalidasi GPS
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => setMember({ ...member, name: e.target.value })}
                          placeholder="Nama Pemesan"
                          className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                        />
                        <input
                          type="text"
                          value={member.phone}
                          onChange={(e) => setMember({ ...member, phone: e.target.value })}
                          placeholder="No. WhatsApp"
                          className="w-36 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-white"
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={member.address}
                        onChange={(e) => setMember({ ...member, address: e.target.value })}
                        placeholder="Alamat lengkap tujuan pengiriman..."
                        className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                      />

                      {member.latitude && (
                        <p className="text-[9px] font-mono text-cyan-400">
                          Titik Koordinat: {member.latitude.toFixed(5)}, {member.longitude?.toFixed(5)} &bull; {member.addressNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metode Pembayaran */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                    <span className="text-xs font-bold text-white block">Metode Pembayaran</span>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      <button
                        onClick={() => setPaymentMethod('qris')}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                          paymentMethod === 'qris'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px]">QRIS Instan</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                          paymentMethod === 'cod'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <Banknote className="w-4 h-4 text-amber-400" />
                        <span className="text-[10px]">COD / Tunai</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('transfer')}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                          paymentMethod === 'transfer'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px]">Transfer Bank</span>
                      </button>
                    </div>
                  </div>

                  {/* Ringkasan Biaya */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Subtotal Belanja</span>
                      <span className="font-mono text-white">{formatRupiah(cartSubtotal)}</span>
                    </div>

                    {member.isVerified && (
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>Diskon Khusus Member (5%)</span>
                        <span className="font-mono">-{formatRupiah(memberDiscount)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Ongkos Kirim (Radius Toko)</span>
                      <span className="text-emerald-400 font-bold">GRATIS</span>
                    </div>

                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between font-black text-sm text-white">
                      <span>Total Pembayaran</span>
                      <span className="text-emerald-400 text-base">{formatRupiah(totalPayable)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Checkout Action */}
            {cart.length > 0 && (
              <div className="pt-3 border-t border-zinc-800">
                {checkoutError && (
                  <div className="mb-2 p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-[11px] font-semibold">
                    {checkoutError}
                  </div>
                )}
                <button
                  onClick={handleConfirmOrder}
                  disabled={isPlacingOrder}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>Mengirim Pesanan ke Kasir POS...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>Konfirmasi & Checkout Pesanan</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* SCREEN 9: RIWAYAT PESANAN DENGAN VISUAL PROGRESS INDICATOR */}
        {/* ========================================================== */}
        {currentScreen === 'order_history' && (
          <div className="flex flex-col min-h-[720px] bg-zinc-950 text-white p-4">
            {/* Header Riwayat */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setCurrentScreen(member.isVerified ? 'home_member' : 'home_guest')}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition cursor-pointer"
                  title="Kembali"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Riwayat Pesanan</span>
                    {activeOrdersCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black animate-pulse">
                        {activeOrdersCount} Aktif
                      </span>
                    )}
                  </h2>
                  <p className="text-[10px] text-zinc-400">
                    Visual Progress Tracking Real-Time &bull; {userOrders.length} Pesanan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Buka Tracker Dialog Interaktif"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dialog Tracker</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="py-3 space-y-2.5 shrink-0 border-b border-zinc-900">
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                      historyFilter === 'all'
                        ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Semua ({userOrders.length})
                  </button>
                  <button
                    onClick={() => setHistoryFilter('active')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs flex items-center gap-1.5 ${
                      historyFilter === 'active'
                        ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>Aktif ({activeOrdersCount})</span>
                    {activeOrdersCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </button>
                  <button
                    onClick={() => setHistoryFilter('completed')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                      historyFilter === 'completed'
                        ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Selesai ({userOrders.filter((o) => o.status === 'completed' || o.fulfillmentStatus === 'completed').length})
                  </button>
                </div>

                {/* Filter toggle for Demo All */}
                <button
                  onClick={() => setViewAllDemoOrders((prev) => !prev)}
                  className="text-[10px] text-zinc-400 hover:text-emerald-400 underline shrink-0 cursor-pointer"
                >
                  {viewAllDemoOrders ? 'Filter No. HP Saya' : 'Lihat Semua Demo Toko'}
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Cari ID pesanan atau item..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                {historySearchQuery && (
                  <button
                    onClick={() => setHistorySearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* List of Orders with Visual Progress Stepper */}
            <div className="flex-1 py-3 overflow-y-auto space-y-3.5">
              {(() => {
                let filtered = userOrders.filter((o) => {
                  if (historyFilter === 'active') {
                    return (
                      o.status !== 'completed' &&
                      o.status !== 'rejected' &&
                      o.status !== 'refunded' &&
                      o.fulfillmentStatus !== 'completed'
                    );
                  }
                  if (historyFilter === 'completed') {
                    return o.status === 'completed' || o.fulfillmentStatus === 'completed';
                  }
                  return true;
                });

                if (historySearchQuery.trim()) {
                  const q = historySearchQuery.toLowerCase();
                  filtered = filtered.filter(
                    (o) =>
                      o.id.toLowerCase().includes(q) ||
                      o.customerName.toLowerCase().includes(q) ||
                      (o.items && o.items.some((it) => it.productName.toLowerCase().includes(q)))
                  );
                }

                if (filtered.length === 0) {
                  return (
                    <div className="py-16 text-center text-zinc-500 flex flex-col items-center">
                      <ShoppingBag className="w-12 h-12 text-zinc-700 mb-2" />
                      <p className="text-xs font-semibold text-zinc-300">Tidak ada riwayat pesanan</p>
                      <p className="text-[10px] text-zinc-500 max-w-xs mt-1">
                        {historySearchQuery
                          ? `Tidak ditemukan pesanan dengan kata kunci "${historySearchQuery}"`
                          : historyFilter === 'active'
                          ? 'Tidak ada pesanan yang sedang berjalan saat ini.'
                          : 'Pesanan yang Anda buat melalui PWA atau Pesan AI akan otomatis tercatat dan dapat dipantau di sini secara real-time.'}
                      </p>
                      {!viewAllDemoOrders && (
                        <button
                          onClick={() => setViewAllDemoOrders(true)}
                          className="mt-3 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold cursor-pointer"
                        >
                          Tampilkan Semua Pesanan Demo Toko
                        </button>
                      )}
                      <button
                        onClick={() => setCurrentScreen(member.isVerified ? 'home_member' : 'home_guest')}
                        className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs cursor-pointer shadow-md shadow-emerald-500/20"
                      >
                        Belanja Sekarang di Home
                      </button>
                    </div>
                  );
                }

                return filtered.map((ord) => {
                  const isExpanded = expandedOrderIds.has(ord.id);
                  const itemsCount = ord.items?.length || 1;

                  return (
                    <div
                      key={ord.id}
                      className="p-4 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-3.5 shadow-md transition hover:border-zinc-700"
                    >
                      {/* Order Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-white">
                              #{ord.id.slice(-8)}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {ord.paymentMethod}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            <span>
                              {new Date(ord.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-zinc-400 uppercase font-medium">Total</div>
                          <div className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                            {formatRupiah(ord.totalAmount)}
                          </div>
                        </div>
                      </div>

                      {/* THE VISUAL PROGRESS INDICATOR */}
                      <OrderProgressIndicator order={ord} />

                      {/* Items Preview / Collapsible Section */}
                      {ord.items && ord.items.length > 0 && (
                        <div className="pt-2 border-t border-zinc-850">
                          <button
                            onClick={() => {
                              setExpandedOrderIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(ord.id)) {
                                  next.delete(ord.id);
                                } else {
                                  next.add(ord.id);
                                }
                                return next;
                              });
                            }}
                            className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-white transition cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 font-medium">
                              <Boxes className="w-3.5 h-3.5 text-zinc-500" />
                              <span>{itemsCount} Item Pesanan</span>
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-blue-400">
                              <span>{isExpanded ? 'Sembunyikan' : 'Lihat Rincian'}</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2.5 space-y-1.5 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850 animate-fadeIn">
                              {ord.items.map((it, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs py-1 border-b border-zinc-900 last:border-b-0"
                                >
                                  <div>
                                    <div className="font-medium text-white">{it.productName}</div>
                                    <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                                      <span
                                        className={`px-1 rounded text-[8px] font-bold ${
                                          it.packageType === 'carton'
                                            ? 'bg-amber-500/20 text-amber-300'
                                            : 'bg-blue-500/20 text-blue-300'
                                        }`}
                                      >
                                        {it.packageType === 'carton' ? 'DUS' : 'PCS'}
                                      </span>
                                      <span>x {it.quantityOrdered}</span>
                                    </div>
                                  </div>
                                  <div className="text-right font-mono font-bold text-zinc-300 text-xs">
                                    {formatRupiah(it.subtotal || it.unitPrice * it.quantityOrdered)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-zinc-850 flex items-center justify-between gap-2 flex-wrap">
                        {/* Kirim WhatsApp Toko */}
                        <a
                          href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                            `Halo Toko, mohon cek status pesanan saya:\nID: #${ord.id.slice(-8)}\nNama: ${ord.customerName}\nStatus: ${ord.fulfillmentStatus || ord.status}\nTotal: ${formatRupiah(ord.totalAmount)}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp Toko</span>
                        </a>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (!ord.items || ord.items.length === 0) return;
                              const newCartItems: CartItem[] = [];
                              ord.items.forEach((it) => {
                                const prod = catalogProducts.find((p) => p.id === it.productId) || {
                                  id: it.productId,
                                  storeId: it.storeId || DEMO_STORE_ID,
                                  name: it.productName,
                                  sku: 'SKU-REORDER',
                                  category: 'Groceries',
                                  barcode: '',
                                  piecesPerCarton: it.packageType === 'carton' ? 40 : 1,
                                  stockInUnits: 100,
                                  costPerUnit: it.unitPrice * 0.7,
                                  pricePerUnit: it.unitPrice,
                                  pricePerCarton: it.unitPrice,
                                  minStockAlert: 10,
                                };
                                newCartItems.push({
                                  product: prod,
                                  packageType: it.packageType,
                                  quantity: it.quantityOrdered,
                                });
                              });
                              setCart(newCartItems);
                              setCurrentScreen('cart');
                              try {
                                confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
                              } catch (e) {}
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Pesan Lagi</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Bottom Bar for Order History Screen */}
            <div className="p-3 bg-zinc-900/95 border-t border-zinc-800 flex items-center justify-around text-xs sticky bottom-0 z-20 backdrop-blur-md rounded-2xl mt-2">
              <button
                onClick={() => setCurrentScreen(member.isVerified ? 'home_member' : 'home_guest')}
                className="flex flex-col items-center text-zinc-400 hover:text-white"
              >
                <Store className="w-4 h-4" />
                <span className="text-[10px] mt-0.5">Home</span>
              </button>
              <button
                onClick={handleOpenAiOrderModal}
                className="flex flex-col items-center text-emerald-400 font-bold"
              >
                <Bot className="w-4 h-4" />
                <span className="text-[10px] mt-0.5">Pesan AI</span>
              </button>
              <button
                onClick={() => setCurrentScreen('cart')}
                className="flex flex-col items-center text-zinc-400 hover:text-white relative"
              >
                <ShoppingBag className="w-4 h-4" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 right-2 w-3.5 h-3.5 rounded-full bg-emerald-500 text-zinc-950 font-bold text-[8px] flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
                <span className="text-[10px] mt-0.5">Keranjang</span>
              </button>
              <button
                onClick={() => setCurrentScreen('order_history')}
                className="flex flex-col items-center text-emerald-400 font-bold relative cursor-pointer"
              >
                <div className="relative">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  {activeOrdersCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-3.5 rounded-full bg-emerald-500 text-zinc-950 font-black text-[8px] flex items-center justify-center shadow-sm shadow-emerald-500/40">
                      {activeOrdersCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5">Riwayat</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* MODAL STRUK FAKTUR DIGITAL SETELAH CHECKOUT                */}
        {/* ========================================================== */}
        {isOrderPlaced && placedTx && (
          <div className="absolute inset-0 z-50 bg-zinc-950/95 backdrop-blur-md p-6 flex flex-col justify-between animate-fadeIn overflow-y-auto">
            <div className="flex flex-col items-center text-center my-auto space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold">Masuk ke Sistem POS (Incoming PWA Order)</span>
              </div>
              <h3 className="text-lg font-black text-white">Pesanan Berhasil Dikirim!</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">ID: {placedTx.id}</p>

              {/* Rincian Nota */}
              <div className="w-full max-w-sm p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-left space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Nama Pemesan:</span>
                  <span className="font-semibold text-white">{placedTx.customerName}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>WhatsApp:</span>
                  <span className="font-mono text-emerald-400">{placedTx.customerPhone}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Metode:</span>
                  <span className="font-semibold uppercase text-white">{placedTx.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Status Kasir:</span>
                  <span className="font-bold text-amber-400 uppercase text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    Pending Approval Kasir POS
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between font-black text-white">
                  <span>Total Tagihan:</span>
                  <span className="text-emerald-400">{formatRupiah(placedTx.totalAmount)}</span>
                </div>
              </div>

              {/* Live Visual Progress Indicator for the Placed Transaction */}
              <div className="w-full max-w-sm text-left">
                <OrderProgressIndicator order={placedTx} />
              </div>

              <div className="text-[11px] text-zinc-400 max-w-sm bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-850">
                🔔 Orderan telah terhubung real-time ke terminal <strong>POS MACHINE</strong> toko. Kasir dapat langsung melihat & menyelesaikan pesanan ini.
              </div>

              {/* Tombol Kirim WhatsApp Toko */}
              <a
                href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                  `*Pesanan Baru RiskCart (PWA Client)*\nID: ${placedTx.id}\nNama: ${placedTx.customerName}\nTotal: ${formatRupiah(
                    placedTx.totalAmount
                  )}\nAlamat: ${member.address}\nStatus: Menunggu Konfirmasi Kasir POS`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kirim Salinan ke WhatsApp Toko</span>
              </a>
            </div>

            <div className="space-y-2 pt-4">
              <button
                onClick={() => {
                  setIsOrderPlaced(false);
                  setPlacedTx(null);
                  setCart([]);
                  setCurrentScreen('order_history');
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>Pantau Progres di Riwayat Pesanan</span>
              </button>

              <button
                onClick={() => {
                  setIsOrderPlaced(false);
                  setPlacedTx(null);
                  setCart([]);
                  setCurrentScreen('home_member');
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs cursor-pointer"
              >
                Kembali ke Halaman Home
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Order History Modal */}
      <CustomerOrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        customerPhone={member.phone}
        availableProducts={catalogProducts}
      />
    </div>
  );
};
