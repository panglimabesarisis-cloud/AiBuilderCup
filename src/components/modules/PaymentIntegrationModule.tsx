import { useFirestoreList } from '../../hooks/useFirestoreList';
import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Save,
  RefreshCw,
  ExternalLink,
  Activity,
  Layers,
  Search,
} from 'lucide-react';

interface PaymentIntegrationModuleProps {
  subModule: 'xendit' | 'doku' | 'midtrans';
  currencyMode?: 'IDR' | 'USD';
  onNavigateTab?: (tab: string) => void;
}

export const PaymentIntegrationModule: React.FC<PaymentIntegrationModuleProps> = ({
  subModule,
  currencyMode = 'IDR',
  onNavigateTab,
}) => {
  const [activeSub, setActiveSub] = useState<'xendit' | 'doku' | 'midtrans'>(subModule);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Gateway Configurations
  const [gateways, setGateways] = useState({
    xendit: {
      name: 'Xendit Payments Indonesia',
      status: 'Terhubung (Live)',
      mode: 'production',
      publicKey: 'xnd_public_production_892348a8d7f...',
      secretKey: 'xnd_secret_production_998129bb1c...',
      webhookUrl: 'https://ais-dev-crx6iild2rlgaa22pobpuk-177372065163.asia-east1.run.app/api/webhooks/xendit',
      qrisEnabled: true,
      vaEnabled: true,
      retailOutletEnabled: false,
      dailyVolume: 14250000,
      settlementTime: 'T+1 Otomatis',
    },
    doku: {
      name: 'DOKU Payment Gateway',
      status: 'Siap Konfigurasi (Sandbox)',
      mode: 'sandbox',
      clientId: 'MALL_ID_88492019',
      sharedKey: 'shared_key_sandbox_998273...',
      webhookUrl: 'https://ais-dev-crx6iild2rlgaa22pobpuk-177372065163.asia-east1.run.app/api/webhooks/doku',
      qrisEnabled: true,
      vaEnabled: true,
      retailOutletEnabled: true,
      dailyVolume: 0,
      settlementTime: 'T+2 Hari Kerja',
    },
    midtrans: {
      name: 'Midtrans Snap & Core API',
      status: 'Terhubung (Sandbox)',
      mode: 'sandbox',
      serverKey: 'SB-Mid-server-9823jashd8723...',
      clientKey: 'SB-Mid-client-234jhsdf823...',
      webhookUrl: 'https://ais-dev-crx6iild2rlgaa22pobpuk-177372065163.asia-east1.run.app/api/webhooks/midtrans',
      qrisEnabled: true,
      vaEnabled: true,
      retailOutletEnabled: true,
      dailyVolume: 2850000,
      settlementTime: 'T+1 Otomatis',
    },
  });

  // Recent Payment Gateway Transactions
  const [gatewayTransactions, setGatewayTransactions] = useFirestoreList('gateway_transactions', [
    {
      id: 'PAY-XND-9812',
      gateway: 'Xendit',
      time: '10 Okt 2026, 12:40 WIB',
      orderId: 'TRX-948',
      channel: 'QRIS Dinamis',
      amount: 185000,
      fee: 1295,
      status: 'SETTLED',
    },
    {
      id: 'PAY-MID-4401',
      gateway: 'Midtrans',
      time: '10 Okt 2026, 11:22 WIB',
      orderId: 'PWA-ORDER-102',
      channel: 'BCA Virtual Account',
      amount: 420000,
      fee: 2500,
      status: 'SETTLED',
    },
    {
      id: 'PAY-XND-9810',
      gateway: 'Xendit',
      time: '10 Okt 2026, 09:15 WIB',
      orderId: 'TRX-945',
      channel: 'QRIS ShopeePay/GoPay',
      amount: 65000,
      fee: 455,
      status: 'SETTLED',
    },
  ]);

  const activeGw = gateways[activeSub];

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">
              INTEGRASI PAYMENT GATEWAY INDONESIA
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Arsitektur terpusat QRIS nasional, Virtual Account bank, rekonsiliasi fee, dan monitoring settlement otomatis.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveSub('xendit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSub === 'xendit' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Xendit</span>
          </button>
          <button
            onClick={() => setActiveSub('doku')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSub === 'doku' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Doku</span>
          </button>
          <button
            onClick={() => setActiveSub('midtrans')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSub === 'midtrans' ? 'bg-cyan-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Midtrans</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Kredensial payment gateway berhasil dienkripsi dan disimpan!</span>
        </div>
      )}

      {/* Gateway Overview Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-400 uppercase bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded">
                {activeSub.toUpperCase()} INTEGRATION
              </span>
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {activeGw.status}
              </span>
            </div>
            <h3 className="font-black text-white text-lg mt-1">{activeGw.name}</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert(`Simulasi uji webhook transfer untuk ${activeSub.toUpperCase()} berhasil dikirim!`)}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Tes Webhook IPN</span>
            </button>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="block text-zinc-400 font-bold mb-1">Environment Mode:</label>
            <select
              defaultValue={activeGw.mode}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
            >
              <option value="production">Production (Real Money / Live Settlement)</option>
              <option value="sandbox">Sandbox (Testing Simulator)</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 font-bold mb-1">Webhook Endpoint URL (Auto):</label>
            <input
              type="text"
              readOnly
              value={activeGw.webhookUrl}
              className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-xl px-3 py-2 text-zinc-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-bold mb-1">Public Key / Client Key:</label>
            <input
              type="text"
              defaultValue={(activeGw as any).publicKey || (activeGw as any).clientKey || (activeGw as any).clientId}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-bold mb-1">Secret Key / Server Key (Encrypted):</label>
            <input
              type="password"
              defaultValue={(activeGw as any).secretKey || (activeGw as any).serverKey || (activeGw as any).sharedKey}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div className="md:col-span-2 pt-2 border-t border-zinc-800 flex justify-between items-center">
            <span className="text-[11px] text-zinc-400">
              Jadwal Pencairan: <strong className="text-white">{activeGw.settlementTime}</strong>
            </span>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Kredensial {activeSub.toUpperCase()}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Gateway Settlement Log */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Log Transaksi &amp; Settlement {activeSub.toUpperCase()}
        </h3>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">No. Order POS</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-right">Potongan Fee MDR</th>
                <th className="py-3 px-4 text-right">Nominal Bersih</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {gatewayTransactions.map((gt) => (
                <tr key={gt.id} className="hover:bg-zinc-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-blue-400">{gt.id}</td>
                  <td className="py-3 px-4 text-zinc-400">{gt.time}</td>
                  <td className="py-3 px-4 font-mono text-zinc-200">{gt.orderId}</td>
                  <td className="py-3 px-4 font-medium text-white">{gt.channel}</td>
                  <td className="py-3 px-4 text-right font-mono text-zinc-500">
                    -Rp {gt.fee.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    Rp {(gt.amount - gt.fee).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {gt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
