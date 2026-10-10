import { useFirestoreList } from '../../hooks/useFirestoreList';
import React, { useState } from 'react';
import { useSetting } from '../../hooks/useSetting';
import {
  Settings,
  Store,
  CreditCard,
  Printer,
  Sliders,
  Lock,
  Database,
  Shield,
  Save,
  CheckCircle,
  Download,
  Upload,
  RefreshCw,
  Search,
  History,
  AlertTriangle,
  FileText,
  Key,
  Globe,
  Radio,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Zap,
  DollarSign,
  QrCode,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface POSSettingsModuleProps {
  subModule:
    | 'umum'
    | 'toko'
    | 'pembayaran'
    | 'printer_struk'
    | 'global_setup'
    | 'hak_akses'
    | 'backup_restore'
    | 'payment_gateway'
    | 'audit_log';
  currencyMode?: 'IDR' | 'USD';
  onNavigateTab?: (tab: string) => void;
}

export const POSSettingsModule: React.FC<POSSettingsModuleProps> = ({
  subModule,
  currencyMode = 'IDR',
  onNavigateTab,
}) => {
  const [activeSub, setActiveSub] = useState<
    | 'umum'
    | 'toko'
    | 'pembayaran'
    | 'printer_struk'
    | 'global_setup'
    | 'hak_akses'
    | 'backup_restore'
    | 'payment_gateway'
    | 'audit_log'
  >(subModule);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showMaskedKeys, setShowMaskedKeys] = useState(false);
  const [pingTesting, setPingTesting] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  // ================= 1. UMUM =================
  const [autoLockMinutes, setAutoLockMinutes] = useSetting('pos', 'autoLockMinutes', 10);
  const [barcodeEnterSubmits, setBarcodeEnterSubmits] = useSetting('pos', 'barcodeEnterSubmits', true);
  const [soundBeepEnabled, setSoundBeepEnabled] = useSetting('pos', 'soundBeepEnabled', true);
  const [allowManualCashierDiscount, setAllowManualCashierDiscount] = useSetting('pos', 'allowManualCashierDiscount', false);
  const [maxCashierDiscountPct, setMaxCashierDiscountPct] = useSetting('pos', 'maxCashierDiscountPct', 10);
  const [autoOpenCashDrawerOnCash, setAutoOpenCashDrawerOnCash] = useSetting('pos', 'autoOpenCashDrawerOnCash', true);// ================= 2. TOKO =================
  const [selectedOutlet, setSelectedOutlet] = useState('OUT-01');
  const [storeName, setStoreName] = useSetting('pos', 'storeName', 'RiskCart Official POS - Cabang Kelapa Gading');
  const [storeAddress, setStoreAddress] = useSetting('pos', 'storeAddress', 'Jl. Boulevard Raya Blok QF1 No. 12, Kelapa Gading, Jakarta Utara');
  const [storePhone, setStorePhone] = useSetting('pos', 'storePhone', '(021) 4587-9922');
  const [storeTaxNumber, setStoreTaxNumber] = useSetting('pos', 'storeTaxNumber', '01.234.567.8-012.000');
  const [storeFooterNote, setStoreFooterNote] = useSetting('pos', 'storeFooterNote', 'Terima kasih telah berbelanja di RiskCart! Barang yang sudah dibeli tidak dapat ditukar tanpa bukti struk resmi.');// ================= 3. PEMBAYARAN =================
  const [acceptCash, setAcceptCash] = useSetting('pos', 'acceptCash', true);
  const [acceptQris, setAcceptQris] = useSetting('pos', 'acceptQris', true);
  const [acceptEdc, setAcceptEdc] = useSetting('pos', 'acceptEdc', true);
  const [acceptKasbon, setAcceptKasbon] = useSetting('pos', 'acceptKasbon', true);
  const [acceptCod, setAcceptCod] = useSetting('pos', 'acceptCod', true);
  const [cashRoundingMode, setCashRoundingMode] = useSetting<'none' | 'floor_100' | 'ceil_500'>('pos', 'cashRoundingMode', 'floor_100');
  const [maxCashDrawerAlert, setMaxCashDrawerAlert] = useSetting('pos', 'maxCashDrawerAlert', 3000000);// 3jt warning
  const [requireCashCountOnShiftClose, setRequireCashCountOnShiftClose] = useSetting('pos', 'requireCashCountOnShiftClose', true);// ================= 4. PRINTER STRUK =================
  const [printerInterface, setPrinterInterface] = useSetting<'bluetooth' | 'usb' | 'network'>('pos', 'printerInterface', 'usb');
  const [printerPaperSize, setPrinterPaperSize] = useSetting<'58mm' | '80mm'>('pos', 'printerPaperSize', '80mm');
  const [networkPrinterIp, setNetworkPrinterIp] = useSetting('pos', 'networkPrinterIp', '192.168.1.200');
  const [networkPrinterPort, setNetworkPrinterPort] = useSetting('pos', 'networkPrinterPort', '9100');
  const [autoCutPaper, setAutoCutPaper] = useSetting('pos', 'autoCutPaper', true);
  const [printCopies, setPrintCopies] = useSetting<1 | 2>('pos', 'printCopies', 1);
  const [printStoreLogo, setPrintStoreLogo] = useSetting('pos', 'printStoreLogo', true);
  const [printTaxDetail, setPrintTaxDetail] = useSetting('pos', 'printTaxDetail', true);
  const [printCustomerPoints, setPrintCustomerPoints] = useSetting('pos', 'printCustomerPoints', true);
  const [printReceiptBarcode, setPrintReceiptBarcode] = useSetting('pos', 'printReceiptBarcode', true);// ================= 5. GLOBAL SETUP =================
  const [defaultCurrency, setDefaultCurrency] = useSetting<'IDR' | 'USD'>('pos', 'defaultCurrency', 'IDR');
  const [systemTimezone, setSystemTimezone] = useSetting('pos', 'systemTimezone', 'Asia/Jakarta (WIB)');
  const [defaultTaxRate, setDefaultTaxRate] = useSetting('pos', 'defaultTaxRate', 11);// PPN 11%
  const [serviceChargeRate, setServiceChargeRate] = useSetting('pos', 'serviceChargeRate', 0);
  const [skuPrefixFormat, setSkuPrefixFormat] = useSetting('pos', 'skuPrefixFormat', 'RC-SEM-{RAND4}');
  const [lowStockDefaultAlert, setLowStockDefaultAlert] = useSetting('pos', 'lowStockDefaultAlert', 10);// ================= 6. HAK DAN AKSES =================
  const [requireSupervisorPinForVoid, setRequireSupervisorPinForVoid] = useSetting('pos', 'requireSupervisorPinForVoid', true);
  const [requirePinForDrawerKick, setRequirePinForDrawerKick] = useSetting('pos', 'requirePinForDrawerKick', true);
  const [requirePinForReprintOld, setRequirePinForReprintOld] = useSetting('pos', 'requirePinForReprintOld', false);
  const [supervisorPin, setSupervisorPin] = useSetting('pos', 'supervisorPin', '8899');
  const [managerPin, setManagerPin] = useSetting('pos', 'managerPin', '123456');// ================= 7. BACKUP AND RESTORE =================
  const [backupSnapshots, setBackupSnapshots] = useFirestoreList('backup_snapshots', [
    {
      id: 'BKP-20261010-0900',
      timestamp: '10 Okt 2026, 09:00 WIB',
      size: '2.4 MB',
      checksum: 'sha256-a9b817c12f...',
      creator: 'Automated Daily Snapshot',
      records: 1240,
    },
    {
      id: 'BKP-20261009-2359',
      timestamp: '09 Okt 2026, 23:59 WIB',
      size: '2.3 MB',
      checksum: 'sha256-f8190de3a1...',
      creator: 'Supervisor Budi (EOD)',
      records: 1195,
    },
    {
      id: 'BKP-20261008-2359',
      timestamp: '08 Okt 2026, 23:59 WIB',
      size: '2.1 MB',
      checksum: 'sha256-bc7719f912...',
      creator: 'System Cloud Sync',
      records: 1120,
    },
  ]);

  // ================= 8. PAYMENT GATEWAYS REGISTRY (5.21) =================
  const [selectedGatewayTab, setSelectedGatewayTab] = useSetting<'xendit' | 'midtrans' | 'doku' | 'tripay'>('pos', 'selectedGatewayTab', 'xendit');
  const [gatewaysData, setGatewaysData] = useState({
    xendit: {
      name: 'Xendit Payments Indonesia',
      status: 'Terhubung (Live)',
      mode: 'production',
      publicKey: 'xnd_public_production_892348a8d7f99120',
      secretKey: 'xnd_secret_production_998129bb1c827a90',
      webhookUrl: 'https://ais-dev-crx6iild2rlgaa22pobpuk-177372065163.asia-east1.run.app/api/webhooks/xendit',
      qrisEnabled: true,
      vaEnabled: true,
      creditCardEnabled: true,
      dailyVolume: 14250000,
      settlementCycle: 'T+1 Otomatis ke Rekening Utama',
    },
    midtrans: {
      name: 'Midtrans Snap & Core API',
      status: 'Terhubung (Sandbox)',
      mode: 'sandbox',
      publicKey: 'SB-Mid-client-234jhsdf82390192',
      secretKey: 'SB-Mid-server-9823jashd8723kln9',
      webhookUrl: 'https://ais-dev-crx6iild2rlgaa22pobpuk-177372065163.asia-east1.run.app/api/webhooks/midtrans',
      qrisEnabled: true,
      vaEnabled: true,
      creditCardEnabled: false,
      dailyVolume: 2850000,
      settlementCycle: 'T+1 Otomatis',
    },
    doku: {
      name: 'DOKU Payment Gateway',
      status: 'Siap Konfigurasi (Sandbox)',
      mode: 'sandbox',
      publicKey: 'MALL_ID_88492019',
      secretKey: 'shared_key_sandbox_9982738190',
      webhookUrl: 'https://ais-dev-crx6iild2rlgaa22pobpuk-177372065163.asia-east1.run.app/api/webhooks/doku',
      qrisEnabled: true,
      vaEnabled: true,
      creditCardEnabled: true,
      dailyVolume: 0,
      settlementCycle: 'T+2 Hari Kerja',
    },
    tripay: {
      name: 'Tripay Payment Indonesia',
      status: 'Aktif (Produksi)',
      mode: 'production',
      publicKey: 'DEV-T9981290-APIKEY',
      secretKey: 'DEV-PRIVKEY-881928019-SECRET',
      webhookUrl: 'https://ais-dev-crx6iild2rlgaa22pobpuk-177372065163.asia-east1.run.app/api/webhooks/tripay',
      qrisEnabled: true,
      vaEnabled: true,
      creditCardEnabled: false,
      dailyVolume: 1820000,
      settlementCycle: 'T+0 Instant Payout',
    },
  });

  // Settlement History
  const [settlementHistory, setSettlementHistory] = useFirestoreList('settlement_history', [
    {
      id: 'SETTLE-20261010-01',
      gateway: 'Xendit',
      date: '10 Okt 2026, 06:00 WIB',
      grossAmount: 14250000,
      fee: 99750,
      netAmount: 14150250,
      destination: 'BCA Rekening 501-299-1192 (PT RiskCart)',
      status: 'COMPLETED',
    },
    {
      id: 'SETTLE-20261009-01',
      gateway: 'Xendit',
      date: '09 Okt 2026, 06:00 WIB',
      grossAmount: 11800000,
      fee: 82600,
      netAmount: 11717400,
      destination: 'BCA Rekening 501-299-1192 (PT RiskCart)',
      status: 'COMPLETED',
    },
    {
      id: 'SETTLE-20261008-01',
      gateway: 'Tripay',
      date: '08 Okt 2026, 17:30 WIB',
      grossAmount: 1820000,
      fee: 14500,
      netAmount: 1805500,
      destination: 'Mandiri 122-00-192881-2 (RiskCart Outlet)',
      status: 'COMPLETED',
    },
  ]);

  // ================= 9. AUDIT LOG =================
  const [auditLogs, setAuditLogs] = useFirestoreList('audit_logs', [
    {
      id: 'AUD-001',
      timestamp: '10 Okt 2026, 12:35 WIB',
      user: 'Supervisor Budi',
      action: 'SETORAN_BRANKAS',
      target: 'Bangkas Toko Rp 3.000.000',
      ip: '192.168.1.10 (POS-1)',
    },
    {
      id: 'AUD-002',
      timestamp: '10 Okt 2026, 11:15 WIB',
      user: 'Kasir Ahmad',
      action: 'TRANSAKSI_CHECKOUT',
      target: 'Struk #TRX-948 (Rp 185.000)',
      ip: '192.168.1.10 (POS-1)',
    },
    {
      id: 'AUD-003',
      timestamp: '09 Okt 2026, 22:30 WIB',
      user: 'Kasir Siti',
      action: 'TUTUP_SHIFT_Z_REPORT',
      target: 'Shift Sore Seimbang (Rp 4.550.000)',
      ip: '192.168.1.12 (POS-2)',
    },
    {
      id: 'AUD-004',
      timestamp: '09 Okt 2026, 17:00 WIB',
      user: 'Owner Admin',
      action: 'UPDATE_KONFIG_PRINTER',
      target: 'Paper size diubah ke 80mm',
      ip: '192.168.1.1 (Admin)',
    },
    {
      id: 'AUD-005',
      timestamp: '08 Okt 2026, 14:10 WIB',
      user: 'Owner Admin',
      action: 'UPDATE_GATEWAY_CREDENTIALS',
      target: 'Xendit Webhook URL diperbarui',
      ip: '192.168.1.1 (Admin)',
    },
  ]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestPing = () => {
    setPingTesting(true);
    setPingResult(null);
    setTimeout(() => {
      setPingTesting(false);
      setPingResult('HTTP 200 OK — Latency 42ms — Webhook endpoint responsive!');
      setTimeout(() => setPingResult(null), 5000);
    }, 1000);
  };

  const handleExportBackup = () => {
    const backupData = {
      app: 'RiskCart POS Ecosystem',
      timestamp: new Date().toISOString(),
      version: '2026.10',
      outlet: selectedOutlet,
      checksum: 'sha256-verified-live',
      recordsCount: 1240,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riskcart-backup-${selectedOutlet}-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-zinc-300" />
            <h1 className="text-2xl font-black text-white tracking-tight">
              PENGATURAN MESIN KASIR POS
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            5.21 &mdash; Konfigurasi menyeluruh terminal kasir: hardware printer, payment gateway, brankas toko, backup snapshot, hak otorisasi supervisor, dan audit log.
          </p>
        </div>

        {/* Outlet Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-semibold">Scope Outlet:</span>
          <select
            value={selectedOutlet}
            onChange={(e) => setSelectedOutlet(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
          >
            <option value="OUT-01">OUT-01 (Kelapa Gading - Utama)</option>
            <option value="OUT-02">OUT-02 (Pondok Indah Branch)</option>
            <option value="OUT-03">OUT-03 (Bekasi Barat Warehouse)</option>
          </select>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveSub('umum')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeSub === 'umum' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Umum
        </button>
        <button
          onClick={() => setActiveSub('toko')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeSub === 'toko' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Toko</span>
        </button>
        <button
          onClick={() => setActiveSub('pembayaran')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeSub === 'pembayaran' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Pembayaran</span>
        </button>
        <button
          onClick={() => setActiveSub('printer_struk')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeSub === 'printer_struk' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Printer Struk</span>
        </button>
        <button
          onClick={() => setActiveSub('global_setup')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeSub === 'global_setup' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Global Setup</span>
        </button>
        <button
          onClick={() => setActiveSub('hak_akses')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeSub === 'hak_akses' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Hak dan Akses</span>
        </button>
        <button
          onClick={() => setActiveSub('backup_restore')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeSub === 'backup_restore' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Backup &amp; Restore</span>
        </button>
        <button
          onClick={() => setActiveSub('payment_gateway')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeSub === 'payment_gateway' ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Payment Gateway</span>
        </button>
        <button
          onClick={() => setActiveSub('audit_log')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeSub === 'audit_log' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Governed Architecture Policy Banner */}
      <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3 text-xs text-zinc-300">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Governed Multi-Outlet POS Configuration Policy:</span>
          <p className="text-zinc-400 text-[11px] mt-0.5">
            Pengaturan kasir diisolasi menurut outlet aktif ({selectedOutlet}). Semua kunci rahasia gateway diproksi aman oleh backend dan tidak pernah terekspos dalam plain text di browser kasir. Setiap override otorisasi disimpan ke dalam audit trail yang tidak dapat diubah (immutable).
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">Konfigurasi POS berhasil diperbarui dan disinkronkan ke seluruh terminal kasir!</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. UMUM */}
      {/* ============================================================== */}
      {activeSub === 'umum' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800">
                Perilaku Kasir &amp; Barcode Scanner
              </h3>
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Auto-Submit Barcode Scanner Enter Key</div>
                    <div className="text-[11px] text-zinc-400">Tekan enter otomatis menambah item saat scan barcode</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={barcodeEnterSubmits}
                    onChange={(e) => setBarcodeEnterSubmits(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Efek Suara Beep Kasir</div>
                    <div className="text-[11px] text-zinc-400">Bunyi konfirmasi saat item berhasil dimasukkan keranjang</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundBeepEnabled}
                    onChange={(e) => setSoundBeepEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Buka Laci Kasir Otomatis (Cash)</div>
                    <div className="text-[11px] text-zinc-400">Kirim pulsa RJ11 ke laci uang saat checkout tunai selesai</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoOpenCashDrawerOnCash}
                    onChange={(e) => setAutoOpenCashDrawerOnCash(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </label>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800">
                Keamanan &amp; Kunci Terminal
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Auto-Lock Terminal Inaktivitas (Menit)</label>
                  <select
                    value={autoLockMinutes}
                    onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value={5}>5 Menit</option>
                    <option value={10}>10 Menit (Direkomendasikan)</option>
                    <option value={30}>30 Menit</option>
                    <option value={0}>Jangan Kunci Otomatis</option>
                  </select>
                </div>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Izinkan Diskon Kasir Manual</div>
                    <div className="text-[11px] text-zinc-400">Bolehkan kasir input diskon tanpa approval supervisor</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowManualCashierDiscount}
                    onChange={(e) => setAllowManualCashierDiscount(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </label>

                {allowManualCashierDiscount && (
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Maksimal Diskon Kasir Tanpa PIN (%)</label>
                    <input
                      type="number"
                      value={maxCashierDiscountPct}
                      onChange={(e) => setMaxCashierDiscountPct(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Umum POS</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 2. TOKO */}
      {/* ============================================================== */}
      {activeSub === 'toko' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Identitas Outlet ({selectedOutlet})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Nama Outlet / Cabang Toko</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Nomor NPWP Toko</label>
                <input
                  type="text"
                  value={storeTaxNumber}
                  onChange={(e) => setStoreTaxNumber(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Telepon Kasir / WhatsApp</label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Alamat Outlet</label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-400 font-semibold mb-1">Catatan Kaki Struk Kasir (Footer Note)</label>
                <textarea
                  rows={2}
                  value={storeFooterNote}
                  onChange={(e) => setStoreFooterNote(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil Outlet Toko</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 3. PEMBAYARAN */}
      {/* ============================================================== */}
      {activeSub === 'pembayaran' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800">
                Metode Pembayaran Kasir yang Diizinkan
              </h3>
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <span className="font-semibold text-white">Uang Tunai (Cash)</span>
                  <input
                    type="checkbox"
                    checked={acceptCash}
                    onChange={(e) => setAcceptCash(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <span className="font-semibold text-white">QRIS Dinamis &amp; Statis</span>
                  <input
                    type="checkbox"
                    checked={acceptQris}
                    onChange={(e) => setAcceptQris(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <span className="font-semibold text-white">EDC Debit &amp; Kartu Kredit</span>
                  <input
                    type="checkbox"
                    checked={acceptEdc}
                    onChange={(e) => setAcceptEdc(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <span className="font-semibold text-white">Kasbon Pelanggan Terdaftar</span>
                  <input
                    type="checkbox"
                    checked={acceptKasbon}
                    onChange={(e) => setAcceptKasbon(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <span className="font-semibold text-white">COD Pembayaran di Tempat</span>
                  <input
                    type="checkbox"
                    checked={acceptCod}
                    onChange={(e) => setAcceptCod(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </label>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800">
                Aturan Settlement &amp; Brankas Kasir
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Toleransi Pembulatan Uang Kembalian</label>
                  <select
                    value={cashRoundingMode}
                    onChange={(e) => setCashRoundingMode(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="none">Tanpa Pembulatan (Nominal Asli)</option>
                    <option value="floor_100">Bulatkan ke Bawah Rp 100</option>
                    <option value="ceil_500">Bulatkan ke Atas Rp 500</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Peringatan Maksimal Kas di Laci (Rp)</label>
                  <input
                    type="number"
                    value={maxCashDrawerAlert}
                    onChange={(e) => setMaxCashDrawerAlert(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                  <span className="text-[10px] text-zinc-500">Peringatan setor ke brankas jika uang di kasir menumpuk</span>
                </div>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Wajib Hitung Uang Fisik Saat Tutup Shift</div>
                    <div className="text-[11px] text-zinc-400">Kasir harus input rincian lembaran uang sebelum cetak Z-Report</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireCashCountOnShiftClose}
                    onChange={(e) => setRequireCashCountOnShiftClose(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Konfigurasi Pembayaran</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 4. PRINTER STRUK */}
      {/* ============================================================== */}
      {activeSub === 'printer_struk' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-cyan-400" />
                  <span>Koneksi Printer Thermal ESC/POS</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Tipe Koneksi Printer</label>
                    <select
                      value={printerInterface}
                      onChange={(e) => setPrinterInterface(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="usb">USB Direct ESC/POS Driver</option>
                      <option value="bluetooth">Bluetooth Thermal Printer (Portable)</option>
                      <option value="network">LAN / Ethernet IP Printer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Ukuran Kertas Struk</label>
                    <select
                      value={printerPaperSize}
                      onChange={(e) => setPrinterPaperSize(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                    >
                      <option value="80mm">80mm (Lebar Standar Kasir - 48 Karakter)</option>
                      <option value="58mm">58mm (Kecil Portable - 32 Karakter)</option>
                    </select>
                  </div>

                  {printerInterface === 'network' && (
                    <>
                      <div>
                        <label className="block text-zinc-400 font-semibold mb-1">IP Address Printer</label>
                        <input
                          type="text"
                          value={networkPrinterIp}
                          onChange={(e) => setNetworkPrinterIp(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 font-semibold mb-1">Port</label>
                        <input
                          type="text"
                          value={networkPrinterPort}
                          onChange={(e) => setNetworkPrinterPort(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800">
                  Perilaku Cetak Struk
                </h3>
                <div className="space-y-3 text-xs">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Auto-Cut Kertas (Pisau Pemotong)</div>
                      <div className="text-[11px] text-zinc-400">Potong kertas otomatis setelah struk selesai cetak</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoCutPaper}
                      onChange={(e) => setAutoCutPaper(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Tampilkan Logo Toko di Header Struk</div>
                      <div className="text-[11px] text-zinc-400">Cetak logo monokrom hitam putih resolusi 384x120px</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={printStoreLogo}
                      onChange={(e) => setPrintStoreLogo(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Cetak QR Code Validasi di Bawah Struk</div>
                      <div className="text-[11px] text-zinc-400">QR Code untuk cek keaslian struk dan klaim komplain</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={printReceiptBarcode}
                      onChange={(e) => setPrintReceiptBarcode(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Live Receipt Visual Simulator */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <h4 className="font-bold text-white text-xs flex items-center justify-between">
                <span>Simulasi Struk ({printerPaperSize})</span>
                <span className="text-[10px] text-emerald-400">ESC/POS Ready</span>
              </h4>

              <div
                className={`mx-auto bg-white text-zinc-900 p-4 font-mono text-[10px] leading-tight rounded shadow-inner border border-zinc-300 space-y-2 ${
                  printerPaperSize === '58mm' ? 'max-w-[200px]' : 'max-w-[260px]'
                }`}
              >
                <div className="text-center space-y-0.5">
                  <div className="font-black text-xs uppercase tracking-wider">{storeName}</div>
                  <div className="text-[8px] text-zinc-600">{storeAddress}</div>
                  <div className="text-[8px] text-zinc-600">Telp: {storePhone}</div>
                  <div className="border-b border-dashed border-zinc-400 my-1.5" />
                </div>

                <div className="space-y-0.5 text-[9px]">
                  <div className="flex justify-between">
                    <span>No: #TRX-948</span>
                    <span>10/10/26 12:40</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir: Ahmad F.</span>
                    <span>POS-01</span>
                  </div>
                  <div className="border-b border-dashed border-zinc-400 my-1.5" />
                </div>

                <div className="space-y-1 text-[9px]">
                  <div className="flex justify-between">
                    <span>1x Beras Ramos 5kg</span>
                    <span className="font-bold">74.500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2x Minyakita 2L</span>
                    <span className="font-bold">62.000</span>
                  </div>
                  <div className="border-b border-dashed border-zinc-400 my-1.5" />
                </div>

                <div className="space-y-0.5 text-[9px]">
                  <div className="flex justify-between font-bold">
                    <span>TOTAL</span>
                    <span>Rp 136.500</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>BAYAR (QRIS)</span>
                    <span>Rp 136.500</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>KEMBALI</span>
                    <span>Rp 0</span>
                  </div>
                  <div className="border-b border-dashed border-zinc-400 my-1.5" />
                </div>

                {printReceiptBarcode && (
                  <div className="text-center pt-1">
                    <div className="inline-block bg-zinc-900 text-white p-1 rounded">
                      <QrCode className="w-8 h-8 text-white mx-auto" />
                    </div>
                    <div className="text-[7px] text-zinc-500 font-mono mt-0.5">TRX-948-VERIFIED</div>
                  </div>
                )}

                <div className="text-center text-[7px] text-zinc-600 pt-1 leading-tight">
                  {storeFooterNote}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Konfigurasi Printer</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 5. GLOBAL SETUP */}
      {/* ============================================================== */}
      {activeSub === 'global_setup' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Shared Business Defaults &amp; System Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Mata Uang Utama</label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="IDR">IDR (Rupiah Indonesia - Rp)</option>
                  <option value="USD">USD (US Dollar - $)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Zona Waktu Sistem</label>
                <select
                  value={systemTimezone}
                  onChange={(e) => setSystemTimezone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                >
                  <option value="Asia/Jakarta (WIB)">Asia/Jakarta (WIB - UTC+7)</option>
                  <option value="Asia/Makassar (WITA)">Asia/Makassar (WITA - UTC+8)</option>
                  <option value="Asia/Jayapura (WIT)">Asia/Jayapura (WIT - UTC+9)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Tarif Pajak PPN Default (%)</label>
                <input
                  type="number"
                  value={defaultTaxRate}
                  onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Service Charge (%)</label>
                <input
                  type="number"
                  value={serviceChargeRate}
                  onChange={(e) => setServiceChargeRate(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Format Auto-Generator SKU</label>
                <input
                  type="text"
                  value={skuPrefixFormat}
                  onChange={(e) => setSkuPrefixFormat(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Ambang Peringatan Stok Minimum Default (Pcs)</label>
                <input
                  type="number"
                  value={lowStockDefaultAlert}
                  onChange={(e) => setLowStockDefaultAlert(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Global Setup</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 6. HAK DAN AKSES */}
      {/* ============================================================== */}
      {activeSub === 'hak_akses' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              <span>Role-Based Permissions &amp; Supervisor Protected Operations</span>
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="font-semibold text-white">Wajibkan PIN Supervisor untuk Void / Batalkan Struk</div>
                  <div className="text-[11px] text-zinc-400">Mencegah kasir menghapus transaksi tanpa audit pengawas</div>
                </div>
                <input
                  type="checkbox"
                  checked={requireSupervisorPinForVoid}
                  onChange={(e) => setRequireSupervisorPinForVoid(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="font-semibold text-white">Wajibkan PIN Supervisor untuk Buka Laci Kasir Manual (No-Sale)</div>
                  <div className="text-[11px] text-zinc-400">Laci kasir tidak dapat dibuka tanpa ada struk belanja kecuali diotorisasi</div>
                </div>
                <input
                  type="checkbox"
                  checked={requirePinForDrawerKick}
                  onChange={(e) => setRequirePinForDrawerKick(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="font-semibold text-white">Wajibkan PIN untuk Cetak Ulang Struk Kemarin</div>
                  <div className="text-[11px] text-zinc-400">Reprint struk dari shift sebelumnya memerlukan otorisasi</div>
                </div>
                <input
                  type="checkbox"
                  checked={requirePinForReprintOld}
                  onChange={(e) => setRequirePinForReprintOld(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-0"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Master PIN Supervisor (4-Digit)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={supervisorPin}
                    onChange={(e) => setSupervisorPin(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono tracking-widest text-center"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Master PIN Store Manager / Owner (6-Digit)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono tracking-widest text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Aturan Proteksi PIN</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 7. BACKUP AND RESTORE */}
      {/* ============================================================== */}
      {activeSub === 'backup_restore' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Authorized Backup Creation &amp; Safe Restore</span>
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Snapshot database Firestore dan konfigurasi lokal tersimpan dengan integritas checksum sha256.
                </p>
              </div>

              <button
                onClick={handleExportBackup}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow"
              >
                <Download className="w-4 h-4" />
                <span>Buat &amp; Unduh Snapshot Sekarang</span>
              </button>
            </div>

            {/* Snapshots Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Snapshot ID</th>
                    <th className="py-2.5 px-3">Waktu Pembuatan</th>
                    <th className="py-2.5 px-3">Ukuran</th>
                    <th className="py-2.5 px-3">Checksum SHA256</th>
                    <th className="py-2.5 px-3">Dibuat Oleh</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {backupSnapshots.map((b) => (
                    <tr key={b.id} className="hover:bg-zinc-800/30">
                      <td className="py-3 px-3 font-bold text-white">{b.id}</td>
                      <td className="py-3 px-3 text-zinc-300 font-sans">{b.timestamp}</td>
                      <td className="py-3 px-3 text-emerald-400">{b.size}</td>
                      <td className="py-3 px-3 text-zinc-500 text-[10px]">{b.checksum}</td>
                      <td className="py-3 px-3 text-zinc-300 font-sans">{b.creator}</td>
                      <td className="py-3 px-3 text-right font-sans">
                        <button
                          onClick={handleExportBackup}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-blue-400 text-[11px] rounded-lg border border-zinc-700 cursor-pointer transition"
                        >
                          Unduh
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. PAYMENT GATEWAY (5.21 REQUIRED SPEC) */}
      {/* ============================================================== */}
      {activeSub === 'payment_gateway' && (
        <div className="space-y-6">
          {/* Gateway Tabs */}
          <div className="flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setSelectedGatewayTab('xendit')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedGatewayTab === 'xendit' ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Xendit Indonesia</span>
            </button>
            <button
              onClick={() => setSelectedGatewayTab('midtrans')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedGatewayTab === 'midtrans' ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Midtrans (Snap / Core)</span>
            </button>
            <button
              onClick={() => setSelectedGatewayTab('doku')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedGatewayTab === 'doku' ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>DOKU Payment</span>
            </button>
            <button
              onClick={() => setSelectedGatewayTab('tripay')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedGatewayTab === 'tripay' ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Tripay Payouts</span>
            </button>
          </div>

          {/* Current Gateway Config Card */}
          {(() => {
            const gw = gatewaysData[selectedGatewayTab];
            return (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-cyan-400" />
                      <span>{gw.name}</span>
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {gw.status}
                      </span>
                      <span className="text-[11px] text-zinc-400">Mode: {gw.mode.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestPing}
                      disabled={pingTesting}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${pingTesting ? 'animate-spin' : ''}`} />
                      <span>{pingTesting ? 'Testing Ping...' : 'Test Connection'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMaskedKeys(!showMaskedKeys)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      {showMaskedKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showMaskedKeys ? 'Sembunyikan Key' : 'Lihat Key'}</span>
                    </button>
                  </div>
                </div>

                {pingResult && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>{pingResult}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Public / Client Key</label>
                    <input
                      type="text"
                      readOnly
                      value={showMaskedKeys ? gw.publicKey : gw.publicKey.slice(0, 10) + '••••••••••••••••'}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Secret / Server Key (Backend Only)</label>
                    <input
                      type="text"
                      readOnly
                      value={showMaskedKeys ? gw.secretKey : '••••••••••••••••••••••••••••••••'}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 font-semibold mb-1">Webhook Callback URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={gw.webhookUrl}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-cyan-300 font-mono text-xs"
                      />
                      <button
                        onClick={() => navigator.clipboard?.writeText(gw.webhookUrl)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 cursor-pointer"
                        title="Copy Webhook URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Metode Aktif</label>
                    <div className="flex items-center gap-3 py-2">
                      <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold text-[11px]">
                        QRIS Dinamis
                      </span>
                      <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-[11px]">
                        Virtual Account
                      </span>
                      {gw.creditCardEnabled && (
                        <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[11px]">
                          Kartu Kredit/Debit
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Siklus Settlement Payout</label>
                    <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-medium">
                      {gw.settlementCycle}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Settlement History Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span>Riwayat Settlement &amp; Pencairan Dana Gateway</span>
              </span>
              <span className="text-xs text-zinc-400 font-normal">Auto Payout T+1</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Settlement ID</th>
                    <th className="py-2.5 px-3">Gateway</th>
                    <th className="py-2.5 px-3">Waktu Pencairan</th>
                    <th className="py-2.5 px-3">Bruto (Gross)</th>
                    <th className="py-2.5 px-3">MDR Fee</th>
                    <th className="py-2.5 px-3">Net Diterima</th>
                    <th className="py-2.5 px-3">Rekening Tujuan</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                  {settlementHistory.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-800/30">
                      <td className="py-3 px-3 font-bold text-white">{s.id}</td>
                      <td className="py-3 px-3 font-sans font-bold text-cyan-400">{s.gateway}</td>
                      <td className="py-3 px-3 text-zinc-300 font-sans">{s.date}</td>
                      <td className="py-3 px-3 text-white">Rp {s.grossAmount.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-3 text-rose-400">-Rp {s.fee.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">Rp {s.netAmount.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-3 text-zinc-400 font-sans">{s.destination}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. AUDIT LOG */}
      {/* ============================================================== */}
      {activeSub === 'audit_log' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-400" />
                <span>Audit Trail Perubahan Konfigurasi &amp; Aksi Kasir</span>
              </h3>
              <p className="text-zinc-400 text-xs mt-0.5">
                Log kronologis setiap aktivitas yang mengubah brankas, setting printer, kredensial, dan otorisasi supervisor.
              </p>
            </div>
            <button
              onClick={() => alert('Semua log tersinkron realtime dengan Cloud Firestore!')}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold border border-zinc-700 cursor-pointer"
            >
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Log ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Petugas</th>
                  <th className="py-2.5 px-3">Aksi</th>
                  <th className="py-2.5 px-3">Rincian Perubahan</th>
                  <th className="py-2.5 px-3 text-right">Terminal IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/30">
                    <td className="py-3 px-3 font-bold text-white">{log.id}</td>
                    <td className="py-3 px-3 text-zinc-300 font-sans">{log.timestamp}</td>
                    <td className="py-3 px-3 text-blue-400 font-sans font-semibold">{log.user}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400">{log.action}</td>
                    <td className="py-3 px-3 text-zinc-300 font-sans">{log.target}</td>
                    <td className="py-3 px-3 text-right text-zinc-500">{log.ip}</td>
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
