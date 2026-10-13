import React, { useState } from 'react';
import {
  Truck,
  FileText,
  FileCheck,
  ShoppingBag,
  BarChart3,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  X,
} from 'lucide-react';
import { useFirestoreList } from '../../hooks/useFirestoreList';

interface ProcurementModuleProps {
  subModule:
    | 'daftar_supplier'
    | 'daftar_pembelian'
    | 'request_pembelian'
    | 'pembelian_produk'
    | 'statistik_pembelian';
  currencyMode?: 'IDR' | 'USD';
  onNavigateTab?: (tab: string) => void;
}

const INITIAL_SUPPLIERS = [
  {
    id: 'sup_1',
    name: 'PT Indofood CBP Sukses Makmur Tbk',
    category: 'Sembako & Mie Instan',
    contactPerson: 'Hendra Gunawan',
    phone: '+62 811-2345-6789',
    email: 'order.jakarta@indofood.co.id',
    paymentTerms: 'Tempo 30 Hari',
    leadTimeDays: 2,
    totalOrders: 42,
    rating: 4.9,
    status: 'active',
  },
  {
    id: 'sup_2',
    name: 'PT Tirta Investama (Danone Aqua)',
    category: 'Air Mineral & Minuman',
    contactPerson: 'Suryadi Pratama',
    phone: '+62 812-9876-5432',
    email: 'distribusi.aqua@danone.com',
    paymentTerms: 'Cash On Delivery (COD)',
    leadTimeDays: 1,
    totalOrders: 68,
    rating: 4.8,
    status: 'active',
  },
  {
    id: 'sup_3',
    name: 'PT Mayora Indah Tbk',
    category: 'Biskuit & Kopi',
    contactPerson: 'Dewi Lestari',
    phone: '+62 813-5566-7788',
    email: 'sales.dist@mayora.co.id',
    paymentTerms: 'Tempo 14 Hari',
    leadTimeDays: 3,
    totalOrders: 27,
    rating: 4.7,
    status: 'active',
  },
  {
    id: 'sup_4',
    name: 'PT Unilever Indonesia Tbk',
    category: 'Toiletries & Home Care',
    contactPerson: 'Reza Fahlevi',
    phone: '+62 815-1122-3344',
    email: 'retail.id@unilever.com',
    paymentTerms: 'Tempo 30 Hari',
    leadTimeDays: 4,
    totalOrders: 19,
    rating: 4.6,
    status: 'active',
  },
];

const INITIAL_PURCHASE_REQUESTS = [
  {
    id: 'PR-202610-101',
    date: '10 Okt 2026, 08:30 WIB',
    requester: 'Ahmad Fauzi (Kasir Pusat)',
    urgency: 'Tinggi (Stok Kritis)',
    product: 'Aqua Galon 19L Refill',
    requestedQty: '60 Galon',
    estimatedCost: 1080000,
    status: 'Disetujui Owner',
    notes: 'Sisa stok fisik di display tersisa 3 galon. Permintaan tinggi akhir pekan.',
  },
  {
    id: 'PR-202610-102',
    date: '10 Okt 2026, 11:15 WIB',
    requester: 'Siti Aminah (Admin Stock)',
    urgency: 'Sedang (Buffer Habis)',
    product: 'Indomie Goreng Original (Dus)',
    requestedQty: '25 Dus (1.000 Pcs)',
    estimatedCost: 2875000,
    status: 'Menunggu Review PO',
    notes: 'Penjualan carton stabil 4 dus/hari. Perlu reorder sebelum Selasa.',
  },
  {
    id: 'PR-202610-103',
    date: '09 Okt 2026, 16:40 WIB',
    requester: 'Budi Warehouse',
    urgency: 'Normal (Jadwal Rutin)',
    product: 'Minyak Goreng Sania 2L Pouch',
    requestedQty: '40 Pcs (10 Karton)',
    estimatedCost: 1450000,
    status: 'Ditolak (Budget Limit)',
    notes: 'Stok gudang masih cukup untuk 8 hari ke depan.',
  },
];

export const ProcurementModule: React.FC<ProcurementModuleProps> = ({
  subModule,
  currencyMode = 'IDR',
  onNavigateTab,
}) => {
  const [activeSub, setActiveSub] = useState<
    'daftar_supplier' | 'daftar_pembelian' | 'request_pembelian' | 'pembelian_produk' | 'statistik_pembelian'
  >(subModule);

  const [searchQuery, setSearchQuery] = useState('');

  // Suppliers & Purchase Requests from Firestore via useFirestoreList
  const { data: suppliers, addItem: addSupplier } = useFirestoreList('suppliers', INITIAL_SUPPLIERS);
  const { data: purchaseRequests, addItem: addPurchaseRequest } = useFirestoreList('purchase_requests', INITIAL_PURCHASE_REQUESTS);

  // Modal States
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupCategory, setNewSupCategory] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupTerms, setNewSupTerms] = useState('Tempo 30 Hari');

  const [showAddPRModal, setShowAddPRModal] = useState(false);
  const [newPrProduct, setNewPrProduct] = useState('');
  const [newPrQty, setNewPrQty] = useState('');
  const [newPrUrgency, setNewPrUrgency] = useState('Tinggi (Stok Kritis)');
  const [newPrRequester, setNewPrRequester] = useState('Kasir Shift 1');
  const [newPrNotes, setNewPrNotes] = useState('');

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;
    await addSupplier({
      name: newSupName.trim(),
      category: newSupCategory.trim() || 'Sembako & Retail',
      contactPerson: newSupContact.trim() || '-',
      phone: newSupPhone.trim() || '-',
      email: `${newSupName.toLowerCase().replace(/[^a-z0-9]/g, '')}@supplier.co.id`,
      paymentTerms: newSupTerms,
      leadTimeDays: 2,
      totalOrders: 0,
      rating: 5.0,
      status: 'active',
    });
    setNewSupName('');
    setNewSupCategory('');
    setNewSupContact('');
    setNewSupPhone('');
    setShowAddSupplierModal(false);
  };

  const handleSavePR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrProduct.trim() || !newPrQty.trim()) return;
    await addPurchaseRequest({
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      requester: newPrRequester,
      urgency: newPrUrgency,
      product: newPrProduct.trim(),
      requestedQty: newPrQty.trim(),
      estimatedCost: 1500000,
      status: 'Menunggu Persetujuan',
      notes: newPrNotes.trim() || '-',
    });
    setNewPrProduct('');
    setNewPrQty('');
    setNewPrNotes('');
    setShowAddPRModal(false);
  };

  // Purchase Orders (Daftar Pembelian)
  const [orders, setOrders] = useState([
    {
      id: 'PO-202610-001',
      date: '08 Okt 2026',
      supplier: 'PT Indofood CBP Sukses Makmur Tbk',
      itemsCount: 5,
      totalAmount: 14250000,
      paymentStatus: 'Lunas (Transfer)',
      deliveryStatus: 'Diterima Gudang',
      receivedDate: '09 Okt 2026',
    },
    {
      id: 'PO-202610-002',
      date: '09 Okt 2026',
      supplier: 'PT Tirta Investama (Danone Aqua)',
      itemsCount: 2,
      totalAmount: 4800000,
      paymentStatus: 'Lunas (COD)',
      deliveryStatus: 'Diterima Gudang',
      receivedDate: '10 Okt 2026',
    },
    {
      id: 'PO-202610-003',
      date: '10 Okt 2026',
      supplier: 'PT Mayora Indah Tbk',
      itemsCount: 4,
      totalAmount: 6540000,
      paymentStatus: 'Tempo (Due 24 Okt)',
      deliveryStatus: 'Dalam Pengiriman',
      receivedDate: '-',
    },
  ]);

  // Modal State for New Purchase
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(suppliers[0].name);
  const [poProduct, setPoProduct] = useState('Indomie Mi Goreng Special (Dus)');
  const [poCartons, setPoCartons] = useState(10);
  const [poPricePerCarton, setPoPricePerCarton] = useState(115000);

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const newPO = {
      id: `PO-202610-00${orders.length + 1}`,
      date: '10 Okt 2026',
      supplier: selectedSupplier,
      itemsCount: 1,
      totalAmount: poCartons * poPricePerCarton,
      paymentStatus: 'Tempo 30 Hari',
      deliveryStatus: 'Menunggu Pengiriman',
      receivedDate: '-',
    };
    setOrders([newPO, ...orders]);
    setShowPOModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Truck className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-black text-white tracking-tight">
            PEMBELIAN PRODUK &amp; PENGADAAN (SUPPLY CHAIN)
          </h1>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Manajemen rantai pasok: direktori supplier, purchase requisition (PR), purchase order (PO), dan analitik harga modal.
        </p>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto w-fit max-w-full mb-4">
          <button
            onClick={() => setActiveSub('daftar_supplier')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSub === 'daftar_supplier' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Daftar Supplier</span>
          </button>
          <button
            onClick={() => setActiveSub('daftar_pembelian')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSub === 'daftar_pembelian' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Daftar Pembelian</span>
          </button>
          <button
            onClick={() => setActiveSub('request_pembelian')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSub === 'request_pembelian' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Request Pembelian</span>
          </button>
          <button
            onClick={() => setActiveSub('pembelian_produk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSub === 'pembelian_produk' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Pembelian Produk</span>
          </button>
          <button
            onClick={() => setActiveSub('statistik_pembelian')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSub === 'statistik_pembelian' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Statistik Pembelian</span>
          </button>
        </div>

      {/* VIEW: DAFTAR SUPPLIER */}
      {activeSub === 'daftar_supplier' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama supplier / kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Supplier Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers
              .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((sup) => (
                <div key={sup.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                        {sup.category}
                      </span>
                      <h3 className="font-bold text-white text-base mt-1">{sup.name}</h3>
                      <p className="text-xs text-zinc-400">PIC: {sup.contactPerson}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                      Rating {sup.rating} ★
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-800/80">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Syarat Pembayaran:</span>
                      <span className="font-bold text-zinc-200">{sup.paymentTerms}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Estimasi Kirim (Lead Time):</span>
                      <span className="font-bold text-zinc-200">{sup.leadTimeDays} Hari Kerja</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80 text-zinc-400">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Phone className="w-3 h-3 text-zinc-500" />
                      {sup.phone}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedSupplier(sup.name);
                        setShowPOModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold transition cursor-pointer"
                    >
                      + Buat Order (PO)
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* VIEW: DAFTAR PEMBELIAN */}
      {activeSub === 'daftar_pembelian' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Daftar Purchase Order (PO) Masuk
            </h3>
            <button
              onClick={() => setShowPOModal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat PO Baru</span>
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">No. PO</th>
                  <th className="py-3 px-4">Tanggal Order</th>
                  <th className="py-3 px-4">Nama Supplier</th>
                  <th className="py-3 px-4 text-center">Status Kirim</th>
                  <th className="py-3 px-4">Status Bayar</th>
                  <th className="py-3 px-4 text-right">Nilai Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {orders.map((po) => (
                  <tr key={po.id} className="hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{po.id}</td>
                    <td className="py-3 px-4 text-zinc-400">{po.date}</td>
                    <td className="py-3 px-4 font-bold text-white">{po.supplier}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          po.deliveryStatus.includes('Diterima')
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {po.deliveryStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-300">{po.paymentStatus}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      Rp {po.totalAmount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: REQUEST PEMBELIAN */}
      {activeSub === 'request_pembelian' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Pengajuan Pembelian Toko (Purchase Requisition)
              </h3>
              <p className="text-xs text-zinc-400">Permintaan restock dari kasir cabang atau tim gudang sebelum dibuatkan PO resmi.</p>
            </div>
            <button
              onClick={() => setShowAddPRModal(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Request Restock</span>
            </button>
          </div>

          <div className="space-y-3">
            {purchaseRequests.map((pr) => (
              <div key={pr.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-purple-400 bg-purple-950/60 border border-purple-800 px-1.5 py-0.5 rounded">
                      {pr.id}
                    </span>
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 border border-rose-800 px-1.5 py-0.5 rounded">
                      {pr.urgency}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{pr.product}</h4>
                  <p className="text-xs text-zinc-400">
                    Jumlah: <strong className="text-zinc-200">{pr.requestedQty}</strong> &bull; Pemohon: {pr.requester}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block">Est. Biaya:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      Rp {pr.estimatedCost.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    {pr.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: PEMBELIAN PRODUK (Quick PO Form & Cart) */}
      {activeSub === 'pembelian_produk' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="font-bold text-white text-base">Pembelian Produk Langsung (Direct Procurement Entry)</h3>
            <p className="text-xs text-zinc-400">Input nota belanja tunai dari pasar induk, distributor lokal, atau grosiran.</p>
          </div>

          <form onSubmit={handleCreatePO} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 font-bold mb-1">Pilih Supplier:</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-bold mb-1">Nama Produk Karton:</label>
              <input
                type="text"
                value={poProduct}
                onChange={(e) => setPoProduct(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-bold mb-1">Jumlah Dus / Karton:</label>
              <input
                type="number"
                min="1"
                value={poCartons}
                onChange={(e) => setPoCartons(Math.max(1, Number(e.target.value)))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-bold mb-1">Harga Beli per Dus (Rp):</label>
              <input
                type="number"
                min="0"
                value={poPricePerCarton}
                onChange={(e) => setPoPricePerCarton(Math.max(0, Number(e.target.value)))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-bold mb-1">Metode Pembayaran:</label>
              <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white">
                <option>Kas Kecil Laci Toko (Cash)</option>
                <option>Transfer Bank BCA Pusat</option>
                <option>Tempo 30 Hari (Hutang Dagang)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm cursor-pointer"
              >
                Proses Pembelian (Rp {(poCartons * poPricePerCarton).toLocaleString('id-ID')})
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: STATISTIK PEMBELIAN */}
      {activeSub === 'statistik_pembelian' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Total Pembelian Bulan Ini</span>
              <span className="text-2xl font-mono font-black text-white mt-1 block">
                Rp 25.590.000
              </span>
              <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                Efisiensi harga grosir +4.2%
              </span>
            </div>

            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Volume Karton Diterima</span>
              <span className="text-2xl font-mono font-black text-amber-400 mt-1 block">
                348 Dus
              </span>
              <span className="text-zinc-400 text-[11px] mt-1 block">99.1% barang lolos QC gudang</span>
            </div>

            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Hutang Dagang Supplier (Tempo)</span>
              <span className="text-2xl font-mono font-black text-rose-400 mt-1 block">
                Rp 6.540.000
              </span>
              <span className="text-zinc-400 text-[11px] mt-1 block">Jatuh tempo 24 Oktober 2026</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add PO */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Buat Purchase Order (PO) Baru</h3>
            <form onSubmit={handleCreatePO} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Supplier Tujuan:</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Item Produk:</label>
                <input
                  type="text"
                  value={poProduct}
                  onChange={(e) => setPoProduct(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Karton (Dus):</label>
                  <input
                    type="number"
                    min="1"
                    value={poCartons}
                    onChange={(e) => setPoCartons(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Harga per Dus (Rp):</label>
                  <input
                    type="number"
                    value={poPricePerCarton}
                    onChange={(e) => setPoPricePerCarton(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-400">Total Purchase:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  Rp {(poCartons * poPricePerCarton).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500"
                >
                  Terbitkan PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Supplier Baru */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Tambah Supplier Baru</h3>
              </div>
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSupplier} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nama Perusahaan / Supplier *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Sumber Pangan Nusantara"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Kategori Produk</label>
                  <input
                    type="text"
                    placeholder="Sembako / Minuman"
                    value={newSupCategory}
                    onChange={(e) => setNewSupCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Term Pembayaran</label>
                  <select
                    value={newSupTerms}
                    onChange={(e) => setNewSupTerms(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cash On Delivery (COD)">COD (Bayar di Tempat)</option>
                    <option value="Tempo 14 Hari">Tempo 14 Hari</option>
                    <option value="Tempo 30 Hari">Tempo 30 Hari</option>
                    <option value="Transfer Dimuka">Transfer Dimuka</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Contact Person (Sales)</label>
                  <input
                    type="text"
                    placeholder="Nama PIC"
                    value={newSupContact}
                    onChange={(e) => setNewSupContact(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="+62 8..."
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-lg"
                >
                  Simpan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request Restock Baru */}
      {showAddPRModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Buat Pengajuan Restock</h3>
              </div>
              <button
                onClick={() => setShowAddPRModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePR} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nama Produk yang Dibutuhkan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Aqua 600ml (Dus) / Indomie Goreng"
                  value={newPrProduct}
                  onChange={(e) => setNewPrProduct(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Jumlah Diminta (Qty) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 30 Dus"
                    value={newPrQty}
                    onChange={(e) => setNewPrQty(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Prioritas / Urgensi</label>
                  <select
                    value={newPrUrgency}
                    onChange={(e) => setNewPrUrgency(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Tinggi (Stok Kritis)">Tinggi (Stok Kritis)</option>
                    <option value="Sedang (Buffer Habis)">Sedang (Buffer Habis)</option>
                    <option value="Normal (Jadwal Rutin)">Normal (Jadwal Rutin)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nama Pemohon / Shift</label>
                <input
                  type="text"
                  value={newPrRequester}
                  onChange={(e) => setNewPrRequester(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Alasan pengajuan restock atau kondisi stok toko..."
                  value={newPrNotes}
                  onChange={(e) => setNewPrNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddPRModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-lg"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
