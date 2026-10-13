import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  Package,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Share2,
  Phone,
  MessageCircle,
  ChevronRight,
  User,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  X,
  CreditCard,
  FileSpreadsheet,
  Check,
  Send,
  Boxes,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Order, OrderItem, OrderStatus, OrderChannel } from '../../types';

const STORE_ID = 'store_001';

interface StaffCourier {
  id: string;
  name: string;
  role: string;
  phone: string;
  outlet?: string;
  shift?: string;
  status?: string;
}

const DEFAULT_COURIERS: StaffCourier[] = [
  {
    id: 'STF-04',
    name: 'Rian Hidayat',
    role: 'Kurir Pengantar Motor PWA',
    phone: '+62 819-7788-9900',
    outlet: 'RiskCart Flagship Store (Pusat)',
    shift: 'On-Demand Delivery',
    status: 'active',
  },
  {
    id: 'STF-DRV-1',
    name: 'Budi Santoso',
    role: 'Driver Armada Pickup Toko',
    phone: '+62 812-3344-5566',
    outlet: 'RiskCart Flagship Store (Pusat)',
    shift: 'Pagi & Siang (08:00 - 17:00)',
    status: 'active',
  },
  {
    id: 'STF-01',
    name: 'Ahmad Fauzi',
    role: 'Driver Ekspedisi Grosir',
    phone: '+62 813-4455-6677',
    outlet: 'Central Distribution Center (CDC)',
    shift: 'Reguler (08:00 - 17:00)',
    status: 'active',
  },
  {
    id: 'STF-03',
    name: 'Bambang Supriyanto',
    role: 'Logistik Gudang & Pengiriman',
    phone: '+62 817-6677-8899',
    outlet: 'Central Distribution Center (CDC)',
    shift: 'Reguler (08:00 - 17:00)',
    status: 'active',
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-NL-3062',
    storeId: STORE_ID,
    orderNumber: 'NL-3062',
    customerName: 'Budi Santoso',
    customerPhone: '+62 812-3456-7890',
    customerAddress: 'Jl. Melati Raya No. 12, RT 03/05, Kemang, Jakarta Selatan',
    channel: 'pwa',
    itemsCount: 3,
    items: [
      {
        productId: 'PRD-MGO-01',
        name: 'Minyak Goreng SunCo 2L Dus (Isi 6 Pouch)',
        sku: 'MGO-SUN-2L-DUS',
        packageType: 'carton',
        qty: 2,
        costPrice: 195000,
        sellingPrice: 225000,
        subtotal: 450000,
        profit: 60000,
      },
      {
        productId: 'PRD-BRS-01',
        name: 'Beras Premium Rojolele 5kg',
        sku: 'BRS-ROJ-5KG',
        packageType: 'unit',
        qty: 3,
        costPrice: 63000,
        sellingPrice: 75000,
        subtotal: 225000,
        profit: 36000,
      },
    ],
    totalCost: 579000,
    totalAmount: 675000,
    totalProfit: 96000,
    status: 'new',
    paymentMethod: 'QRIS',
    paymentStatus: 'paid',
    deliveryStaffId: null,
    deliveryStaffName: null,
    deliveryStaffPhone: null,
    assignedAt: null,
    notes: 'Mohon cantumkan nomor pesanan di paket. Tolong bel rumah ditekan 2 kali.',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-NL-3061',
    storeId: STORE_ID,
    orderNumber: 'NL-3061',
    customerName: 'Ibu Ratna Dewi',
    customerPhone: '+62 813-9876-5432',
    customerAddress: 'Jl. Teuku Cik Ditiro No. 44, Menteng, Jakarta Pusat',
    channel: 'website',
    itemsCount: 4,
    items: [
      {
        productId: 'PRD-GLK-01',
        name: 'Gula Pasir Gulaku Kuning 1kg',
        sku: 'GLK-KNG-1KG',
        packageType: 'unit',
        qty: 5,
        costPrice: 155000 / 10,
        sellingPrice: 18000,
        subtotal: 90000,
        profit: 12500,
      },
      {
        productId: 'PRD-IND-01',
        name: 'Indomie Goreng Spesial Dus (Isi 40 Pcs)',
        sku: 'IND-MGR-40PCS',
        packageType: 'carton',
        qty: 2,
        costPrice: 115000,
        sellingPrice: 137500,
        subtotal: 275000,
        profit: 45000,
      },
    ],
    totalCost: 307500,
    totalAmount: 365000,
    totalProfit: 57500,
    status: 'packing',
    paymentMethod: 'Bank Transfer (BCA)',
    paymentStatus: 'paid',
    deliveryStaffId: 'STF-04',
    deliveryStaffName: 'Rian Hidayat',
    deliveryStaffPhone: '+62 819-7788-9900',
    assignedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    notes: 'Packing kardus double wrap untuk karton Indomie.',
    createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-NL-3059',
    storeId: STORE_ID,
    orderNumber: 'NL-3059',
    customerName: 'Toko Barokah (Grosir)',
    customerPhone: '+62 818-5544-3322',
    customerAddress: 'Jl. Kyai Tapa No. 88, Grogol, Jakarta Barat',
    channel: 'visitor',
    itemsCount: 8,
    items: [
      {
        productId: 'PRD-AQU-01',
        name: 'Air Mineral Aqua Galon 19L',
        sku: 'AQU-GLN-19L',
        packageType: 'unit',
        qty: 6,
        costPrice: 17000,
        sellingPrice: 21000,
        subtotal: 126000,
        profit: 24000,
      },
      {
        productId: 'PRD-KPI-01',
        name: 'Kopi Kapal Api Spesial Dus (Isi 100 Sachet)',
        sku: 'KPI-KPL-100S',
        packageType: 'carton',
        qty: 5,
        costPrice: 160000,
        sellingPrice: 190800,
        subtotal: 954000,
        profit: 154000,
      },
    ],
    totalCost: 902000,
    totalAmount: 1080000,
    totalProfit: 178000,
    status: 'shipped',
    paymentMethod: 'Cash (Tunai)',
    paymentStatus: 'paid',
    deliveryStaffId: 'STF-DRV-1',
    deliveryStaffName: 'Budi Santoso',
    deliveryStaffPhone: '+62 812-3344-5566',
    assignedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    notes: 'Armada pickup toko sedang menuju lokasi pemesan.',
    createdAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-NL-3055',
    storeId: STORE_ID,
    orderNumber: 'NL-3055',
    customerName: 'Hendra Gunawan',
    customerPhone: '+62 812-9988-7766',
    customerAddress: 'Komp. Janur Elok Blok QA No. 17, Kelapa Gading, Jakarta Utara',
    channel: 'pwa',
    itemsCount: 2,
    items: [
      {
        productId: 'PRD-ULT-01',
        name: 'Susu UHT Ultra Milk Full Cream 1L Dus (Isi 12)',
        sku: 'ULT-FC-1L-DUS',
        packageType: 'carton',
        qty: 1,
        costPrice: 195000,
        sellingPrice: 230000,
        subtotal: 230000,
        profit: 35000,
      },
    ],
    totalCost: 195000,
    totalAmount: 230000,
    totalProfit: 35000,
    status: 'delivered',
    paymentMethod: 'QRIS',
    paymentStatus: 'paid',
    deliveryStaffId: 'STF-04',
    deliveryStaffName: 'Rian Hidayat',
    deliveryStaffPhone: '+62 819-7788-9900',
    assignedAt: new Date(Date.now() - 280 * 60 * 1000).toISOString(),
    notes: 'Diterima oleh sekuriti komplek atas izin pembeli.',
    createdAt: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 250 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-NL-3050',
    storeId: STORE_ID,
    orderNumber: 'NL-3050',
    customerName: 'Warung Bu Siti',
    customerPhone: '+62 815-4433-2211',
    customerAddress: 'Jl. Tebet Barat Dalam VII No. 19, Tebet, Jakarta Selatan',
    channel: 'website',
    itemsCount: 5,
    items: [
      {
        productId: 'PRD-THB-01',
        name: 'Teh Botol Sosro Kotak 250ml Dus (Isi 24)',
        sku: 'THB-SSR-24KTK',
        packageType: 'carton',
        qty: 3,
        costPrice: 85000,
        sellingPrice: 102000,
        subtotal: 306000,
        profit: 51000,
      },
      {
        productId: 'PRD-TRG-01',
        name: 'Tepung Terigu Segitiga Biru 1kg Dus (Isi 12)',
        sku: 'TRG-SGT-12KG',
        packageType: 'carton',
        qty: 1,
        costPrice: 155000,
        sellingPrice: 185000,
        subtotal: 185000,
        profit: 30000,
      },
    ],
    totalCost: 410000,
    totalAmount: 491000,
    totalProfit: 81000,
    status: 'delivered',
    paymentMethod: 'Bank Transfer (Mandiri)',
    paymentStatus: 'paid',
    deliveryStaffId: 'STF-DRV-1',
    deliveryStaffName: 'Budi Santoso',
    deliveryStaffPhone: '+62 812-3344-5566',
    assignedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    notes: 'Pesanan langganan mingguan warung binaan.',
    createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 23 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ORD-NL-3048',
    storeId: STORE_ID,
    orderNumber: 'NL-3048',
    customerName: 'Farhan Pratama',
    customerPhone: '+62 817-1122-3344',
    customerAddress: 'Komp. Trilium Residence Blok C-2, Pancoran, Jakarta Selatan',
    channel: 'pwa',
    itemsCount: 1,
    items: [
      {
        productId: 'PRD-BRS-02',
        name: 'Beras Pandan Wangi Premium 10kg',
        sku: 'BRS-PDW-10KG',
        packageType: 'unit',
        qty: 1,
        costPrice: 140000,
        sellingPrice: 165000,
        subtotal: 165000,
        profit: 25000,
      },
    ],
    totalCost: 140000,
    totalAmount: 165000,
    totalProfit: 25000,
    status: 'returned',
    paymentMethod: 'Kasbon / Tempo',
    paymentStatus: 'unpaid',
    deliveryStaffId: 'STF-01',
    deliveryStaffName: 'Ahmad Fauzi',
    deliveryStaffPhone: '+62 813-4455-6677',
    assignedAt: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
    notes: 'Alamat tujuan salah / penerima pindah domisili. Barang dikembalikan ke gudang.',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ORD-NL-3045',
    storeId: STORE_ID,
    orderNumber: 'NL-3045',
    customerName: 'Resto Sederhana Bintaro',
    customerPhone: '+62 811-987-6543',
    customerAddress: 'Jl. RS Fatmawati No. 102, Cilandak, Jakarta Selatan',
    channel: 'visitor',
    itemsCount: 12,
    items: [
      {
        productId: 'PRD-BRS-03',
        name: 'Beras Ramos Super 25kg Zak',
        sku: 'BRS-RMS-25KG',
        packageType: 'carton',
        qty: 3,
        costPrice: 325000,
        sellingPrice: 380000,
        subtotal: 1140000,
        profit: 165000,
      },
      {
        productId: 'PRD-MGO-JER',
        name: 'Minyak Goreng Curah Bimoli Jerigen 18L',
        sku: 'MGO-BML-18L',
        packageType: 'carton',
        qty: 2,
        costPrice: 275000,
        sellingPrice: 320000,
        subtotal: 640000,
        profit: 90000,
      },
    ],
    totalCost: 1525000,
    totalAmount: 1780000,
    totalProfit: 255000,
    status: 'new',
    paymentMethod: 'Bank Transfer (BCA)',
    paymentStatus: 'pending',
    deliveryStaffId: null,
    deliveryStaffName: null,
    deliveryStaffPhone: null,
    assignedAt: null,
    notes: 'Harap kirim sebelum jam 17:00 untuk persiapan buka puasa bersama.',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
];

interface OrdersModuleProps {
  currencyMode?: 'IDR' | 'USD';
  onNavigateTab?: (tab: string) => void;
}

export const OrdersModule: React.FC<OrdersModuleProps> = ({
  currencyMode = 'IDR',
  onNavigateTab,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [availableCouriers, setAvailableCouriers] = useState<StaffCourier[]>(DEFAULT_COURIERS);

  // Staff Assignment in Drawer
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [isAssigningStaff, setIsAssigningStaff] = useState<boolean>(false);
  const [assignSuccessMessage, setAssignSuccessMessage] = useState<string | null>(null);

  // Thermal Receipt Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Create Manual Order Modal
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    channel: 'visitor' as OrderChannel,
    paymentMethod: 'Cash (Tunai)',
    itemName: 'Minyak Goreng SunCo 2L Dus',
    itemSku: 'MGO-SUN-2L',
    packageType: 'carton' as 'carton' | 'unit',
    qty: 1,
    costPrice: 195000,
    sellingPrice: 225000,
    notes: '',
  });

  // Real-time Firestore synchronization for stores/store_001/orders
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    try {
      const ordersColRef = collection(db, 'stores', STORE_ID, 'orders');
      const ordersQuery = query(ordersColRef, orderBy('createdAt', 'desc'));

      unsubscribe = onSnapshot(
        ordersQuery,
        (snapshot) => {
          if (snapshot.empty) {
            // Seed initial Wharf demo orders
            INITIAL_ORDERS.forEach(async (ord) => {
              await setDoc(doc(ordersColRef, ord.id), ord);
            });
            setOrders(INITIAL_ORDERS);
          } else {
            const list: Order[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<Order, 'id'>),
            }));
            setOrders(list);

            // If an order is currently opened in the drawer, keep it fresh
            if (selectedOrder) {
              const updatedActive = list.find((o) => o.id === selectedOrder.id);
              if (updatedActive) {
                setSelectedOrder(updatedActive);
              }
            }
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Orders onSnapshot error:', err);
          // Fallback to initial orders if offline/permission issue
          setOrders(INITIAL_ORDERS);
          setLoading(false);
        }
      );
    } catch (e) {
      console.warn('Orders setup exception:', e);
      setOrders(INITIAL_ORDERS);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [selectedOrder?.id]);

  // Query Delivery Staff from stores/store_001/staff and staff collection
  useEffect(() => {
    let unsubStaff: () => void = () => {};
    try {
      const staffColRef = collection(db, 'stores', STORE_ID, 'staff');
      unsubStaff = onSnapshot(
        staffColRef,
        (snap) => {
          if (!snap.empty) {
            const items: StaffCourier[] = snap.docs.map((d) => ({
              id: d.id,
              name: d.data().name || 'Staff',
              role: d.data().role || 'Driver / Courier',
              phone: d.data().phone || '-',
              outlet: d.data().outlet || '',
              shift: d.data().shift || '',
              status: d.data().status || 'active',
            }));
            setAvailableCouriers(items);
          } else {
            setAvailableCouriers(DEFAULT_COURIERS);
          }
        },
        (err) => {
          console.warn('Staff listener notice, using default couriers:', err);
          setAvailableCouriers(DEFAULT_COURIERS);
        }
      );
    } catch (err) {
      setAvailableCouriers(DEFAULT_COURIERS);
    }
    return () => unsubStaff();
  }, []);

  // Sync selectedStaffId when selectedOrder changes
  useEffect(() => {
    if (selectedOrder) {
      setSelectedStaffId(selectedOrder.deliveryStaffId || '');
      setAssignSuccessMessage(null);
    }
  }, [selectedOrder?.id]);

  // Currency Formatter
  const formatMoney = (val: number) => {
    if (currencyMode === 'USD') {
      return `$${(val / 16000).toFixed(2)}`;
    }
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  // Relative Time Formatter (Wharf style: 18 min ago, 2 h ago, 1 d ago)
  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (diffMs < 0) return 'Just now';
    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} d ago`;
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Full date formatter for drawer header
  const formatFullDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Status Tab Counts
  const counts = useMemo(() => {
    return {
      all: orders.length,
      new: orders.filter((o) => o.status === 'new').length,
      packing: orders.filter((o) => o.status === 'packing').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      returned: orders.filter((o) => o.status === 'returned').length,
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (activeStatusTab !== 'all' && order.status !== activeStatusTab) {
        return false;
      }

      // 2. Channel Filter
      if (channelFilter !== 'all' && order.channel !== channelFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = (order.orderNumber || order.id).toLowerCase().includes(q);
        const matchCust = (order.customerName || '').toLowerCase().includes(q);
        const matchPhone = (order.customerPhone || '').toLowerCase().includes(q);
        const matchAddress = (order.customerAddress || '').toLowerCase().includes(q);
        const matchStaff = (order.deliveryStaffName || '').toLowerCase().includes(q);
        const matchItem = order.items?.some((i) =>
          i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
        );
        return matchId || matchCust || matchPhone || matchAddress || matchStaff || matchItem;
      }

      return true;
    });
  }, [orders, activeStatusTab, channelFilter, searchQuery]);

  // Status Badge Pill Renderer
  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            New
          </span>
        );
      case 'packing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
            <Package className="w-3 h-3" />
            Packing
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Truck className="w-3 h-3" />
            Shipped
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Delivered
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <RotateCcw className="w-3 h-3" />
            Returned
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  // Channel Badge Renderer
  const renderChannelBadge = (channel: OrderChannel) => {
    switch (channel) {
      case 'visitor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Visitor
          </span>
        );
      case 'pwa':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            PWA
          </span>
        );
      case 'website':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30">
            Website
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{channel}</span>;
    }
  };

  // Open Drawer Handler
  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order);
    setSelectedStaffId(order.deliveryStaffId || '');
    setIsDrawerOpen(true);
  };

  // Update Status in Firestore
  const handleUpdateOrderStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    try {
      const orderDocRef = doc(db, 'stores', STORE_ID, 'orders', selectedOrder.id);
      const updates: Partial<Order> = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(orderDocRef, updates);
      setSelectedOrder((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      console.error('Error updating order status in Firestore:', err);
    }
  };

  // Assign Delivery Staff in Firestore
  const handleAssignDeliveryStaff = async () => {
    if (!selectedOrder) return;
    if (!selectedStaffId) {
      alert('Please select a delivery staff from the dropdown.');
      return;
    }

    const courier = availableCouriers.find((c) => c.id === selectedStaffId);
    if (!courier) return;

    setIsAssigningStaff(true);
    try {
      const orderDocRef = doc(db, 'stores', STORE_ID, 'orders', selectedOrder.id);
      const updates = {
        deliveryStaffId: courier.id,
        deliveryStaffName: courier.name,
        deliveryStaffPhone: courier.phone,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(orderDocRef, updates);

      setSelectedOrder((prev) => (prev ? { ...prev, ...updates } : null));
      setAssignSuccessMessage(`Assigned to ${courier.name} successfully!`);
      setTimeout(() => setAssignSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error assigning staff in Firestore:', err);
    } finally {
      setIsAssigningStaff(false);
    }
  };

  // Create Manual Order
  const handleCreateNewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.customerName.trim()) return;

    const autoId = `ORD-NL-${Math.floor(1000 + Math.random() * 9000)}`;
    const cost = Number(newOrderForm.costPrice) * Number(newOrderForm.qty);
    const amount = Number(newOrderForm.sellingPrice) * Number(newOrderForm.qty);
    const profit = amount - cost;

    const newOrder: Order = {
      id: autoId,
      storeId: STORE_ID,
      orderNumber: autoId.replace('ORD-', ''),
      customerName: newOrderForm.customerName.trim(),
      customerPhone: newOrderForm.customerPhone.trim() || '+62 812-0000-0000',
      customerAddress: newOrderForm.customerAddress.trim() || 'Walk-in Store Pickup',
      channel: newOrderForm.channel,
      itemsCount: Number(newOrderForm.qty),
      items: [
        {
          productId: 'PRD-CUSTOM',
          name: newOrderForm.itemName,
          sku: newOrderForm.itemSku || 'SKU-CUST',
          packageType: newOrderForm.packageType,
          qty: Number(newOrderForm.qty),
          costPrice: Number(newOrderForm.costPrice),
          sellingPrice: Number(newOrderForm.sellingPrice),
          subtotal: amount,
          profit: profit,
        },
      ],
      totalCost: cost,
      totalAmount: amount,
      totalProfit: profit,
      status: 'new',
      paymentMethod: newOrderForm.paymentMethod,
      paymentStatus: 'paid',
      deliveryStaffId: null,
      deliveryStaffName: null,
      deliveryStaffPhone: null,
      assignedAt: null,
      notes: newOrderForm.notes.trim() || 'Direct manual order entry',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const ordersColRef = collection(db, 'stores', STORE_ID, 'orders');
      await setDoc(doc(ordersColRef, newOrder.id), newOrder);
      setIsNewOrderModalOpen(false);
      handleOpenOrder(newOrder);
    } catch (err) {
      console.error('Error creating new order:', err);
    }
  };

  // WhatsApp Share Message
  const getWhatsAppShareUrl = (order: Order) => {
    const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
    const phoneToUse = cleanPhone.startsWith('0')
      ? `62${cleanPhone.slice(1)}`
      : cleanPhone.startsWith('62')
      ? cleanPhone
      : `62${cleanPhone}`;

    const itemsText = order.items
      ?.map(
        (i, idx) =>
          `${idx + 1}. ${i.name} (${i.packageType}) x${i.qty} = ${formatMoney(i.subtotal)}`
      )
      .join('%0A');

    const courierText = order.deliveryStaffName
      ? `%0A*Delivery Courier:* ${order.deliveryStaffName} (${order.deliveryStaffPhone || '-'})`
      : '';

    const text = `*RISKCART POS - ORDER CONFIRMATION*%0A%0A*Order ID:* ${order.orderNumber}%0A*Status:* ${order.status.toUpperCase()}%0A*Customer:* ${order.customerName}%0A*Address:* ${order.customerAddress || '-'}${courierText}%0A%0A*Items:*%0A${itemsText}%0A%0A*Total Amount:* ${formatMoney(
      order.totalAmount
    )}%0A*Payment Method:* ${order.paymentMethod}%0A%0AThank you for ordering with RiskCart!`;

    return `https://wa.me/${phoneToUse}?text=${text}`;
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* 1. TOP HEADER & BREADCRUMB (RiskCart Dark Navy Theme) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Fulfillment Operations &bull; Wharf Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Orders
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Omnichannel order pipeline with click-to-fulfill drawer, courier tracking, and live gross profit margins.
          </p>
        </div>

        {/* Header Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Refresh order directory"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 border border-blue-400/40 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Order</span>
          </button>
        </div>
      </div>

      {/* 2. WHARF STATUS TABS & FILTER BAR */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-4 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs (Top-Left Pill Buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
            {[
              { id: 'all', label: 'All', count: counts.all, color: 'blue' },
              { id: 'new', label: 'New', count: counts.new, color: 'amber' },
              { id: 'packing', label: 'Packing', count: counts.packing, color: 'orange' },
              { id: 'shipped', label: 'Shipped', count: counts.shipped, color: 'blue' },
              { id: 'delivered', label: 'Delivered', count: counts.delivered, color: 'emerald' },
              { id: 'returned', label: 'Returned', count: counts.returned, color: 'rose' },
            ].map((tab) => {
              const isActive = activeStatusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatusTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-750'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-700/80 text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Filters: Channel Dropdown & Real-time Search */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Channel Filter */}
            <div className="w-full sm:w-auto relative min-w-[150px]">
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none pr-8"
              >
                <option value="all">All channels</option>
                <option value="visitor">Visitor (Walk-in POS)</option>
                <option value="pwa">PWA (Mobile App)</option>
                <option value="website">Website (E-Catalog)</option>
              </select>
              <div className="absolute right-2.5 top-2.5 pointer-events-none text-slate-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order ID, customer, phone..."
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. ORDERS TABLE (Wharf Dashboard Layout) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading orders from Firestore...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center space-y-3 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-white">No orders found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchQuery || channelFilter !== 'all' || activeStatusTab !== 'all'
                ? 'Try adjusting your search query or switching active status and channel filters.'
                : 'There are no customer orders in this store yet. Click "+ Create Order" to place your first order.'}
            </p>
            {(searchQuery || channelFilter !== 'all' || activeStatusTab !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setChannelFilter('all');
                  setActiveStatusTab('all');
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-medium hover:bg-blue-600/30 transition cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 select-none">
                  <th className="py-3.5 px-4 font-semibold">Order ID</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-3 font-semibold">Channel</th>
                  <th className="py-3.5 px-3 font-semibold">Delivery Staff</th>
                  <th className="py-3.5 px-3 font-semibold text-center">Items</th>
                  <th className="py-3.5 px-3 font-semibold">Placed</th>
                  <th className="py-3.5 px-3 font-semibold text-right">Total Modal</th>
                  <th className="py-3.5 px-3 font-semibold text-right">Total Jual</th>
                  <th className="py-3.5 px-3 font-semibold text-right">Total Untung</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-3.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOrders.map((order) => {
                  const initials = order.customerName
                    ? order.customerName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'CU';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenOrder(order)}
                      className="group hover:bg-slate-800/60 transition cursor-pointer"
                    >
                      {/* 1. Order ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400 group-hover:text-blue-300">
                        {order.orderNumber}
                      </td>

                      {/* 2. Customer (Initials + Name & City) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5 min-w-[180px]">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                            {initials}
                          </div>
                          <div className="truncate">
                            <div className="font-semibold text-white truncate group-hover:text-blue-200">
                              {order.customerName}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                              {order.customerAddress || order.customerPhone || '-'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Channel */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {renderChannelBadge(order.channel)}
                      </td>

                      {/* 4. Delivery Staff (Staff Pengirim) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {order.deliveryStaffName ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700/80 shadow-sm">
                            <User className="w-3 h-3 text-blue-400 shrink-0" />
                            <span className="truncate max-w-[120px] font-semibold text-white">
                              {order.deliveryStaffName}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 border border-dashed border-slate-750">
                            Unassigned
                          </div>
                        )}
                      </td>

                      {/* 5. Items Count */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="text-slate-300 font-medium">
                          {order.itemsCount || order.items?.length || 1}
                        </span>{' '}
                        <span className="text-slate-500 text-[10px]">items</span>
                      </td>

                      {/* 6. Placed (Relative Time) */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-400 text-[11px]">
                        {formatRelativeTime(order.createdAt)}
                      </td>

                      {/* 7. Total Modal (Cost / HPP) */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                        {formatMoney(order.totalCost || 0)}
                      </td>

                      {/* 8. Total Jual (Gross Revenue) */}
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-white whitespace-nowrap">
                        {formatMoney(order.totalAmount || 0)}
                      </td>

                      {/* 9. Total Untung (Net Margin Highlight) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <TrendingUp className="w-3 h-3 shrink-0" />
                          +{formatMoney(order.totalProfit || 0)}
                        </span>
                      </td>

                      {/* 10. Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatusBadge(order.status)}
                      </td>

                      {/* 11. Action Chevron */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOrder(order);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition"
                          title="Open order fulfillment details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. ORDER DETAIL & FULFILLMENT SLIDE-OVER DRAWER / MODAL         */}
      {/* ============================================================== */}
      {isDrawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/70 backdrop-blur-sm transition-opacity">
          <div
            className="w-full max-w-2xl bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold font-mono text-white tracking-wide">
                    {selectedOrder.orderNumber}
                  </span>
                  {renderStatusBadge(selectedOrder.status)}
                  {renderChannelBadge(selectedOrder.channel)}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {formatFullDateTime(selectedOrder.createdAt)}
                  </span>
                  <span>&bull;</span>
                  <span>Placed {formatRelativeTime(selectedOrder.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition cursor-pointer"
                  title="Print Packing Slip / Thermal Struk"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <a
                  href={getWhatsAppShareUrl(selectedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition cursor-pointer"
                  title="Share invoice via WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              {/* SECTION A: FULFILLMENT PROGRESS STEPPER & QUICK ACTION BUTTONS */}
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-400" />
                    <span>Fulfillment Pipeline</span>
                  </h3>
                  <span className="text-[11px] font-medium text-slate-400">
                    Step {selectedOrder.status === 'new' ? '1' : selectedOrder.status === 'packing' ? '2' : selectedOrder.status === 'shipped' ? '3' : selectedOrder.status === 'delivered' ? '4' : 'Special'} of 4
                  </span>
                </div>

                {/* Progress Stepper Line */}
                <div className="grid grid-cols-4 gap-2 relative">
                  {[
                    { key: 'new', label: 'New', num: 1 },
                    { key: 'packing', label: 'Packing', num: 2 },
                    { key: 'shipped', label: 'Shipped', num: 3 },
                    { key: 'delivered', label: 'Delivered', num: 4 },
                  ].map((step, idx) => {
                    const stepWeights: Record<string, number> = {
                      new: 1,
                      packing: 2,
                      shipped: 3,
                      delivered: 4,
                      returned: -1,
                      cancelled: -1,
                    };
                    const currentWeight = stepWeights[selectedOrder.status] || 1;
                    const isDone = currentWeight > step.num;
                    const isCurrent = selectedOrder.status === step.key;

                    return (
                      <div key={step.key} className="flex flex-col items-center text-center space-y-1">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md shadow-blue-500/40'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isDone ? <Check className="w-3.5 h-3.5" /> : step.num}
                        </div>
                        <span
                          className={`text-[11px] font-semibold ${
                            isCurrent
                              ? 'text-blue-400'
                              : isDone
                              ? 'text-emerald-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Interactive State Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-800">
                  {selectedOrder.status === 'new' && (
                    <button
                      onClick={() => handleUpdateOrderStatus('packing')}
                      className="flex-1 py-2 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>Start Packing</span>
                    </button>
                  )}

                  {selectedOrder.status === 'packing' && (
                    <button
                      onClick={() => handleUpdateOrderStatus('shipped')}
                      className="flex-1 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Mark as Shipped</span>
                    </button>
                  )}

                  {selectedOrder.status === 'shipped' && (
                    <button
                      onClick={() => handleUpdateOrderStatus('delivered')}
                      className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Delivery</span>
                    </button>
                  )}

                  {selectedOrder.status === 'delivered' && (
                    <div className="flex-1 py-2 px-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Order Completed &amp; Delivered</span>
                    </div>
                  )}

                  {/* Secondary Actions */}
                  {selectedOrder.status !== 'returned' && selectedOrder.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        if (confirm('Mark this order as Returned? Inventory can be restocked.')) {
                          handleUpdateOrderStatus('returned');
                        }
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 text-xs font-medium border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return</span>
                    </button>
                  )}

                  {selectedOrder.status === 'new' && (
                    <button
                      onClick={() => {
                        if (confirm('Cancel this order?')) {
                          handleUpdateOrderStatus('cancelled');
                        }
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 text-xs font-medium border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>

              {/* SECTION B: FULFILLMENT & COURIER ASSIGNMENT (Penugasan Pengirim) */}
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>Fulfillment &amp; Courier Assignment</span>
                  </h3>
                  {selectedOrder.deliveryStaffName && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                      Dispatched
                    </span>
                  )}
                </div>

                {/* Assigned Courier Display Banner if already assigned */}
                {selectedOrder.deliveryStaffName && (
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                        {selectedOrder.deliveryStaffName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-xs">
                          {selectedOrder.deliveryStaffName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{selectedOrder.deliveryStaffPhone || '-'}</span>
                          {selectedOrder.assignedAt && (
                            <>
                              <span>&bull;</span>
                              <span>Assigned {formatRelativeTime(selectedOrder.assignedAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedOrder.deliveryStaffPhone && (
                      <a
                        href={`https://wa.me/${selectedOrder.deliveryStaffPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Chat Courier</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Assign / Re-assign Dropdown */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 block">
                    {selectedOrder.deliveryStaffName ? 'Re-assign Courier / Staff' : 'Select Delivery Staff (Staff Pengirim)'}
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">-- Choose Courier / Delivery Staff --</option>
                      {availableCouriers.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} &bull; {staff.role} ({staff.phone})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleAssignDeliveryStaff}
                      disabled={isAssigningStaff || !selectedStaffId}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {isAssigningStaff ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Assign Staff</span>
                    </button>
                  </div>

                  {assignSuccessMessage && (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{assignSuccessMessage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION C: CUSTOMER & DELIVERY ADDRESS CARD */}
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>Customer &amp; Shipping Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-850">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">Customer Name</span>
                    <span className="text-white font-semibold text-sm">{selectedOrder.customerName}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 font-semibold block">Phone / WhatsApp</span>
                      <span className="text-white font-mono">{selectedOrder.customerPhone || '-'}</span>
                    </div>
                    {selectedOrder.customerPhone && (
                      <a
                        href={getWhatsAppShareUrl(selectedOrder)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30"
                        title="Direct WhatsApp message"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-850 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Destination Shipping Address:</span>
                  </div>
                  <p className="text-slate-200 pl-5">{selectedOrder.customerAddress || 'Walk-in Store Pickup'}</p>
                </div>

                {selectedOrder.notes && (
                  <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 text-xs">
                    <span className="text-[10px] uppercase text-blue-400 font-bold block">Delivery Notes:</span>
                    <p className="text-slate-300 mt-0.5">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* SECTION D: ORDER ITEMS TABLE */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-blue-400" />
                    <span>Order Items Breakdown</span>
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {selectedOrder.items?.length || 1} line item(s)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <th className="py-2.5 px-3">Item / SKU</th>
                        <th className="py-2.5 px-2 text-center">Package</th>
                        <th className="py-2.5 px-2 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Modal (Cost)</th>
                        <th className="py-2.5 px-3 text-right">Price (Jual)</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white">{item.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 capitalize">
                              {item.packageType}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-white">
                            {item.qty}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-400">
                            {formatMoney(item.costPrice)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-300">
                            {formatMoney(item.sellingPrice)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-white">
                            {formatMoney(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION E: FINANCIAL SUMMARY CARD */}
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Financial &amp; Margin Summary</span>
                </h3>

                <div className="space-y-2 text-xs divide-y divide-slate-800">
                  <div className="flex justify-between text-slate-400 pt-1">
                    <span>Total Cost / Modal (HPP):</span>
                    <span className="font-mono">{formatMoney(selectedOrder.totalCost || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 pt-2 font-medium">
                    <span>Total Selling Price (Total Jual):</span>
                    <span className="font-mono text-white text-sm font-bold">
                      {formatMoney(selectedOrder.totalAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-400 pt-2 font-semibold">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Net Profit (Total Untung Bersih):
                    </span>
                    <span className="font-mono text-base font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      +{formatMoney(selectedOrder.totalProfit || 0)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Payment Method</span>
                    <span className="text-white font-medium">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Payment Status</span>
                    <span className="text-emerald-400 font-bold uppercase text-[11px]">
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsReceiptModalOpen(true)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-blue-400" />
                <span>Print Packing Slip</span>
              </button>

              <a
                href={getWhatsAppShareUrl(selectedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. THERMAL RECEIPT / PACKING SLIP MODAL                        */}
      {/* ============================================================== */}
      {isReceiptModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white text-zinc-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative font-mono text-xs">
            <button
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-zinc-400">
              <h2 className="text-base font-bold tracking-tight">RISKCART OFFICIAL STORE</h2>
              <p className="text-[10px] text-zinc-600">POS &amp; Omnichannel Grocery Wholesaler</p>
              <p className="text-[10px] text-zinc-600">Jl. Boulevard Raya Blok QF1 No. 12</p>
              <p className="text-[10px] font-bold mt-2">PACKING &amp; DISPATCH SLIP</p>
            </div>

            {/* Receipt Meta */}
            <div className="py-3 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>ORDER:</span>
                <span className="font-bold">{selectedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{formatFullDateTime(selectedOrder.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>CHANNEL:</span>
                <span className="uppercase">{selectedOrder.channel}</span>
              </div>
              <div className="flex justify-between">
                <span>CUSTOMER:</span>
                <span className="font-bold">{selectedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>PHONE:</span>
                <span>{selectedOrder.customerPhone || '-'}</span>
              </div>
              {selectedOrder.deliveryStaffName && (
                <div className="flex justify-between text-blue-700 font-bold">
                  <span>COURIER:</span>
                  <span>{selectedOrder.deliveryStaffName}</span>
                </div>
              )}
            </div>

            {/* Itemized List */}
            <div className="py-3 border-b border-dashed border-zinc-400 space-y-2">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="space-y-0.5 text-[11px]">
                  <div className="font-bold">{item.name}</div>
                  <div className="flex justify-between text-zinc-600">
                    <span>
                      {item.qty} x {formatMoney(item.sellingPrice)} ({item.packageType})
                    </span>
                    <span className="font-bold text-zinc-900">{formatMoney(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-3 border-b border-dashed border-zinc-400 space-y-1 font-bold text-[11px]">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>{formatMoney(selectedOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span>TOTAL JUAL:</span>
                <span>{formatMoney(selectedOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-zinc-600 font-normal">
                <span>PAYMENT:</span>
                <span>{selectedOrder.paymentMethod} (PAID)</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 text-center space-y-3">
              <p className="text-[10px] text-zinc-500">
                Barang yang sudah diterima harap diperiksa di depan kurir toko. Terima kasih!
              </p>
              <button
                onClick={() => window.print()}
                className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-sans font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. CREATE MANUAL ORDER MODAL                                   */}
      {/* ============================================================== */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-400" />
                  <span>Create New Order</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Direct omnichannel manual order entry with instant margin calculations.
                </p>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.customerName}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, customerName: e.target.value })
                    }
                    placeholder="e.g. Toko Berkah / Ibu Ani"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    WhatsApp Phone Number
                  </label>
                  <input
                    type="text"
                    value={newOrderForm.customerPhone}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, customerPhone: e.target.value })
                    }
                    placeholder="e.g. +62 812-3456-7890"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Channel</label>
                  <select
                    value={newOrderForm.channel}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        channel: e.target.value as OrderChannel,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="visitor">Visitor (Walk-in Cashier POS)</option>
                    <option value="pwa">PWA (Mobile Web App)</option>
                    <option value="website">Website (Online Catalog)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Payment Method
                  </label>
                  <select
                    value={newOrderForm.paymentMethod}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, paymentMethod: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Cash (Tunai)">Cash (Tunai)</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Bank Transfer (BCA)">Bank Transfer (BCA)</option>
                    <option value="Kasbon / Tempo">Kasbon / Tempo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Delivery Destination Address
                </label>
                <textarea
                  rows={2}
                  value={newOrderForm.customerAddress}
                  onChange={(e) =>
                    setNewOrderForm({ ...newOrderForm, customerAddress: e.target.value })
                  }
                  placeholder="Jl. Raya No. ..., Kecamatan, Kota"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Product Item Line */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-850 space-y-3">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                  Product Item Line
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      value={newOrderForm.itemName}
                      onChange={(e) =>
                        setNewOrderForm({ ...newOrderForm, itemName: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Package Type</label>
                    <select
                      value={newOrderForm.packageType}
                      onChange={(e) =>
                        setNewOrderForm({
                          ...newOrderForm,
                          packageType: e.target.value as 'carton' | 'unit',
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      <option value="carton">Carton / Dus</option>
                      <option value="unit">Unit / Eceran</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newOrderForm.qty}
                      onChange={(e) =>
                        setNewOrderForm({ ...newOrderForm, qty: Number(e.target.value) })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Modal / HPP (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newOrderForm.costPrice}
                      onChange={(e) =>
                        setNewOrderForm({
                          ...newOrderForm,
                          costPrice: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Harga Jual (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newOrderForm.sellingPrice}
                      onChange={(e) =>
                        setNewOrderForm({
                          ...newOrderForm,
                          sellingPrice: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Live Margin Calculation */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 font-semibold">
                  <span className="text-slate-400">Estimated Untung Bersih:</span>
                  <span className="text-emerald-400 font-mono">
                    +
                    {formatMoney(
                      (newOrderForm.sellingPrice - newOrderForm.costPrice) *
                        newOrderForm.qty
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Notes / Courier Instructions
                </label>
                <input
                  type="text"
                  value={newOrderForm.notes}
                  onChange={(e) =>
                    setNewOrderForm({ ...newOrderForm, notes: e.target.value })
                  }
                  placeholder="e.g. Tolong diantar sebelum jam 15:00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Order to Firestore</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
