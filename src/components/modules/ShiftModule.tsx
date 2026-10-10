import { useFirestoreList } from '../../hooks/useFirestoreList';
import React, { useState } from 'react';
import {
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  History,
  DollarSign,
  Plus,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Printer,
  Calendar,
  User,
  Search,
} from 'lucide-react';

interface ShiftModuleProps {
  subModule: 'cashir' | 'kas_masuk' | 'kas_keluar' | 'riwayat_shit';
  currencyMode?: 'IDR' | 'USD';
  onNavigateTab?: (tab: string) => void;
}

export const ShiftModule: React.FC<ShiftModuleProps> = ({
  subModule,
  currencyMode = 'IDR',
  onNavigateTab,
}) => {
  const [activeSub, setActiveSub] = useState<'cashir' | 'kas_masuk' | 'kas_keluar' | 'riwayat_shit'>(subModule);

  // Active Shift State
  const [activeShift, setActiveShift] = useState<{
    id: string;
    cashierName: string;
    outlet: string;
    openedAt: string;
    startingCash: number;
    expectedCash: number;
    actualCash: number;
    totalSalesCash: number;
    totalKasMasuk: number;
    totalKasKeluar: number;
    status: 'open' | 'closed';
  }>({
    id: 'SHF-20261010-01',
    cashierName: 'Ahmad Fauzi (Kasir Pagi)',
    outlet: 'RiskCart Flagship Store (Pusat)',
    openedAt: '10 Okt 2026, 07:30 WIB',
    startingCash: 500000,
    expectedCash: 3840000,
    actualCash: 3840000,
    totalSalesCash: 3450000,
    totalKasMasuk: 150000,
    totalKasKeluar: 260000,
    status: 'open',
  });

  // Kas Masuk Entries
  const [kasMasukList, setKasMasukList] = useFirestoreList('cash_in', [
    {
      id: 'KM-001',
      time: '08:45 WIB',
      category: 'Tambahan Modal Kasir',
      amount: 100000,
      source: 'Supervisor Toko',
      note: 'Uang pecahan kecil Rp 2.000 & Rp 5.000',
      recordedBy: 'Ahmad Fauzi',
    },
    {
      id: 'KM-002',
      time: '11:15 WIB',
      category: 'Pelunasan Kasbon Member',
      amount: 50000,
      source: 'Pelanggan: Pak Rudi',
      note: 'Pelunasan piutang sembako',
      recordedBy: 'Ahmad Fauzi',
    },
  ]);

  // Kas Keluar Entries
  const [kasKeluarList, setKasKeluarList] = useFirestoreList('cash_out', [
    {
      id: 'KK-001',
      time: '09:20 WIB',
      category: 'Operasional Kasir',
      amount: 60000,
      recipient: 'Toko Plastik Makmur',
      note: 'Beli kantong kresek jumbo & thermal receipt roll',
      recordedBy: 'Ahmad Fauzi',
    },
    {
      id: 'KK-002',
      time: '12:10 WIB',
      category: 'Bongkar Muat / Parkir',
      amount: 200000,
      recipient: 'Kuli Angkut Supplier Galon',
      note: 'Upah bongkar muat 50 galon Aqua refill',
      recordedBy: 'Ahmad Fauzi',
    },
  ]);

  // Riwayat Shift (Riwayat Shit - preserving requested label)
  const [shiftHistory, setShiftHistory] = useFirestoreList('shift_history', [
    {
      id: 'SHF-20261009-02',
      date: '09 Okt 2026',
      shift: 'Shift Malam (15:00 - 22:30)',
      cashier: 'Siti Rahmawati',
      startCash: 500000,
      cashSales: 4120000,
      qrisSales: 2890000,
      cashIn: 50000,
      cashOut: 120000,
      expected: 4550000,
      actual: 4550000,
      diff: 0,
      status: 'SEIMBANG',
    },
    {
      id: 'SHF-20261009-01',
      date: '09 Okt 2026',
      shift: 'Shift Pagi (07:30 - 15:00)',
      cashier: 'Ahmad Fauzi',
      startCash: 500000,
      cashSales: 3200000,
      qrisSales: 1750000,
      cashIn: 0,
      cashOut: 85000,
      expected: 3615000,
      actual: 3615000,
      diff: 0,
      status: 'SEIMBANG',
    },
    {
      id: 'SHF-20261008-02',
      date: '08 Okt 2026',
      shift: 'Shift Malam (15:00 - 22:30)',
      cashier: 'Budi Santoso',
      startCash: 500000,
      cashSales: 3890000,
      qrisSales: 2410000,
      cashIn: 0,
      cashOut: 150000,
      expected: 4240000,
      actual: 4235000,
      diff: -5000,
      status: 'SELISIH (-Rp 5.000)',
    },
  ]);

  // Modals
  const [showKasMasukModal, setShowKasMasukModal] = useState(false);
  const [showKasKeluarModal, setShowKasKeluarModal] = useState(false);
  const [kmCategory, setKmCategory] = useState('Tambahan Modal Kasir');
  const [kmAmount, setKmAmount] = useState('');
  const [kmSource, setKmSource] = useState('');
  const [kmNote, setKmNote] = useState('');

  const [kkCategory, setKkCategory] = useState('Operasional Kasir');
  const [kkAmount, setKkAmount] = useState('');
  const [kkRecipient, setKkRecipient] = useState('');
  const [kkNote, setKkNote] = useState('');

  const handleAddKasMasuk = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(kmAmount);
    if (!val || isNaN(val)) return;
    const item = {
      id: `KM-00${kasMasukList.length + 1}`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      category: kmCategory,
      amount: val,
      source: kmSource || 'Kasir',
      note: kmNote || '-',
      recordedBy: activeShift.cashierName,
    };
    setKasMasukList([item, ...kasMasukList]);
    setActiveShift((prev) => ({
      ...prev,
      totalKasMasuk: prev.totalKasMasuk + val,
      expectedCash: prev.expectedCash + val,
    }));
    setShowKasMasukModal(false);
    setKmAmount('');
    setKmSource('');
    setKmNote('');
  };

  const handleAddKasKeluar = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(kkAmount);
    if (!val || isNaN(val)) return;
    const item = {
      id: `KK-00${kasKeluarList.length + 1}`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      category: kkCategory,
      amount: val,
      recipient: kkRecipient || 'Pihak Ketiga',
      note: kkNote || '-',
      recordedBy: activeShift.cashierName,
    };
    setKasKeluarList([item, ...kasKeluarList]);
    setActiveShift((prev) => ({
      ...prev,
      totalKasKeluar: prev.totalKasKeluar + val,
      expectedCash: prev.expectedCash - val,
    }));
    setShowKasKeluarModal(false);
    setKkAmount('');
    setKkRecipient('');
    setKkNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">
              MANAJEMEN SHIFT &amp; KASIR
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Pengendalian laci uang (*cash drawer*), rekonsiliasi kas masuk, kas operasional, dan riwayat tutup shift kasir.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveSub('cashir')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeSub === 'cashir'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Cashir
          </button>
          <button
            onClick={() => setActiveSub('kas_masuk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'kas_masuk'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Kas Masuk</span>
          </button>
          <button
            onClick={() => setActiveSub('kas_keluar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'kas_keluar'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Kas Keluar</span>
          </button>
          <button
            onClick={() => setActiveSub('riwayat_shit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'riwayat_shit'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Shit</span>
          </button>
        </div>
      </div>

      {/* VIEW: CASHIR */}
      {activeSub === 'cashir' && (
        <div className="space-y-6">
          {/* Active Shift Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 flex items-center justify-center">
                  <Unlock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                      SHIFT BERJALAN (OPEN)
                    </span>
                    <span className="text-zinc-400 text-xs font-mono">{activeShift.id}</span>
                  </div>
                  <h3 className="font-black text-white text-lg mt-0.5">{activeShift.cashierName}</h3>
                  <p className="text-xs text-zinc-400">{activeShift.outlet} &bull; Dibuka: {activeShift.openedAt}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab && onNavigateTab('pos_machine')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Ke Mesin Kasir POS
                </button>
              </div>
            </div>

            {/* Shift Balance Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                <span className="text-zinc-500 block text-[10px] font-bold uppercase">Modal Awal Laci (Float)</span>
                <span className="text-lg font-mono font-black text-white mt-1 block">
                  Rp {activeShift.startingCash.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-zinc-500">Uang kembalian pagi</span>
              </div>

              <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                <span className="text-zinc-500 block text-[10px] font-bold uppercase">Penjualan Tunai (Cash)</span>
                <span className="text-lg font-mono font-black text-blue-400 mt-1 block">
                  Rp {activeShift.totalSalesCash.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-zinc-500">Transaksi POS laci</span>
              </div>

              <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                <span className="text-zinc-500 block text-[10px] font-bold uppercase">Kas Masuk / Kas Keluar</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    +{activeShift.totalKasMasuk.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    -{activeShift.totalKasKeluar.toLocaleString('id-ID')}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500">Mutasi operasional</span>
              </div>

              <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-xl">
                <span className="text-emerald-400 block text-[10px] font-bold uppercase">Target Saldo Laci Saat Ini</span>
                <span className="text-lg font-mono font-black text-emerald-400 mt-1 block">
                  Rp {activeShift.expectedCash.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-emerald-300">Wajib ada di cash drawer</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setShowKasMasukModal(true)}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>+ Catat Kas Masuk</span>
              </button>
              <button
                onClick={() => setShowKasKeluarModal(true)}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>- Catat Kas Keluar</span>
              </button>
              <button
                onClick={() => alert('Laporan X-Report kasir dicetak ke thermal receipt printer!')}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-zinc-400" />
                <span>Cetak X-Report Shift</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: KAS MASUK */}
      {activeSub === 'kas_masuk' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Daftar Kas Masuk Laci Toko (Inflow)
            </h3>
            <button
              onClick={() => setShowKasMasukModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kas Masuk</span>
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">No. Bukti</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Sumber Dana</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {kasMasukList.map((km) => (
                  <tr key={km.id} className="hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{km.id}</td>
                    <td className="py-3 px-4 text-zinc-400">{km.time}</td>
                    <td className="py-3 px-4 font-bold text-white">{km.category}</td>
                    <td className="py-3 px-4 text-zinc-300">{km.source}</td>
                    <td className="py-3 px-4 text-zinc-400">{km.note}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      +Rp {km.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: KAS KELUAR */}
      {activeSub === 'kas_keluar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Daftar Kas Keluar &amp; Biaya Operasional Kasir (Outflow)
            </h3>
            <button
              onClick={() => setShowKasKeluarModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kas Keluar</span>
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">No. Bukti</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Kategori Biaya</th>
                  <th className="py-3 px-4">Penerima Dana</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {kasKeluarList.map((kk) => (
                  <tr key={kk.id} className="hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-rose-400">{kk.id}</td>
                    <td className="py-3 px-4 text-zinc-400">{kk.time}</td>
                    <td className="py-3 px-4 font-bold text-white">{kk.category}</td>
                    <td className="py-3 px-4 text-zinc-300">{kk.recipient}</td>
                    <td className="py-3 px-4 text-zinc-400">{kk.note}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                      -Rp {kk.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: RIWAYAT SHIT (Preserve exact requested label) */}
      {activeSub === 'riwayat_shit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Riwayat Shit &amp; Tutup Kasir (Z-Report)
              </h3>
              <p className="text-xs text-zinc-400">
                Arsip audit laci uang, kesesuaian fisik kasir, dan rekonsiliasi selisih kas harian.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">ID Shift</th>
                  <th className="py-3 px-4">Tanggal &amp; Sesi</th>
                  <th className="py-3 px-4">Kasir Bertugas</th>
                  <th className="py-3 px-4 text-right">Penjualan Kas</th>
                  <th className="py-3 px-4 text-right">Penjualan QRIS</th>
                  <th className="py-3 px-4 text-right">Target Fisik</th>
                  <th className="py-3 px-4 text-right">Kas Dihitung</th>
                  <th className="py-3 px-4 text-center">Status Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {shiftHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{s.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">{s.date}</span>
                      <span className="text-[11px] text-zinc-400">{s.shift}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-200">{s.cashier}</td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-300">
                      Rp {s.cashSales.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-400">
                      Rp {s.qrisSales.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-300">
                      Rp {s.expected.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      Rp {s.actual.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.diff === 0
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Kas Masuk */}
      {showKasMasukModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Catat Kas Masuk Laci</h3>
            <form onSubmit={handleAddKasMasuk} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Kategori Kas Masuk:</label>
                <select
                  value={kmCategory}
                  onChange={(e) => setKmCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Tambahan Modal Kasir">Tambahan Modal Kasir</option>
                  <option value="Pelunasan Kasbon Member">Pelunasan Kasbon Member</option>
                  <option value="Pendapatan Jasa / Parkir">Pendapatan Jasa / Parkir</option>
                  <option value="Koreksi Selisih Kasir">Koreksi Selisih Kasir</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nominal (Rp):</label>
                <input
                  type="number"
                  required
                  placeholder="50000"
                  value={kmAmount}
                  onChange={(e) => setKmAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Sumber Dana / Pihak Penyerah:</label>
                <input
                  type="text"
                  placeholder="Supervisor / Pelanggan"
                  value={kmSource}
                  onChange={(e) => setKmSource(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Keterangan:</label>
                <input
                  type="text"
                  placeholder="Keterangan tambahan..."
                  value={kmNote}
                  onChange={(e) => setKmNote(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowKasMasukModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500"
                >
                  Simpan Kas Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kas Keluar */}
      {showKasKeluarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Catat Kas Keluar Operasional</h3>
            <form onSubmit={handleAddKasKeluar} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Kategori Biaya:</label>
                <select
                  value={kkCategory}
                  onChange={(e) => setKkCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Operasional Kasir">Operasional Kasir (Kresek, Kertas Struk)</option>
                  <option value="Bongkar Muat / Parkir">Bongkar Muat / Parkir Supplier</option>
                  <option value="Konsumsi &amp; Kebersihan">Konsumsi &amp; Kebersihan Toko</option>
                  <option value="Setoran Tunai ke Bank">Setoran Tunai ke Bank</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nominal (Rp):</label>
                <input
                  type="number"
                  required
                  placeholder="25000"
                  value={kkAmount}
                  onChange={(e) => setKkAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Penerima Dana:</label>
                <input
                  type="text"
                  placeholder="Nama toko / kuli / kurir"
                  value={kkRecipient}
                  onChange={(e) => setKkRecipient(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Keterangan Keperluan:</label>
                <input
                  type="text"
                  placeholder="Detail bukti pengeluaran..."
                  value={kkNote}
                  onChange={(e) => setKkNote(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowKasKeluarModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500"
                >
                  Simpan Kas Keluar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
