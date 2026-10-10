import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  CreditCard,
  Sparkles,
  Gift,
  Calendar,
  Search,
  Plus,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  Send,
  X,
  Eye,
  Check,
  ShieldCheck,
  FileText,
  BadgePercent,
  RotateCw,
} from 'lucide-react';

interface CustomerModuleProps {
  subModule:
    | 'daftar_pelanggan'
    | 'tipe_pelanggan'
    | 'hutang_pelanggan'
    | 'poin_pelanggan'
    | 'langganan'
    | 'claim_hadiah';
  currencyMode?: 'IDR' | 'USD';
  onNavigateTab?: (tab: string) => void;
}

export const CustomerModule: React.FC<CustomerModuleProps> = ({
  subModule,
  currencyMode = 'IDR',
  onNavigateTab,
}) => {
  const [activeSub, setActiveSub] = useState<
    'daftar_pelanggan' | 'tipe_pelanggan' | 'hutang_pelanggan' | 'poin_pelanggan' | 'langganan' | 'claim_hadiah'
  >(subModule);

  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize submodule prop
  useEffect(() => {
    if (subModule) {
      setActiveSub(subModule);
    }
  }, [subModule]);

  // Comprehensive Customers Data
  const [customers, setCustomers] = useState([
    {
      id: 'CUST-001',
      name: 'Budi Santoso',
      phone: '+62 812-3456-7890',
      email: 'budi.santoso@gmail.com',
      address: 'Jl. Melati Raya No. 12, RT 03/05 (Radius 350m)',
      type: 'Member VIP PWA',
      creditLimit: 500000,
      points: 2450,
      debtAmount: 0,
      debtAgeDays: 0,
      subscriptionPlan: 'Langganan Galon Aqua & Gas LPG (Mingguan)',
      totalSpent: 4850000,
      lastTransactionDate: '10 Okt 2026',
      status: 'active',
    },
    {
      id: 'CUST-002',
      name: 'Ibu Ratna Dewi',
      phone: '+62 813-9876-5432',
      email: 'ratna.dewi@warungberkah.com',
      address: 'Warung Berkah, Pasar Grosir Blok C-08',
      type: 'Grosir / Reseller Warung',
      creditLimit: 2500000,
      points: 1200,
      debtAmount: 750000,
      debtAgeDays: 6,
      subscriptionPlan: 'Non-Langganan',
      totalSpent: 12400000,
      lastTransactionDate: '10 Okt 2026',
      status: 'active',
    },
    {
      id: 'CUST-003',
      name: 'Pak Ahmad Fauzi',
      phone: '+62 815-5566-7788',
      email: 'ahmad.fauzi@yahoo.com',
      address: 'Komp. Griya Indah Blok D-4',
      type: 'Pelanggan Reguler',
      creditLimit: 200000,
      points: 380,
      debtAmount: 120000,
      debtAgeDays: 16, // Aging overdue (> 14 days)
      subscriptionPlan: 'Non-Langganan',
      totalSpent: 1850000,
      lastTransactionDate: '24 Sep 2026',
      status: 'active',
    },
    {
      id: 'CUST-004',
      name: 'Siti Aminah',
      phone: '+62 817-2233-4455',
      email: 'siti.aminah@gmail.com',
      address: 'Jl. Anggrek No. 8',
      type: 'Member VIP PWA',
      creditLimit: 500000,
      points: 3100,
      debtAmount: 0,
      debtAgeDays: 0,
      subscriptionPlan: 'Langganan Beras & Sembako (Bulanan)',
      totalSpent: 3900000,
      lastTransactionDate: '08 Okt 2026',
      status: 'active',
    },
  ]);

  // Customer Detail Drawer Modal
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Rewards catalog (Claim Hadiah)
  const [rewards, setRewards] = useState([
    {
      id: 'RWD-01',
      name: 'Voucher Belanja Rp 25.000',
      pointsCost: 500,
      stock: 45,
      category: 'Voucher Diskon Toko',
      description: 'Potongan langsung pada transaksi kasir POS atau order online PWA.',
    },
    {
      id: 'RWD-02',
      name: 'Minyak Goreng 1 Liter Pouch',
      pointsCost: 1000,
      stock: 20,
      category: 'Sembako',
      description: 'Minyak goreng kemasan pouch premium bebas kolesterol.',
    },
    {
      id: 'RWD-03',
      name: 'Tumbler Eksklusif RiskCart Stainless',
      pointsCost: 2000,
      stock: 12,
      category: 'Merchandise Eksklusif',
      description: 'Tumbler tahan dingin & panas 12 jam dengan logo RiskCart.',
    },
    {
      id: 'RWD-04',
      name: 'Gratis 1 Galon Aqua Refill',
      pointsCost: 750,
      stock: 50,
      category: 'Air Galon',
      description: 'Refill galon air mineral resmi higienis.',
    },
  ]);

  // Points Ledger History
  const [pointLedger, setPointLedger] = useState([
    {
      id: 'PTS-202610-01',
      date: '10 Okt 2026, 11:35 WIB',
      customerName: 'Budi Santoso',
      type: 'EARNED',
      amount: +18,
      refDoc: 'POS #TRX-202610-984',
      notes: 'Perolehan belanja kelipatan Rp 10.000',
      runningBalance: 2450,
    },
    {
      id: 'PTS-202610-02',
      date: '08 Okt 2026, 14:10 WIB',
      customerName: 'Siti Aminah',
      type: 'REDEEMED',
      amount: -500,
      refDoc: 'CLAIM #CLM-202610-09',
      notes: 'Penukaran Voucher Diskon Rp 25.000',
      runningBalance: 3100,
    },
    {
      id: 'PTS-202610-03',
      date: '01 Okt 2026, 09:00 WIB',
      customerName: 'Budi Santoso',
      type: 'BONUS',
      amount: +100,
      refDoc: 'PROMO-VIP-REG',
      notes: 'Bonus Registrasi Akun PWA',
      runningBalance: 2432,
    },
  ]);

  // Subscriptions (Langganan)
  const [subscriptions, setSubscriptions] = useState([
    {
      id: 'SUB-202610-01',
      customerName: 'Budi Santoso',
      planName: 'Langganan Galon Aqua & Gas LPG 3Kg',
      billingCycle: 'Mingguan (Setiap Selasa & Jumat)',
      nextDeliveryDate: '13 Okt 2026',
      billingAmount: 70000,
      status: 'active',
    },
    {
      id: 'SUB-202610-02',
      customerName: 'Siti Aminah',
      planName: 'Langganan Paket Sembako Keluarga (Beras 5Kg, Minyak 2L, Telur 1Kg)',
      billingCycle: 'Bulanan (Tanggal 1)',
      nextDeliveryDate: '01 Nov 2026',
      billingAmount: 185000,
      status: 'active',
    },
    {
      id: 'SUB-202610-03',
      customerName: 'Kantor Notaris Sejahtera',
      planName: 'Langganan Kopi, Teh & Snack Bulanan',
      billingCycle: 'Dua Mingguan',
      nextDeliveryDate: '15 Okt 2026',
      billingAmount: 320000,
      status: 'paused',
    },
  ]);

  // Modal State for New Customer
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newType, setNewType] = useState('Pelanggan Reguler');
  const [newCreditLimit, setNewCreditLimit] = useState('500000');

  // Modal State for Debt Repayment (Pelunasan Kasbon)
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [repayCustomer, setRepayCustomer] = useState<any>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayMethod, setRepayMethod] = useState('Kas Kasir Tunai');

  // Modal State for Claim Reward
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [claimCustomerName, setClaimCustomerName] = useState('Budi Santoso');
  const [claimSuccessData, setClaimSuccessData] = useState<{ token: string; name: string } | null>(null);

  // Modal State for Manual Points Adjustment
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [ptsCustomerName, setPtsCustomerName] = useState('Budi Santoso');
  const [ptsAmount, setPtsAmount] = useState('100');
  const [ptsReason, setPtsReason] = useState('Kompensasi Keterlambatan Pengiriman');

  // Handle Create Customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    const item = {
      id: `CUST-00${customers.length + 1}`,
      name: newName,
      phone: newPhone || '+62 812-0000-0000',
      email: `${newName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      address: newAddress || 'Area Sekitar Outlet',
      type: newType,
      creditLimit: Number(newCreditLimit) || 0,
      points: 100, // Welcome points
      debtAmount: 0,
      debtAgeDays: 0,
      subscriptionPlan: 'Non-Langganan',
      totalSpent: 0,
      lastTransactionDate: 'Baru Terdaftar',
      status: 'active',
    };
    setCustomers([item, ...customers]);
    setShowAddCustomer(false);
    setNewName('');
    setNewPhone('');
    setNewAddress('');
  };

  // Handle Repay Debt
  const handleRepayDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayCustomer) return;
    const amountVal = Number(repayAmount);
    if (!amountVal || amountVal <= 0) return;

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === repayCustomer.id
          ? { ...c, debtAmount: Math.max(0, c.debtAmount - amountVal) }
          : c
      )
    );
    setShowRepaymentModal(false);
    alert(`Pelunasan hutang sebesar Rp ${amountVal.toLocaleString('id-ID')} untuk ${repayCustomer.name} berhasil dicatat.`);
  };

  // Handle Claim Reward with Atomic Validation
  const handleClaimReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReward) return;

    const customerObj = customers.find((c) => c.name === claimCustomerName);
    if (!customerObj) return;

    if (customerObj.points < selectedReward.pointsCost) {
      alert(`Poin pelanggan tidak mencukupi! Poin saat ini: ${customerObj.points}, dibutuhkan: ${selectedReward.pointsCost}`);
      return;
    }

    if (selectedReward.stock <= 0) {
      alert(`Stok hadiah fisik "${selectedReward.name}" telah habis.`);
      return;
    }

    // Atomic deduction: update customer points & reward stock
    setCustomers((prev) =>
      prev.map((c) =>
        c.name === claimCustomerName
          ? { ...c, points: c.points - selectedReward.pointsCost }
          : c
      )
    );

    setRewards((prev) =>
      prev.map((r) =>
        r.id === selectedReward.id ? { ...r, stock: r.stock - 1 } : r
      )
    );

    const tokenCode = `RC-GIFT-${Date.now().toString().slice(-6)}`;
    const newPointEntry = {
      id: `PTS-CLM-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleDateString('id-ID') + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      customerName: claimCustomerName,
      type: 'REDEEMED',
      amount: -selectedReward.pointsCost,
      refDoc: `TOKEN #${tokenCode}`,
      notes: `Klaim Hadiah: ${selectedReward.name}`,
      runningBalance: customerObj.points - selectedReward.pointsCost,
    };
    setPointLedger([newPointEntry, ...pointLedger]);

    setClaimSuccessData({
      token: tokenCode,
      name: selectedReward.name,
    });
  };

  // Handle Add Manual Points
  const handleAddManualPoints = (e: React.FormEvent) => {
    e.preventDefault();
    const ptsNum = Number(ptsAmount);
    if (!ptsNum) return;

    setCustomers((prev) =>
      prev.map((c) =>
        c.name === ptsCustomerName ? { ...c, points: c.points + ptsNum } : c
      )
    );

    const newEntry = {
      id: `PTS-MAN-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleDateString('id-ID') + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      customerName: ptsCustomerName,
      type: 'BONUS',
      amount: ptsNum,
      refDoc: 'MANUAL-ADJUSTMENT',
      notes: ptsReason,
      runningBalance: ((customers.find((c) => c.name === ptsCustomerName)?.points || 0) + ptsNum),
    };
    setPointLedger([newEntry, ...pointLedger]);
    setShowPointsModal(false);
  };

  // Filtered Debt Records & Aging
  const debtRecords = customers.filter((c) => c.debtAmount > 0);
  const totalDebtActive = debtRecords.reduce((a, b) => a + b.debtAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-black text-white tracking-tight">
              5.15 PELANGGAN &amp; LOYALTY CRM
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Direktori profil pelanggan, penegakan batas kredit kasbon, tiering diskon member VIP PWA, paket langganan rutin, dan penukaran hadiah poin atomik.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveSub('daftar_pelanggan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSub === 'daftar_pelanggan' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Daftar Pelanggan
          </button>
          <button
            onClick={() => setActiveSub('tipe_pelanggan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSub === 'tipe_pelanggan' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tipe Pelanggan
          </button>
          <button
            onClick={() => setActiveSub('hutang_pelanggan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeSub === 'hutang_pelanggan' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Hutang Pelanggan</span>
          </button>
          <button
            onClick={() => setActiveSub('poin_pelanggan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeSub === 'poin_pelanggan' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Poin Pelanggan</span>
          </button>
          <button
            onClick={() => setActiveSub('langganan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeSub === 'langganan' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Langganan</span>
          </button>
          <button
            onClick={() => setActiveSub('claim_hadiah')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeSub === 'claim_hadiah' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Claim Hadiah</span>
          </button>
        </div>
      </div>

      {/* VIEW: DAFTAR PELANGGAN */}
      {activeSub === 'daftar_pelanggan' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama / nomor WhatsApp / alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowAddCustomer(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Pelanggan Baru</span>
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">ID &amp; Nama Lengkap</th>
                  <th className="py-3 px-4">Kontak &amp; Alamat</th>
                  <th className="py-3 px-4">Tipe Akun</th>
                  <th className="py-3 px-4 text-right">Plafon Kasbon</th>
                  <th className="py-3 px-4 text-right">Poin Loyalitas</th>
                  <th className="py-3 px-4 text-right">Piutang Berjalan</th>
                  <th className="py-3 px-4 text-center">Aksi Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {customers
                  .filter((c) =>
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.phone.includes(searchQuery) ||
                    c.address.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-800/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{c.name}</span>
                        <span className="font-mono text-[10px] text-zinc-500">{c.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-zinc-300 font-mono">{c.phone}</div>
                        <div className="text-[10px] text-zinc-500 truncate max-w-xs">{c.address}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.type.includes('VIP')
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : c.type.includes('Grosir')
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {c.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-300">
                        Rp {c.creditLimit.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {c.points.toLocaleString('id-ID')} Pts
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {c.debtAmount > 0 ? (
                          <span className="text-rose-400">Rp {c.debtAmount.toLocaleString('id-ID')}</span>
                        ) : (
                          <span className="text-zinc-500">Rp 0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Profil</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: TIPE PELANGGAN */}
      {activeSub === 'tipe_pelanggan' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl">
            <h3 className="font-bold text-white text-sm">Matriks Kebijakan Tingkatan (Tiering &amp; Privileges)</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Setiap tingkatan akun menentukan diskon otomatis saat kasir POS, pengali poin belanja, serta plafon batas kasbon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-purple-800/60 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-700 uppercase">
                  MEMBER VIP PWA
                </span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="font-bold text-white text-base">Pelanggan VIP Client PWA</h3>
              <p className="text-xs text-zinc-400">
                Member terverifikasi melalui aplikasi Client PWA dengan nomor handphone &amp; OTP.
              </p>
              <div className="space-y-1.5 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  <span><strong>Diskon 5%</strong> otomatis seluruh transaksi retail</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  <span>Pengumpulan <strong>Poin x2</strong> per Rp 10.000 belanja</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  <span>Plafon Kasbon Tempo: <strong>Rp 500.000</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  <span>Bebas ongkir kurir toko radius 500 meter</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-amber-800/60 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700 uppercase">
                  GROSIR / RESELLER
                </span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="font-bold text-white text-base">Warung &amp; Reseller Satelit</h3>
              <p className="text-xs text-zinc-400">
                Mitra dagang toko kelontong sekitar yang membeli barang dalam partai karton/dus besar.
              </p>
              <div className="space-y-1.5 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span><strong>Harga Karton Grosir</strong> khusus (Tier 2/3)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Plafon Kasbon Tempo: <strong>Rp 2.500.000</strong> (Tempo 14 Hari)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Prioritas dropping stok barang dari gudang</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 uppercase">
                  REGULER WALK-IN
                </span>
                <Users className="w-4 h-4 text-zinc-400" />
              </div>
              <h3 className="font-bold text-white text-base">Pelanggan Umum Toko</h3>
              <p className="text-xs text-zinc-400">
                Pembeli umum tanpa registrasi kartu member atau aplikasi PWA.
              </p>
              <div className="space-y-1.5 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Harga jual retail standar katalog</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Plafon Kasbon: <strong>Rp 0</strong> (Wajib Bayar Lunas)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Dapat diarahkan kasir untuk registrasi PWA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: HUTANG PELANGGAN (PIUTANG DAGANG) */}
      {activeSub === 'hutang_pelanggan' && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-white text-sm">Buku Piutang &amp; Kasbon Pelanggan Toko</h4>
              <p className="text-xs text-zinc-400">
                Pelacakan plafon kredit, tanggal jatuh tempo (aging report), dan pencatatan pelunasan resmi tanpa menduplikasi omzet.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase block font-bold">Total Piutang Berjalan</span>
              <span className="text-2xl font-mono font-black text-rose-400">
                Rp {totalDebtActive.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">Kontak &amp; Tipe</th>
                  <th className="py-3 px-4 text-right">Plafon Kredit</th>
                  <th className="py-3 px-4 text-right">Total Kasbon</th>
                  <th className="py-3 px-4 text-center">Status Aging</th>
                  <th className="py-3 px-4 text-center">Aksi Penagihan &amp; Pelunasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {debtRecords.map((c) => {
                  const isOverdue = c.debtAgeDays > 14;
                  const isWarning = c.debtAgeDays >= 7 && c.debtAgeDays <= 14;

                  return (
                    <tr key={c.id} className="hover:bg-zinc-800/40 transition">
                      <td className="py-3 px-4 font-bold text-white">
                        {c.name}
                        <span className="block text-[10px] text-zinc-500 font-normal">{c.address}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-zinc-300">{c.phone}</span>
                        <span className="block text-[10px] text-zinc-400">{c.type}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-300">
                        Rp {c.creditLimit.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        Rp {c.debtAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOverdue
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : isWarning
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {isOverdue ? `Menunggak (${c.debtAgeDays} hr)` : `Tempo (${c.debtAgeDays} hr)`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setRepayCustomer(c);
                              setRepayAmount(String(c.debtAmount));
                              setShowRepaymentModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer"
                          >
                            Lunasi Kasbon
                          </button>
                          <button
                            onClick={() => alert(`Pesan pengingat tagihan WhatsApp otomatis dikirim ke ${c.phone}`)}
                            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                            title="Kirim Pengingat WA"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: POIN PELANGGAN */}
      {activeSub === 'poin_pelanggan' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">Sistem Poin Belanja &amp; Riwayat Ledger</h4>
                <p className="text-xs text-zinc-400">
                  Setiap pembelanjaan Rp 10.000 menghasilkan 1 Poin (1 Poin bernilai potongan Rp 50). Berlaku 12 bulan sejak perolehan.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPointsModal(true)}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer"
              >
                + Beri Poin Manual
              </button>
              <button
                onClick={() => setActiveSub('claim_hadiah')}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Katalog Hadiah
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">No. Reff</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Aktivitas / Referensi</th>
                  <th className="py-3 px-4 text-center">Poin</th>
                  <th className="py-3 px-4 text-right">Saldo Berjalan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {pointLedger.map((pl) => (
                  <tr key={pl.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{pl.id}</td>
                    <td className="py-3 px-4 text-zinc-400">{pl.date}</td>
                    <td className="py-3 px-4 font-bold text-white">{pl.customerName}</td>
                    <td className="py-3 px-4">
                      <span className="text-zinc-300 block">{pl.notes}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{pl.refDoc}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={pl.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {pl.amount > 0 ? `+${pl.amount}` : pl.amount} Pts
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {pl.runningBalance} Pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: LANGGANAN */}
      {activeSub === 'langganan' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Paket Langganan Rutin (Auto-Delivery &amp; Invoicing)
              </h3>
              <p className="text-xs text-zinc-400">
                Pengantaran terjadwal air galon, gas LPG, sembako bulanan, dan pasokan rutin warung makan.
              </p>
            </div>
            <button
              onClick={() => alert('Form langganan baru dibuka!')}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Langganan Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 uppercase">
                      {sub.status === 'active' ? 'AKTIF' : 'DIJEDA'}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">{sub.id}</span>
                  </div>
                  <h4 className="font-bold text-white text-base mt-2">{sub.customerName}</h4>
                  <p className="text-xs text-purple-400 font-medium mt-1">{sub.planName}</p>
                  <p className="text-xs text-zinc-400 mt-2">
                    Jadwal: <strong>{sub.billingCycle}</strong>
                  </p>
                  <p className="text-xs text-zinc-400">
                    Pengiriman Berikutnya: <strong className="text-emerald-400">{sub.nextDeliveryDate}</strong>
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    Rp {sub.billingAmount.toLocaleString('id-ID')}
                  </span>
                  <button
                    onClick={() => {
                      setSubscriptions((prev) =>
                        prev.map((s) =>
                          s.id === sub.id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s
                        )
                      );
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
                  >
                    {sub.status === 'active' ? 'Jeda' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: CLAIM HADIAH */}
      {activeSub === 'claim_hadiah' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Katalog Penukaran Hadiah Poin Pelanggan (Atomic Fulfillment)
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Poin akan dipotong secara atomik setelah memastikan saldo pelanggan mencukupi dan stok hadiah fisik tersedia.
              </p>
            </div>
            <div className="text-xs text-zinc-300 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
              Total Hadiah Aktif: <strong className="text-white">{rewards.length} Item</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rewards.map((r) => (
              <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-sm hover:border-zinc-700 transition">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-1.5 py-0.5 rounded">
                      {r.category}
                    </span>
                    <span className="text-xs text-zinc-400">Sisa: <strong className="text-white font-mono">{r.stock}</strong></span>
                  </div>
                  <h4 className="font-bold text-white text-sm mt-2">{r.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{r.description}</p>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400 text-xs">
                    {r.pointsCost} Poin
                  </span>
                  <button
                    onClick={() => {
                      setSelectedReward(r);
                      setClaimSuccessData(null);
                      setShowClaimModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer transition shadow-sm"
                  >
                    Klaim Hadiah
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOMER */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Tambah Pelanggan Baru</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  placeholder="Nama pembeli / pemilik warung"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">No. WhatsApp / Telepon:</label>
                <input
                  type="text"
                  required
                  placeholder="+62 812-..."
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Alamat Domisili / Warung:</label>
                <input
                  type="text"
                  placeholder="Jl. Melati No. 1..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Tipe Akun:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Pelanggan Reguler">Pelanggan Reguler</option>
                    <option value="Member VIP PWA">Member VIP PWA</option>
                    <option value="Grosir / Reseller Warung">Grosir / Reseller</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Plafon Kasbon (Rp):</label>
                  <input
                    type="number"
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL CUSTOMER PROFILE */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">{selectedCustomer.name}</h3>
                <span className="text-xs text-zinc-400 font-mono">{selectedCustomer.id} &bull; {selectedCustomer.type}</span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                <div>
                  <span className="text-zinc-500 block">WhatsApp:</span>
                  <span className="text-white font-mono font-bold">{selectedCustomer.phone}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Email:</span>
                  <span className="text-zinc-300">{selectedCustomer.email}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500 block">Alamat Antar:</span>
                  <span className="text-zinc-300">{selectedCustomer.address}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Poin Tersedia</span>
                  <span className="text-base font-black font-mono text-amber-400 mt-1 block">
                    {selectedCustomer.points} Pts
                  </span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Sisa Kasbon</span>
                  <span className="text-base font-black font-mono text-rose-400 mt-1 block">
                    Rp {selectedCustomer.debtAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Total Belanja LTV</span>
                  <span className="text-base font-black font-mono text-emerald-400 mt-1 block">
                    Rp {selectedCustomer.totalSpent.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Status Paket Langganan:</span>
                <span className="text-white font-medium">{selectedCustomer.subscriptionPlan}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DEBT REPAYMENT (LUNASI KASBON) */}
      {showRepaymentModal && repayCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base">Pelunasan Kasbon Piutang</h3>
            <p className="text-xs text-zinc-400">
              Pelunasan oleh <strong>{repayCustomer.name}</strong>. Saldo hutang aktif saat ini: <strong className="text-rose-400">Rp {repayCustomer.debtAmount.toLocaleString('id-ID')}</strong>.
            </p>
            <form onSubmit={handleRepayDebt} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nominal Pembayaran (Rp):</label>
                <input
                  type="number"
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Diterima Melalui:</label>
                <select
                  value={repayMethod}
                  onChange={(e) => setRepayMethod(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Kas Kasir Tunai">Kas Kasir Tunai</option>
                  <option value="Transfer Bank BCA Toko">Transfer Bank BCA Toko</option>
                  <option value="Transfer Bank Mandiri Toko">Transfer Bank Mandiri Toko</option>
                </select>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowRepaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLAIM REWARD (ATOMIC POINT DEDUCTION) */}
      {showClaimModal && selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base">Klaim Hadiah Loyalty Point</h3>
            
            {!claimSuccessData ? (
              <form onSubmit={handleClaimReward} className="space-y-3 text-xs">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-zinc-400 block">Item Hadiah:</span>
                  <strong className="text-white text-sm block">{selectedReward.name}</strong>
                  <span className="text-amber-400 font-mono font-bold">{selectedReward.pointsCost} Poin Diperlukan</span>
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Pilih Member Penukar:</label>
                  <select
                    value={claimCustomerName}
                    onChange={(e) => setClaimCustomerName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} (Saldo: {c.points} Pts)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500"
                  >
                    Tukar Sekarang
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-800">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Penukaran Hadiah Berhasil!</h4>
                  <p className="text-xs text-zinc-400 mt-1">Poin telah dipotong secara otomatis &amp; stok fisik berkurang 1 unit.</p>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-emerald-400 font-bold text-sm tracking-wider">
                  TOKEN: {claimSuccessData.token}
                </div>
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  Selesai
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: MANUAL POINTS ADJUSTMENT */}
      {showPointsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base">Beri Poin Manual / Kompensasi</h3>
            <form onSubmit={handleAddManualPoints} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Pilih Pelanggan:</label>
                <select
                  value={ptsCustomerName}
                  onChange={(e) => setPtsCustomerName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.points} Pts)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Jumlah Poin Tambahan:</label>
                <input
                  type="number"
                  required
                  value={ptsAmount}
                  onChange={(e) => setPtsAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Alasan Penambahan:</label>
                <input
                  type="text"
                  required
                  value={ptsReason}
                  onChange={(e) => setPtsReason(e.target.value)}
                  placeholder="Kompensasi kendala pengiriman PWA..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPointsModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-500"
                >
                  Posting Poin ke Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
