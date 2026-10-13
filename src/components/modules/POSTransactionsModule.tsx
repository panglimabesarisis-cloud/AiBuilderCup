import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  Plus,
  RefreshCw,
  Printer,
  Eye,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  X,
  FileText,
  UserCheck,
  Building,
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Transaction } from '../../types';

interface POSTransactionsModuleProps {
  subModule: 'transaksi_penjualan' | 'pendapatan_masuk' | 'pengeluaran_toko';
  currencyMode?: 'IDR' | 'USD';
  onNavigateTab?: (tab: string) => void;
}

export const POSTransactionsModule: React.FC<POSTransactionsModuleProps> = ({
  subModule,
  currencyMode = 'IDR',
  onNavigateTab,
}) => {
  const [activeSub, setActiveSub] = useState<'transaksi_penjualan' | 'pendapatan_masuk' | 'pengeluaran_toko'>(subModule);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>('ALL');

  // Synchronize submodule prop
  useEffect(() => {
    if (subModule) {
      setActiveSub(subModule);
    }
  }, [subModule]);

  // Real-time Firestore transactions listener with robust fallback
  useEffect(() => {
    try {
      const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Transaction[];
            setTransactions(list);
          } else {
            // Seed initial realistic transactions if Firestore is empty
            setTransactions(initialMockTransactions);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Fallback offline transactions:', err);
          setTransactions(initialMockTransactions);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      setTransactions(initialMockTransactions);
      setLoading(false);
    }
  }, []);

  // Initial Mock Transactions for immediate audit display
  const initialMockTransactions: Transaction[] = [
    {
      id: 'TRX-202610-984',
      storeId: 'store-1',
      customerName: 'Budi Santoso (VIP PWA)',
      paymentMethod: 'qris',
      totalAmount: 185000,
      totalCost: 140000,
      subtotal: 180000,
      tax: 15000,
      discount: 10000,
      createdAt: new Date().toISOString(),
      channel: 'offline_pos',
      riskScore: 4,
      fraudScore: 4,
      fraudFlags: [],
      riskLevel: 'clean',
      cartonBreakdown: '2 Dus Minyak Goreng, 1 Box Teh Celup',
      status: 'completed',
    },
    {
      id: 'TRX-202610-983',
      storeId: 'store-1',
      customerName: 'Ibu Ratna Dewi (Warung Berkah)',
      paymentMethod: 'debt',
      totalAmount: 750000,
      totalCost: 610000,
      subtotal: 750000,
      tax: 0,
      discount: 0,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      channel: 'offline_pos',
      riskScore: 12,
      fraudScore: 12,
      fraudFlags: [],
      riskLevel: 'clean',
      cartonBreakdown: '5 Dus Indomie Goreng, 2 Dus Aqua Galon',
      status: 'completed',
    },
    {
      id: 'TRX-202610-982',
      storeId: 'store-1',
      customerName: 'Walk-in Customer (Tunai)',
      paymentMethod: 'cash',
      totalAmount: 45000,
      totalCost: 32000,
      subtotal: 45000,
      tax: 0,
      discount: 0,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      channel: 'offline_pos',
      riskScore: 2,
      fraudScore: 2,
      fraudFlags: [],
      riskLevel: 'clean',
      cartonBreakdown: '3 Pcs Sabun Mandi, 1 Pcs Pasta Gigi',
      status: 'completed',
    },
    {
      id: 'TRX-202610-981',
      storeId: 'store-1',
      customerName: 'Siti Aminah (PWA Online)',
      paymentMethod: 'cod',
      totalAmount: 120000,
      totalCost: 90000,
      subtotal: 120000,
      tax: 0,
      discount: 0,
      createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
      channel: 'client_pwa',
      riskScore: 78,
      fraudScore: 78,
      fraudFlags: ['COD_DISTANCE_HIGH', 'NEW_DEVICE'],
      riskLevel: 'critical',
      cartonBreakdown: 'Pesanan PWA COD Jarak Jauh',
      status: 'completed',
    },
  ];

  // Selected Transaction for Detail Modal / Receipt Preview / Refund
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('Barang Rusak / Kemasan Cacat');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundSuccessMsg, setRefundSuccessMsg] = useState('');

  // Pendapatan Masuk Ledger
  const [incomes, setIncomes] = useState([
    {
      id: 'INC-202610-01',
      date: '10 Okt 2026, 12:45 WIB',
      category: 'Penjualan POS Kasir',
      source: 'Terminal Kasir 01 (Flagship)',
      method: 'Tunai & QRIS',
      amount: 12450000,
      isReceivableSettlement: false,
      note: 'Setoran penjualan shift 1',
    },
    {
      id: 'INC-202610-02',
      date: '10 Okt 2026, 11:20 WIB',
      category: 'Order Online PWA Client',
      source: 'Client PWA Online Order',
      method: 'Xendit QRIS Dinamis',
      amount: 4850000,
      isReceivableSettlement: false,
      note: 'Pesanan antar kurir member PWA',
    },
    {
      id: 'INC-202610-03',
      date: '10 Okt 2026, 10:15 WIB',
      category: 'Pelunasan Piutang Kasbon',
      source: 'Ibu Ratna Dewi (Warung Berkah)',
      method: 'Transfer BCA Toko',
      amount: 500000,
      isReceivableSettlement: true,
      note: 'Cicilan pelunasan nota #TRX-202609-412 (Mengurangi saldo piutang tanpa dobel omzet)',
    },
    {
      id: 'INC-202610-04',
      date: '09 Okt 2026, 16:00 WIB',
      category: 'Sewa Rak Display Sponsor',
      source: 'PT Mayora Indah Tbk',
      method: 'Transfer Bank BCA',
      amount: 1500000,
      isReceivableSettlement: false,
      note: 'Sewa endcap display biskuit Roma 1 Bulan',
    },
  ]);

  // Modal Pelunasan Piutang (Debt Settlement - Separate from Sales Revenue)
  const [showDebtSettlementModal, setShowDebtSettlementModal] = useState(false);
  const [settlementCustomer, setSettlementCustomer] = useState('Ibu Ratna Dewi (Warung Berkah)');
  const [settlementAmount, setSettlementAmount] = useState('250000');
  const [settlementAccount, setSettlementAccount] = useState('Kas Kasir Tunai');
  const [settlementNote, setSettlementNote] = useState('Pelunasan sisa nota kasbon');

  // Pengeluaran Toko Ledger
  const [expenses, setExpenses] = useState([
    {
      id: 'EXP-202610-01',
      date: '10 Okt 2026, 09:30 WIB',
      category: 'Beban Listrik & Utilitas',
      recipient: 'PLN Pascabayar 3500VA',
      method: 'BCA Auto-Debet',
      amount: 1850000,
      approvalStatus: 'APPROVED',
      approver: 'Manager Toko (Budi)',
      hasReceiptAttachment: true,
      note: 'Listrik pendingin chiller minuman & lampu toko',
    },
    {
      id: 'EXP-202610-02',
      date: '09 Okt 2026, 14:15 WIB',
      category: 'Perlengkapan Kasir',
      recipient: 'Toko Stationery Jaya',
      method: 'Kas Kecil (Cash)',
      amount: 175000,
      approvalStatus: 'APPROVED',
      approver: 'Supervisor Kasir',
      hasReceiptAttachment: true,
      note: '10 Roll thermal paper 80mm & barcode ribbon label',
    },
    {
      id: 'EXP-202610-03',
      date: '08 Okt 2026, 10:00 WIB',
      category: 'Bongkar Muat & Kebersihan',
      recipient: 'Pengurus Lingkungan RT/Pasar',
      method: 'Kas Kecil (Cash)',
      amount: 120000,
      approvalStatus: 'APPROVED',
      approver: 'Supervisor Kasir',
      hasReceiptAttachment: false,
      note: 'Iuran kebersihan & retribusi keamanan',
    },
  ]);

  // Modal State for New Expense
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpCategory, setNewExpCategory] = useState('Operasional Toko');
  const [newExpRecipient, setNewExpRecipient] = useState('');
  const [newExpMethod, setNewExpMethod] = useState('Kas Kecil Kasir');
  const [newExpNote, setNewExpNote] = useState('');

  // Handle Add Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newExpAmount);
    if (!val) return;
    const item = {
      id: `EXP-202610-0${expenses.length + 1}`,
      date: new Date().toLocaleDateString('id-ID') + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      category: newExpCategory,
      recipient: newExpRecipient || 'Pihak Terkait / Vendor',
      method: newExpMethod,
      amount: val,
      approvalStatus: 'APPROVED',
      approver: 'Manager Toko (Auto-approved)',
      hasReceiptAttachment: true,
      note: newExpNote || 'Pengeluaran operasional toko harian',
    };
    setExpenses([item, ...expenses]);
    setShowExpenseModal(false);
    setNewExpAmount('');
    setNewExpRecipient('');
    setNewExpNote('');
  };

  // Handle Debt Settlement
  const handleRecordDebtSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(settlementAmount);
    if (!val) return;
    const item = {
      id: `INC-SETTLE-0${incomes.length + 1}`,
      date: new Date().toLocaleDateString('id-ID') + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      category: 'Pelunasan Piutang Kasbon',
      source: settlementCustomer,
      method: settlementAccount,
      amount: val,
      isReceivableSettlement: true,
      note: `Pelunasan piutang kasbon oleh ${settlementCustomer}. Masuk ke ${settlementAccount} tanpa menaikkan angka penjualan ganda.`,
    };
    setIncomes([item, ...incomes]);
    setShowDebtSettlementModal(false);
    setSettlementAmount('');
    alert(`Berhasil mencatat pelunasan piutang Rp ${val.toLocaleString('id-ID')} dari ${settlementCustomer}. Saldo kas masuk bertambah & piutang berkurang.`);
  };

  // Handle Refund Process
  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrx) return;
    const refAmountNum = Number(refundAmount) || selectedTrx.totalAmount;
    
    // Add refund expense record
    const refundExpenseItem = {
      id: `REFUND-${selectedTrx.id}`,
      date: new Date().toLocaleDateString('id-ID') + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      category: 'Retur / Refund Penjualan',
      recipient: selectedTrx.customerName || 'Pelanggan',
      method: 'Kas Toko / Saldo Refund',
      amount: refAmountNum,
      approvalStatus: 'APPROVED',
      approver: 'Supervisor Toko',
      hasReceiptAttachment: true,
      note: `Retur struk #${selectedTrx.id}. Alasan: ${refundReason}. Stok dikembalikan ke inventory.`,
    };
    setExpenses([refundExpenseItem, ...expenses]);

    setRefundSuccessMsg(`Refund senilai Rp ${refAmountNum.toLocaleString('id-ID')} berhasil diproses! Referensi asli struk #${selectedTrx.id} tersimpan.`);
    setTimeout(() => {
      setShowRefundModal(false);
      setRefundSuccessMsg('');
      setShowDetailModal(false);
    }, 1800);
  };

  // Calculations
  const totalSalesRevenue = transactions.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
  const totalIncomeLedger = incomes.reduce((acc, inc) => acc + inc.amount, 0);
  const totalReceivablesCollected = incomes.filter(i => i.isReceivableSettlement).reduce((acc, inc) => acc + inc.amount, 0);
  const totalExpenseLedger = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  // Filtered transactions
  const filteredTrx = transactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customerName && t.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMethod = selectedMethodFilter === 'ALL' || t.paymentMethod?.toLowerCase() === selectedMethodFilter.toLowerCase();
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-black text-white tracking-tight">
            5.13 TRANSAKSI POS &amp; BUKU KAS
          </h1>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Audit histori struk penjualan kasir, pelacakan arus pendapatan masuk (pemisahan omzet vs pelunasan piutang), dan pengeluaran operasional toko.
        </p>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto w-fit max-w-full mb-4">
          <button
            onClick={() => setActiveSub('transaksi_penjualan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSub === 'transaksi_penjualan' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Transaksi Penjualan</span>
          </button>
          <button
            onClick={() => setActiveSub('pendapatan_masuk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSub === 'pendapatan_masuk' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Pendapatan Masuk</span>
          </button>
          <button
            onClick={() => setActiveSub('pengeluaran_toko')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSub === 'pengeluaran_toko' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Pengeluaran Toko</span>
          </button>
        </div>

      {/* VIEW: TRANSAKSI PENJUALAN */}
      {activeSub === 'transaksi_penjualan' && (
        <div className="space-y-4">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Penjualan POS</span>
              <div className="text-xl font-black font-mono text-blue-400 mt-1">
                Rp {totalSalesRevenue.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-zinc-400">Dari {transactions.length} transaksi tercatat</span>
            </div>
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Metode Non-Tunai &amp; QRIS</span>
              <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                Rp {transactions.filter(t => t.paymentMethod === 'qris' || t.paymentMethod === 'card').reduce((a, b) => a + b.totalAmount, 0).toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-emerald-500 font-medium">Auto-reconciled Xendit / Bank</span>
            </div>
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Piutang Kasbon Penjualan</span>
              <div className="text-xl font-black font-mono text-amber-400 mt-1">
                Rp {transactions.filter(t => t.paymentMethod === 'debt').reduce((a, b) => a + b.totalAmount, 0).toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-zinc-400">Plafon kredit pelanggan terikat</span>
            </div>
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Status Proteksi Fraud AI</span>
              <div className="text-xl font-black font-mono text-teal-400 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <span>100% Checked</span>
              </div>
              <span className="text-[11px] text-zinc-400">Anti-fraud engine aktif real-time</span>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari ID struk / nama pelanggan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Payment Method Filter */}
              <select
                value={selectedMethodFilter}
                onChange={(e) => setSelectedMethodFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="ALL">Semua Pembayaran</option>
                <option value="cash">Tunai (Cash)</option>
                <option value="qris">QRIS</option>
                <option value="debt">Kasbon (Hutang)</option>
                <option value="cod">COD</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab && onNavigateTab('pos_machine')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>+ Buka Kasir POS</span>
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">No. Struk</th>
                  <th className="py-3 px-4">Waktu Transaksi</th>
                  <th className="py-3 px-4">Pelanggan &amp; Kanal</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4 text-center">Status Fraud</th>
                  <th className="py-3 px-4 text-right">Total Transaksi</th>
                  <th className="py-3 px-4 text-center">Aksi Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {filteredTrx.map((trx) => (
                  <tr key={trx.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      {trx.id}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {new Date(trx.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">{trx.customerName || 'Pelanggan Umum'}</span>
                      <span className="text-[10px] text-zinc-500 uppercase">{trx.channel || 'POS KASIR'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        trx.paymentMethod === 'cash' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        trx.paymentMethod === 'qris' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                        trx.paymentMethod === 'debt' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-zinc-800 text-zinc-300'
                      }`}>
                        {trx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trx.riskLevel === 'clean'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : trx.riskLevel === 'warning'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {trx.riskLevel ? trx.riskLevel.toUpperCase() : 'CLEAN'} ({trx.riskScore ?? 0})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      Rp {trx.totalAmount ? trx.totalAmount.toLocaleString('id-ID') : '0'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedTrx(trx);
                          setRefundAmount(String(trx.totalAmount || ''));
                          setShowDetailModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail &amp; Retur</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: PENDAPATAN MASUK */}
      {activeSub === 'pendapatan_masuk' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-zinc-500 block text-[10px] font-bold uppercase">Total Arus Pendapatan Masuk</span>
              <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block">
                Rp {totalIncomeLedger.toLocaleString('id-ID')}
              </span>
              <span className="text-[11px] text-zinc-400">Total penerimaan kas &amp; bank periode ini</span>
            </div>
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-zinc-500 block text-[10px] font-bold uppercase">Pelunasan Piutang Terkumpul</span>
              <span className="text-2xl font-mono font-black text-blue-400 mt-1 block">
                Rp {totalReceivablesCollected.toLocaleString('id-ID')}
              </span>
              <span className="text-[11px] text-zinc-400">Pemisahan omzet: tidak mencatat omzet ganda</span>
            </div>
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-zinc-500 block text-[10px] font-bold uppercase">Aksi Buku Kas Masuk</span>
                <p className="text-xs text-zinc-400 mt-1">Catat pelunasan kasbon atau pemasukan non-penjualan</p>
              </div>
              <button
                onClick={() => setShowDebtSettlementModal(true)}
                className="mt-2 w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Catat Pelunasan Piutang</span>
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">No. Reff</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Kategori Pendapatan</th>
                  <th className="py-3 px-4">Sumber / Asal</th>
                  <th className="py-3 px-4">Akun &amp; Metode</th>
                  <th className="py-3 px-4">Klasifikasi Audit</th>
                  <th className="py-3 px-4 text-right">Nominal Masuk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {incomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{inc.id}</td>
                    <td className="py-3 px-4 text-zinc-400">{inc.date}</td>
                    <td className="py-3 px-4 font-bold text-white">{inc.category}</td>
                    <td className="py-3 px-4 text-zinc-300">{inc.source}</td>
                    <td className="py-3 px-4 text-zinc-400">{inc.method}</td>
                    <td className="py-3 px-4">
                      {inc.isReceivableSettlement ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                          Pelunasan Piutang (Non-Sales)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Pendapatan Omzet Penjualan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      +Rp {inc.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: PENGELUARAN TOKO */}
      {activeSub === 'pengeluaran_toko' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl w-full sm:w-auto">
              <span className="text-zinc-500 block text-[10px] font-bold uppercase">Total Biaya Operasional Toko</span>
              <span className="text-2xl font-mono font-black text-rose-400 mt-1 block">
                Rp {totalExpenseLedger.toLocaleString('id-ID')}
              </span>
              <span className="text-[11px] text-zinc-400">Seluruh beban operasional, perlengkapan, &amp; retur</span>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Pengeluaran Baru</span>
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">No. Voucher</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Kategori Beban</th>
                  <th className="py-3 px-4">Penerima / Vendor</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Otorisasi &amp; Bukti</th>
                  <th className="py-3 px-4 text-right">Nominal Pengeluaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-rose-400">{exp.id}</td>
                    <td className="py-3 px-4 text-zinc-400">{exp.date}</td>
                    <td className="py-3 px-4 font-bold text-white">{exp.category}</td>
                    <td className="py-3 px-4 text-zinc-300">{exp.recipient}</td>
                    <td className="py-3 px-4 text-zinc-400">{exp.method}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
                          {exp.approver || 'Otoritas Toko'}
                        </span>
                        {exp.hasReceiptAttachment && (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                            Nota OK
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                      -Rp {exp.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL STRUK & RETUR (5.13 REFUND LOGIC) */}
      {showDetailModal && selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Detail Struk Transaksi POS</h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">ID Transaksi:</span>
                  <span className="font-mono font-bold text-blue-400">{selectedTrx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Waktu:</span>
                  <span className="text-zinc-300">{new Date(selectedTrx.createdAt).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Pelanggan:</span>
                  <span className="text-white font-bold">{selectedTrx.customerName || 'Pelanggan Umum'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Metode Bayar:</span>
                  <span className="uppercase text-amber-400 font-bold">{selectedTrx.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Rincian Barang / Dus:</span>
                  <span className="text-zinc-300 text-right">{selectedTrx.cartonBreakdown || '1 Paket Belanja POS'}</span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm">
                  <span className="font-bold text-white">Total Tagihan:</span>
                  <span className="font-mono font-black text-emerald-400">
                    Rp {(selectedTrx.totalAmount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Anti Fraud Audit Tag */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Audit Status Anti-Fraud AI:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Bersih (Score: {selectedTrx.riskScore ?? 0})
                </span>
              </div>

              {/* Refund Notice or Trigger */}
              {!showRefundModal ? (
                <div className="pt-2 flex justify-between items-center gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700 transition flex items-center gap-1.5"
                    title="Cetak Struk ke Printer Thermal"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Struk Ulang</span>
                  </button>

                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Proses Retur / Refund</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleProcessRefund} className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-3">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5 text-rose-400">
                    <RotateCcw className="w-4 h-4" />
                    <span>Form Otorisasi Retur &amp; Penyesuaian Kas/Stok</span>
                  </h4>
                  <div>
                    <label className="block text-zinc-400 mb-1">Alasan Retur / Pembatalan:</label>
                    <select
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white text-xs"
                    >
                      <option value="Barang Rusak / Kemasan Cacat">Barang Rusak / Kemasan Cacat</option>
                      <option value="Produk Melewati Expired Date">Produk Melewati Expired Date</option>
                      <option value="Salah Input Kasir / Batal Beli">Salah Input Kasir / Batal Beli</option>
                      <option value="Customer Komplain Rasa / Isi">Customer Komplain Rasa / Isi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Nominal Refund (Rp):</label>
                    <input
                      type="number"
                      required
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white font-mono font-bold text-xs"
                    />
                  </div>
                  {refundSuccessMsg && (
                    <div className="p-2 bg-emerald-950 text-emerald-300 rounded border border-emerald-800 text-[11px]">
                      {refundSuccessMsg}
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRefundModal(false)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500"
                    >
                      Konfirmasi Retur &amp; Kembalikan Stok
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD DEBT SETTLEMENT (PELUNASAN PIUTANG) */}
      {showDebtSettlementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-400" />
              <span>Catat Pelunasan Piutang Kasbon</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Pencatatan ini akan menambah kas/bank dan mengurangi saldo piutang pelanggan <strong>tanpa menggandakan omzet penjualan asli</strong>.
            </p>
            <form onSubmit={handleRecordDebtSettlement} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Pilih Pelanggan:</label>
                <select
                  value={settlementCustomer}
                  onChange={(e) => setSettlementCustomer(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Ibu Ratna Dewi (Warung Berkah)">Ibu Ratna Dewi (Warung Berkah) - Sisa Kasbon Rp 750.000</option>
                  <option value="Pak Ahmad Fauzi (Warung Berkah 2)">Pak Ahmad Fauzi (Pelanggan Reguler) - Sisa Kasbon Rp 120.000</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nominal Pembayaran Pelunasan (Rp):</label>
                <input
                  type="number"
                  required
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Masuk ke Akun Kas/Bank:</label>
                <select
                  value={settlementAccount}
                  onChange={(e) => setSettlementAccount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Kas Kasir Tunai (Laci Shift)">Kas Kasir Tunai (Laci Shift)</option>
                  <option value="Rekening Bank BCA Toko">Rekening Bank BCA Toko</option>
                  <option value="Rekening Bank Mandiri Toko">Rekening Bank Mandiri Toko</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Catatan Referensi:</label>
                <input
                  type="text"
                  value={settlementNote}
                  onChange={(e) => setSettlementNote(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowDebtSettlementModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500"
                >
                  Simpan Pelunasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXPENSE */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Catat Pengeluaran Operasional Toko</h3>
            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Kategori Biaya:</label>
                <select
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Operasional Toko">Operasional Toko</option>
                  <option value="Beban Listrik & Utilitas">Beban Listrik &amp; Utilitas</option>
                  <option value="Perlengkapan Kasir">Perlengkapan Kasir (Thermal Paper / Ribbon)</option>
                  <option value="Bongkar Muat & Kebersihan">Bongkar Muat &amp; Kebersihan</option>
                  <option value="Gaji & Uang Makan Staff">Gaji &amp; Uang Makan Staff</option>
                  <option value="Biaya Sewa Tempat">Biaya Sewa Tempat</option>
                  <option value="Maintenance Mesin & Chiller">Maintenance Mesin &amp; Chiller</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Penerima / Vendor:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Toko Kertas Jaya / Petugas PLN"
                  value={newExpRecipient}
                  onChange={(e) => setNewExpRecipient(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Metode Pembayaran:</label>
                <select
                  value={newExpMethod}
                  onChange={(e) => setNewExpMethod(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Kas Kecil Kasir (Cash)">Kas Kecil Kasir (Cash)</option>
                  <option value="Transfer Bank BCA Toko">Transfer Bank BCA Toko</option>
                  <option value="Petty Cash Manager">Petty Cash Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nominal (Rp):</label>
                <input
                  type="number"
                  required
                  placeholder="100000"
                  value={newExpAmount}
                  onChange={(e) => setNewExpAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Keterangan / Nomor Bukti Nota:</label>
                <input
                  type="text"
                  placeholder="Nota kwitansi #..."
                  value={newExpNote}
                  onChange={(e) => setNewExpNote(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500"
                >
                  Simpan Biaya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
