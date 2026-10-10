import { useFirestoreList } from '../../hooks/useFirestoreList';
import React, { useState } from 'react';
import {
  Target,
  Megaphone,
  Ticket,
  Sparkles,
  Smartphone,
  BarChart2,
  Plus,
  CheckCircle,
  Clock,
  Percent,
  TrendingUp,
  Tag,
} from 'lucide-react';

interface MarketingModuleProps {
  subModule:
    | 'hadiah_target'
    | 'informasi_hadiah'
    | 'voucher_promo'
    | 'setting_poin'
    | 'setting_poin_pwa'
    | 'statistik_marketing';
  currencyMode?: 'IDR' | 'USD';
  onNavigateTab?: (tab: string) => void;
}

export const MarketingModule: React.FC<MarketingModuleProps> = ({
  subModule,
  currencyMode = 'IDR',
  onNavigateTab,
}) => {
  const [activeSub, setActiveSub] = useState<
    'hadiah_target' | 'informasi_hadiah' | 'voucher_promo' | 'setting_poin' | 'setting_poin_pwa' | 'statistik_marketing'
  >(subModule);

  // Vouchers
  const [vouchers, setVouchers] = useFirestoreList('vouchers', [
    {
      id: 'VOUCH-01',
      code: 'WEEKENDHEMAT',
      discountType: 'Nominal Potongan',
      discountValue: 15000,
      minSpend: 100000,
      usageCount: 142,
      maxUsage: 300,
      validUntil: '15 Okt 2026',
      status: 'active',
    },
    {
      id: 'VOUCH-02',
      code: 'PWAMEMBER5',
      discountType: 'Persentase Diskon',
      discountValue: 5,
      minSpend: 50000,
      usageCount: 420,
      maxUsage: 1000,
      validUntil: '31 Des 2026',
      status: 'active',
    },
    {
      id: 'VOUCH-03',
      code: 'GROSIRSERU',
      discountType: 'Gratis Ongkir Dus',
      discountValue: 10000,
      minSpend: 300000,
      usageCount: 68,
      maxUsage: 150,
      validUntil: '20 Okt 2026',
      status: 'active',
    },
  ]);

  // Target Gamification (Hadiah Target)
  const [targets, setTargets] = useFirestoreList('sales_targets', [
    {
      id: 'TGT-01',
      title: 'Target Belanja Bulanan Rp 5 Juta (Reseller)',
      reward: 'Bonus Cashback Rp 150.000 + 1 Dus Indomie',
      targetAmount: 5000000,
      currentAchievers: 14,
      period: 'Oktober 2026',
    },
    {
      id: 'TGT-02',
      title: 'Target Belanja PWA 10x Transaksi',
      reward: 'Voucher Potongan Rp 50.000',
      targetAmount: 10,
      currentAchievers: 38,
      period: 'Oktober 2026',
    },
  ]);

  // Points Configuration
  const [pointRatio, setPointRatio] = useState(10000); // Rp 10.000 = 1 Poin
  const [pointValueRupiah, setPointValueRupiah] = useState(50); // 1 Poin = Rp 50

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">
              TEKNIK MARKETING &amp; PROMOSI
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Program retensi pelanggan, hadiah target penjualan, kupon voucher promo, pengaturan loyalty poin POS &amp; PWA.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveSub('hadiah_target')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'hadiah_target' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Hadiah Target</span>
          </button>
          <button
            onClick={() => setActiveSub('informasi_hadiah')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'informasi_hadiah' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Informasi &amp; Hadiah</span>
          </button>
          <button
            onClick={() => setActiveSub('voucher_promo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'voucher_promo' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Voucher dan Promo</span>
          </button>
          <button
            onClick={() => setActiveSub('setting_poin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'setting_poin' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Setting Poin</span>
          </button>
          <button
            onClick={() => setActiveSub('setting_poin_pwa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'setting_poin_pwa' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Setting Poin PWA</span>
          </button>
          <button
            onClick={() => setActiveSub('statistik_marketing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'statistik_marketing' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Statistik Marketing</span>
          </button>
        </div>
      </div>

      {/* VIEW: HADIAH TARGET */}
      {activeSub === 'hadiah_target' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {targets.map((tgt) => (
              <div key={tgt.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded">
                    {tgt.period}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {tgt.currentAchievers} Toko Mencapai
                  </span>
                </div>
                <h3 className="font-bold text-white text-base">{tgt.title}</h3>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Hadiah: {tgt.reward}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: INFORMASI & HADIAH */}
      {activeSub === 'informasi_hadiah' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Banner Informasi Promo di Client PWA</h3>
          <p className="text-xs text-zinc-400">Pemberitahuan pop-up yang otomatis tampil saat pelanggan membuka aplikasi Client PWA.</p>
          <div className="p-4 bg-blue-950/20 border border-blue-900/40 rounded-xl text-xs space-y-2">
            <span className="font-bold text-blue-300 block">Banner Aktif Saat Ini:</span>
            <p className="text-white font-medium">
              &quot;Diskon Grosir Dus Indomie &amp; Le Minerale! Belanja minimal 3 karton gratis ongkir langsung ke rumah Anda.&quot;
            </p>
          </div>
        </div>
      )}

      {/* VIEW: VOUCHER DAN PROMO */}
      {activeSub === 'voucher_promo' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Kupon Kode Promo Aktif
            </h3>
            <button
              onClick={() => alert('Form voucher baru dibuka')}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Kupon Baru</span>
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Kode Kupon</th>
                  <th className="py-3 px-4">Tipe Potongan</th>
                  <th className="py-3 px-4">Nilai Diskon</th>
                  <th className="py-3 px-4">Min. Belanja</th>
                  <th className="py-3 px-4 text-center">Penggunaan</th>
                  <th className="py-3 px-4">Berlaku Sampai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-mono font-black text-purple-400 text-sm">{v.code}</td>
                    <td className="py-3 px-4 font-medium text-white">{v.discountType}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {v.discountType.includes('Persen') ? `${v.discountValue}%` : `Rp ${v.discountValue.toLocaleString('id-ID')}`}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-300">
                      Rp {v.minSpend.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {v.usageCount} / {v.maxUsage}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{v.validUntil}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: SETTING POIN */}
      {activeSub === 'setting_poin' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 max-w-xl">
          <h3 className="font-bold text-white text-base">Aturan Perhitungan Poin Kasir POS</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-400 font-bold mb-1">Setiap Belanja Kelipatan (Rp):</label>
              <input
                type="number"
                value={pointRatio}
                onChange={(e) => setPointRatio(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
              <span className="text-[10px] text-zinc-500">Mendapatkan 1 Poin loyalitas di struk POS.</span>
            </div>
            <div>
              <label className="block text-zinc-400 font-bold mb-1">Nilai Tukar 1 Poin (Rp Rupiah):</label>
              <input
                type="number"
                value={pointValueRupiah}
                onChange={(e) => setPointValueRupiah(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>
            <button
              onClick={() => alert('Aturan poin kasir disimpan!')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition cursor-pointer"
            >
              Simpan Konfigurasi Poin
            </button>
          </div>
        </div>
      )}

      {/* VIEW: SETTING POIN PWA */}
      {activeSub === 'setting_poin_pwa' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 max-w-xl">
          <h3 className="font-bold text-white text-base">Bonus Poin Khusus Client PWA</h3>
          <p className="text-xs text-zinc-400">Tingkatkan adopsi aplikasi web PWA dengan reward berlipat bagi pelanggan mandiri.</p>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Poin Sambutan (Install &amp; Login PWA)</span>
                <span className="text-[11px] text-zinc-400">Bonus otomatis saat verifikasi nomor handphone</span>
              </div>
              <span className="font-mono font-bold text-emerald-400">+100 Poin</span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Pengganda Poin PWA (Order Mandiri)</span>
                <span className="text-[11px] text-zinc-400">Pelanggan yang memesan sendiri tanpa kasir fisik</span>
              </div>
              <span className="font-mono font-bold text-purple-400">2x Poin (Double)</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: STATISTIK MARKETING */}
      {activeSub === 'statistik_marketing' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-zinc-500 block text-[10px] font-bold uppercase">Omzet dari Kupon Promo</span>
            <span className="text-2xl font-mono font-black text-purple-400 mt-1 block">
              Rp 18.420.000
            </span>
            <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              ROI Promosi 4.8x
            </span>
          </div>

          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-zinc-500 block text-[10px] font-bold uppercase">Poin Diklaim Pelanggan</span>
            <span className="text-2xl font-mono font-black text-amber-400 mt-1 block">
              14.250 Poin
            </span>
            <span className="text-zinc-400 text-[11px] mt-1 block">82% ditukar voucher potongan harga</span>
          </div>

          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <span className="text-zinc-500 block text-[10px] font-bold uppercase">Member VIP PWA Aktif</span>
            <span className="text-2xl font-mono font-black text-white mt-1 block">
              142 Member
            </span>
            <span className="text-zinc-400 text-[11px] mt-1 block">Repeat order rate: 64%</span>
          </div>
        </div>
      )}
    </div>
  );
};
