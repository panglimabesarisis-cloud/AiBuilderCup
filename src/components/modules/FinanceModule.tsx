import React, { useState } from 'react';
import {
  Vault,
  Coins,
  TrendingUp,
  CreditCard,
  History,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  ShieldCheck,
  Building,
  DollarSign,
  PieChart,
} from 'lucide-react';

interface FinanceModuleProps {
  subModule:
    | 'bangkas_toko'
    | 'bangkas_modal'
    | 'bangkas_untung'
    | 'type_keuangan'
    | 'riwayat_keuangan';
  currencyMode?: 'IDR' | 'USD';
  onNavigateTab?: (tab: string) => void;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  subModule,
  currencyMode = 'IDR',
  onNavigateTab,
}) => {
  const [activeSub, setActiveSub] = useState<
    'bangkas_toko' | 'bangkas_modal' | 'bangkas_untung' | 'type_keuangan' | 'riwayat_keuangan'
  >(subModule);

  // Vault Balances
  const [vaults, setVaults] = useState({
    bangkasToko: 28450000, // Saldo fisik brankas toko (Safe Drop kasir)
    bangkasModal: 85000000, // Cadangan modal kerja pengadaan restock dus
    bangkasUntung: 34120000, // Laba bersih akumulatif siap bagi hasil/dividen
  });

  // Financial Account Types (Type Keuangan)
  const [accountTypes, setAccountTypes] = useState([
    {
      code: 'ACT-101',
      name: 'Kas Kecil Laci POS (Petty Cash)',
      category: 'Aset Lancar (Kas & Bank)',
      balance: 3840000,
      status: 'Aktif',
    },
    {
      code: 'ACT-102',
      name: 'Brankas Besi Toko (Bangkas Toko)',
      category: 'Aset Lancar (Kas & Bank)',
      balance: 28450000,
      status: 'Aktif',
    },
    {
      code: 'ACT-103',
      name: 'Rekening Bank BCA Operasional',
      category: 'Bank Utama',
      balance: 85000000,
      status: 'Aktif',
    },
    {
      code: 'ACT-201',
      name: 'Hutang Dagang Supplier (PO Tempo)',
      category: 'Kewajiban Jangka Pendek',
      balance: 6540000,
      status: 'Aktif',
    },
    {
      code: 'ACT-301',
      name: 'Modal Awal Pemilik Toko',
      category: 'Ekuitas / Modal',
      balance: 100000000,
      status: 'Aktif',
    },
  ]);

  // Financial History (Riwayat Keuangan)
  const [historyLedger, setHistoryLedger] = useState([
    {
      id: 'FIN-202610-01',
      date: '10 Okt 2026, 12:00 WIB',
      type: 'SETORAN_BRANKAS',
      from: 'Kasir Shift 1 (Laci POS)',
      to: 'Bangkas Toko (Brankas)',
      amount: 3000000,
      note: 'Safe drop laci kasir siang hari',
      actor: 'Supervisor Toko',
    },
    {
      id: 'FIN-202610-02',
      date: '09 Okt 2026, 17:30 WIB',
      type: 'ALOKASI_UNTUNG',
      from: 'Laba Penjualan Harian',
      to: 'Bangkas Untung (Profit Vault)',
      amount: 1450000,
      note: 'Alokasi laba bersih margin produk',
      actor: 'Sistem Otomatis',
    },
    {
      id: 'FIN-202610-03',
      date: '09 Okt 2026, 09:00 WIB',
      type: 'PENGELUARAN_MODAL',
      from: 'Bangkas Modal',
      to: 'Supplier Indofood (PO-001)',
      amount: 14250000,
      note: 'Pelunasan pembelian 100 dus Indomie',
      actor: 'Finance Admin',
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Vault className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">
              MANAJEMEN KEUANGAN &amp; BANGKAS
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Pengendalian brankas kas fisik toko, brankas modal kerja, alokasi laba keuntungan bersih, dan riwayat jurnal keuangan.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveSub('bangkas_toko')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'bangkas_toko' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Vault className="w-3.5 h-3.5" />
            <span>Bangkas Toko</span>
          </button>
          <button
            onClick={() => setActiveSub('bangkas_modal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'bangkas_modal' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Bangkas Modal</span>
          </button>
          <button
            onClick={() => setActiveSub('bangkas_untung')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'bangkas_untung' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Bangkas Untung</span>
          </button>
          <button
            onClick={() => setActiveSub('type_keuangan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'type_keuangan' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Type Keuangan</span>
          </button>
          <button
            onClick={() => setActiveSub('riwayat_keuangan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'riwayat_keuangan' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Keuangan</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW THREE VAULTS WIDGET */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveSub('bangkas_toko')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            activeSub === 'bangkas_toko' ? 'bg-emerald-950/40 border-emerald-500' : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Brankas Kas Fisik Toko</span>
            <Vault className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-mono font-black text-white mt-2 block">
            Rp {vaults.bangkasToko.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-zinc-400 mt-1 block">Tersimpan aman di brankas toko</span>
        </div>

        <div
          onClick={() => setActiveSub('bangkas_modal')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            activeSub === 'bangkas_modal' ? 'bg-blue-950/40 border-blue-500' : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-400 uppercase">Brankas Modal Kerja (Working Capital)</span>
            <Coins className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-2xl font-mono font-black text-white mt-2 block">
            Rp {vaults.bangkasModal.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-zinc-400 mt-1 block">Khusus alokasi belanja PO supplier</span>
        </div>

        <div
          onClick={() => setActiveSub('bangkas_untung')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            activeSub === 'bangkas_untung' ? 'bg-purple-950/40 border-purple-500' : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-400 uppercase">Brankas Laba Bersih (Net Profit)</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-mono font-black text-emerald-400 mt-2 block">
            Rp {vaults.bangkasUntung.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-zinc-400 mt-1 block">Laba bersih realitas siap dividen</span>
        </div>
      </div>

      {/* VIEW: BANGKAS TOKO */}
      {activeSub === 'bangkas_toko' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base">Bangkas Toko &bull; Safe Drop Kasir</h3>
              <p className="text-xs text-zinc-400">Pengamanan uang tunai dari kasir setiap kali laci mencapai batas Rp 3.000.000.</p>
            </div>
            <button
              onClick={() => alert('Form input setoran brankas toko baru dibuka!')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Setor ke Brankas</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW: BANGKAS MODAL */}
      {activeSub === 'bangkas_modal' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base">Bangkas Modal &bull; Dana Cadangan Pembelian</h3>
              <p className="text-xs text-zinc-400">Diproteksi ketat agar tidak terpakai untuk pengeluaran konsumtif operasional.</p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: BANGKAS UNTUNG */}
      {activeSub === 'bangkas_untung' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base">Bangkas Untung &bull; Akumulasi Laba Toko</h3>
              <p className="text-xs text-zinc-400">Dihitung otomatis dari selisih Harga Jual dikurangi COGS Modal Beli setiap transaksi.</p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: TYPE KEUANGAN */}
      {activeSub === 'type_keuangan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Daftar Akun Keuangan (Chart of Accounts)
            </h3>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Kode Akun</th>
                  <th className="py-3 px-4">Nama Rekening / Akun</th>
                  <th className="py-3 px-4">Klasifikasi</th>
                  <th className="py-3 px-4 text-right">Saldo Saat Ini</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {accountTypes.map((act) => (
                  <tr key={act.code} className="hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{act.code}</td>
                    <td className="py-3 px-4 font-bold text-white">{act.name}</td>
                    <td className="py-3 px-4 text-zinc-400">{act.category}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      Rp {act.balance.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {act.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: RIWAYAT KEUANGAN */}
      {activeSub === 'riwayat_keuangan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Riwayat Mutasi Jurnal Keuangan
            </h3>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">No. Reff</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Dari &rarr; Ke</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4">Penanggung Jawab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {historyLedger.map((hl) => (
                  <tr key={hl.id} className="hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{hl.id}</td>
                    <td className="py-3 px-4 text-zinc-400">{hl.date}</td>
                    <td className="py-3 px-4">
                      <span className="text-zinc-300 font-bold block">{hl.from}</span>
                      <span className="text-[11px] text-zinc-500">&rarr; {hl.to}</span>
                    </td>
                    <td className="py-3 px-4 text-zinc-300">{hl.note}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      Rp {hl.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{hl.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
