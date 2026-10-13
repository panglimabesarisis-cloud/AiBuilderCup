import React, { useState } from 'react';
import {
  Smartphone,
  Sliders,
  ShoppingBag,
  Bell,
  CreditCard,
  Lock,
  Save,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  ShieldCheck,
  Send,
  MessageSquare,
  Mail,
  MapPin,
  Clock,
  Layers,
  Database,
  FileText,
  UserCheck,
  Key,
  QrCode,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface PWASettingsModuleProps {
  subModule: 'umum' | 'order_pelanggan' | 'notifikasi' | 'pembayaran' | 'hak_akses';
  currencyMode?: 'IDR' | 'USD';
  onNavigateTab?: (tab: string) => void;
}

export const PWASettingsModule: React.FC<PWASettingsModuleProps> = ({
  subModule,
  currencyMode = 'IDR',
  onNavigateTab,
}) => {
  const [activeSub, setActiveSub] = useState<'umum' | 'order_pelanggan' | 'notifikasi' | 'pembayaran' | 'hak_akses'>(subModule);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // ================= 1. UMUM (5.20) =================
  const [appName, setAppName] = useState('RiskCart Member PWA');
  const [shortName, setShortName] = useState('RiskCart App');
  const [pwaThemeColor, setPwaThemeColor] = useState('#2563eb');
  const [pwaBgColor, setPwaBgColor] = useState('#09090b');
  const [displayMode, setDisplayMode] = useState<'standalone' | 'fullscreen' | 'minimal-ui'>('standalone');
  const [offlineCacheEnabled, setOfflineCacheEnabled] = useState(true);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [enableA2hsBanner, setEnableA2hsBanner] = useState(true);
  const [cacheVersion, setCacheVersion] = useState('v2.4.10-rev3');

  // ================= 2. ORDER PELANGGAN (5.20) =================
  // Methods
  const [allowDineInTableQr, setAllowDineInTableQr] = useState(true);
  const [allowTakeaway, setAllowTakeaway] = useState(true);
  const [allowStoreDelivery, setAllowStoreDelivery] = useState(true);
  const [allowInstantCourier, setAllowInstantCourier] = useState(true);

  // Minimum order rules
  const [minOrderPickup, setMinOrderPickup] = useState(15000);
  const [minOrderDelivery, setMinOrderDelivery] = useState(50000);
  const [maxItemPerOrder, setMaxItemPerOrder] = useState(60);
  const [cartReservationTimeoutMinutes, setCartReservationTimeoutMinutes] = useState(20);

  // Fulfillment & Service Areas
  const [enableTimeSlotDelivery, setEnableTimeSlotDelivery] = useState(true);
  const [allowMultiSavedAddresses, setAllowMultiSavedAddresses] = useState(true);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(7);
  const [deliveryBaseFee, setDeliveryBaseFee] = useState(8000);
  const [deliveryFeePerKm, setDeliveryFeePerKm] = useState(2500);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(150000);

  // ================= 3. NOTIFIKASI (5.20) =================
  // Channels
  const [waGatewayActive, setWaGatewayActive] = useState(true);
  const [waGatewayProvider, setWaGatewayProvider] = useState<'wablas' | 'fonnte' | 'twilio'>('fonnte');
  const [webPushActive, setWebPushActive] = useState(true);
  const [emailTxActive, setEmailTxActive] = useState(true);

  // Templates
  const [waTemplateOrderPlaced, setWaTemplateOrderPlaced] = useState(
    'Halo {{customer_name}}, pesanan {{order_id}} sebesar Rp {{total}} telah kami terima di RiskCart! Kami sedang menyiapkannya.'
  );
  const [waTemplateOrderDispatched, setWaTemplateOrderDispatched] = useState(
    'Pesanan {{order_id}} sudah dalam perjalanan diantar oleh kurir {{courier_name}} (HP: {{courier_phone}}). Estimasi tiba 20 menit.'
  );
  const [waTemplateAbandonedCart, setWaTemplateAbandonedCart] = useState(
    'Halo {{customer_name}}, produk favorit Anda di keranjang RiskCart masih menunggu! Selesaikan pesanan sekarang sebelum stok habis: {{cart_link}}'
  );
  const [enableAbandonedCartReminder, setEnableAbandonedCartReminder] = useState(true);

  // ================= 4. PEMBAYARAN (5.20) =================
  const [enableQrisPwa, setEnableQrisPwa] = useState(true);
  const [enableVaBca, setEnableVaBca] = useState(true);
  const [enableVaMandiri, setEnableVaMandiri] = useState(true);
  const [enableVaBri, setEnableVaBri] = useState(true);
  const [enableEwalletGopay, setEnableEwalletGopay] = useState(true);
  const [enableEwalletShopeepay, setEnableEwalletShopeepay] = useState(true);
  const [enableCodPwa, setEnableCodPwa] = useState(true);
  const [maxCodLimit, setMaxCodLimit] = useState(300000);
  const [enableMemberKasbon, setEnableMemberKasbon] = useState(true);
  const [paymentExpiryMinutes, setPaymentExpiryMinutes] = useState(15);
  const [autoCancelUnpaid, setAutoCancelUnpaid] = useState(true);

  // ================= 5. HAK DAN AKSES (5.20) =================
  const [authMethod, setAuthMethod] = useState<'whatsapp_otp' | 'google_sso' | 'both'>('both');
  const [allowGuestWithoutLogin, setAllowGuestWithoutLogin] = useState(false);
  const [requireGpsValidation, setRequireGpsValidation] = useState(true);
  const [blockMockGps, setBlockMockGps] = useState(true);
  const [enableTurnstileAntiBot, setEnableTurnstileAntiBot] = useState(true);
  const [autoHoldFraudRiskOrders, setAutoHoldFraudRiskOrders] = useState(true);
  const [fraudScoreThreshold, setFraudScoreThreshold] = useState(70);
  const [allowCustomerDownloadInvoicePdf, setAllowCustomerDownloadInvoicePdf] = useState(true);
  const [enforceUuPdpPrivacyConsent, setEnforceUuPdpPrivacyConsent] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-black text-white tracking-tight">
            PENGATURAN CLIENT PWA
          </h1>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          5.20 &mdash; Pengaturan terpisah PWA: branding aplikasi, aturan order pelanggan, gateway notifikasi, checkout pembayaran, dan otentikasi hak akses.
        </p>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto w-fit max-w-full mb-4">
          <button
            onClick={() => setActiveSub('umum')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSub === 'umum' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Umum
          </button>
          <button
            onClick={() => setActiveSub('order_pelanggan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeSub === 'order_pelanggan' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Pelanggan</span>
          </button>
          <button
            onClick={() => setActiveSub('notifikasi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeSub === 'notifikasi' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifikasi</span>
          </button>
          <button
            onClick={() => setActiveSub('pembayaran')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeSub === 'pembayaran' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pembayaran</span>
          </button>
          <button
            onClick={() => setActiveSub('hak_akses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeSub === 'hak_akses' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Hak dan Akses</span>
          </button>
        </div>

      {/* Security and Separation Notice */}
      <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-900/60 flex items-start gap-3 text-xs text-purple-200">
        <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Separation of Concerns &amp; Shared Backend Services:</span>
          <p className="text-zinc-300 text-[11px] mt-0.5">
            Pengaturan PWA tersimpan independen dari terminal kasir POS, namun tetap membagikan service pembayaran terotorisasi, validasi stok katalog tunggal, dan data pelanggan.
            Semua input order divalidasi ketat di sisi server untuk melindungi integritas data bisnis.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">Konfigurasi Pengaturan PWA berhasil disimpan ke Firestore!</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. UMUM */}
      {/* ============================================================== */}
      {activeSub === 'umum' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span>PWA Branding &amp; Manifest</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Nama Aplikasi (Manifest Full Title)</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Short Name (Ikon HP)</label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Theme Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pwaThemeColor}
                        onChange={(e) => setPwaThemeColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-white text-xs">{pwaThemeColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pwaBgColor}
                        onChange={(e) => setPwaBgColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-white text-xs">{pwaBgColor}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Display Mode</label>
                  <select
                    value={displayMode}
                    onChange={(e) => setDisplayMode(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="standalone">Standalone (Direkomendasikan - Layar Penuh Aplikasi)</option>
                    <option value="fullscreen">Fullscreen</option>
                    <option value="minimal-ui">Minimal UI</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Preferensi Cache &amp; Service Worker</span>
              </h3>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Offline Caching &amp; Background Sync</div>
                    <div className="text-[11px] text-zinc-400">Keranjang belanja tersimpan aman saat sinyal hilang</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={offlineCacheEnabled}
                    onChange={(e) => setOfflineCacheEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Auto-Update Prompter</div>
                    <div className="text-[11px] text-zinc-400">Otomatis notifikasi jika ada versi PWA baru</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoUpdateEnabled}
                    onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Prompt Install Layar Utama (A2HS)</div>
                    <div className="text-[11px] text-zinc-400">Tampilkan banner &quot;Tambahkan ke Layar Utama&quot;</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableA2hsBanner}
                    onChange={(e) => setEnableA2hsBanner(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-0"
                  />
                </label>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Service Worker Cache Tag</label>
                  <input
                    type="text"
                    value={cacheVersion}
                    onChange={(e) => setCacheVersion(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-900/30"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Umum PWA</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 2. ORDER PELANGGAN */}
      {/* ============================================================== */}
      {activeSub === 'order_pelanggan' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Metode Pemesanan & Batasan */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-400" />
                <span>Metode Order &amp; Batas Keranjang</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowDineInTableQr}
                      onChange={(e) => setAllowDineInTableQr(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-white font-semibold">QR Meja (Dine-in)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowTakeaway}
                      onChange={(e) => setAllowTakeaway(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-white font-semibold">Ambil Toko (Takeaway)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowStoreDelivery}
                      onChange={(e) => setAllowStoreDelivery(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-white font-semibold">Kurir Toko Internal</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowInstantCourier}
                      onChange={(e) => setAllowInstantCourier(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-white font-semibold">Instant GoSend/Grab</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Min. Belanja Pickup (Rp)</label>
                    <input
                      type="number"
                      value={minOrderPickup}
                      onChange={(e) => setMinOrderPickup(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Min. Belanja Delivery (Rp)</label>
                    <input
                      type="number"
                      value={minOrderDelivery}
                      onChange={(e) => setMinOrderDelivery(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Maks Item / Keranjang (Pcs)</label>
                    <input
                      type="number"
                      value={maxItemPerOrder}
                      onChange={(e) => setMaxItemPerOrder(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Masa Kunci Stok Keranjang</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={cartReservationTimeoutMinutes}
                        onChange={(e) => setCartReservationTimeoutMinutes(Number(e.target.value))}
                        className="w-20 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                      />
                      <span className="text-zinc-400">Menit</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Area Layanan & Fulfillment */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Area Layanan &amp; Penyesuaian Ongkir</span>
              </h3>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Jadwal Pengiriman Berjadwal (Slot Waktu)</div>
                    <div className="text-[11px] text-zinc-400">Pilih slot pengantaran Pagi (09-12) / Sore (14-17)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableTimeSlotDelivery}
                    onChange={(e) => setEnableTimeSlotDelivery(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </label>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Radius Layanan Outlet (Kilometer)</label>
                  <input
                    type="number"
                    value={serviceRadiusKm}
                    onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Tarif Dasar Kurir Toko (Rp)</label>
                    <input
                      type="number"
                      value={deliveryBaseFee}
                      onChange={(e) => setDeliveryBaseFee(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Tambah per KM &gt; 2KM (Rp)</label>
                    <input
                      type="number"
                      value={deliveryFeePerKm}
                      onChange={(e) => setDeliveryFeePerKm(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Minimal Belanja Bebas Ongkir (Rp)</label>
                  <input
                    type="number"
                    value={freeDeliveryThreshold}
                    onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Aturan Order Pelanggan</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 3. NOTIFIKASI */}
      {/* ============================================================== */}
      {activeSub === 'notifikasi' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kanal Notifikasi */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Saluran Notifikasi (Channels)</span>
              </h3>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-white">WhatsApp Gateway</div>
                      <div className="text-[11px] text-zinc-400">Kirim struk digital &amp; status ke WA pelanggan</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={waGatewayActive}
                    onChange={(e) => setWaGatewayActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-0"
                  />
                </label>

                {waGatewayActive && (
                  <div className="pl-4 border-l-2 border-emerald-500/50 space-y-2">
                    <label className="block text-zinc-400 font-semibold mb-1">Provider WhatsApp Gateway</label>
                    <select
                      value={waGatewayProvider}
                      onChange={(e) => setWaGatewayProvider(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="fonnte">Fonnte API (Official WA Gateway)</option>
                      <option value="wablas">Wablas Enterprise</option>
                      <option value="twilio">Twilio WhatsApp Business API</option>
                    </select>
                  </div>
                )}

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-semibold text-white">Web Push Notification (Service Worker)</div>
                      <div className="text-[11px] text-zinc-400">Pop-up notifikasi langsung di layar HP pembeli</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={webPushActive}
                    onChange={(e) => setWebPushActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-semibold text-white">Email Transaksional &amp; Faktur Pajak</div>
                      <div className="text-[11px] text-zinc-400">Kirim PDF receipt ke email terdaftar</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailTxActive}
                    onChange={(e) => setEmailTxActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-0"
                  />
                </label>
              </div>
            </div>

            {/* Template Pesan */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Template Pesan WhatsApp Otomatis</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Pesanan Diterima (Order Confirmed)</label>
                  <textarea
                    rows={2}
                    value={waTemplateOrderPlaced}
                    onChange={(e) => setWaTemplateOrderPlaced(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Pesanan Dikirim / Dalam Pengantaran</label>
                  <textarea
                    rows={2}
                    value={waTemplateOrderDispatched}
                    onChange={(e) => setWaTemplateOrderDispatched(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-400 font-semibold">Pengingat Keranjang Terbengkalai (Abandoned Cart)</label>
                    <input
                      type="checkbox"
                      checked={enableAbandonedCartReminder}
                      onChange={(e) => setEnableAbandonedCartReminder(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-0"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={waTemplateAbandonedCart}
                    onChange={(e) => setWaTemplateAbandonedCart(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-900/30"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Konfigurasi Notifikasi</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 4. PEMBAYARAN */}
      {/* ============================================================== */}
      {activeSub === 'pembayaran' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Metode Pembayaran Online PWA yang Diaktifkan</span>
              </h3>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-white">QRIS Dinamis Otomatis</div>
                      <div className="text-[11px] text-zinc-400">Verifikasi otomatis via Midtrans / Xendit callback</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableQrisPwa}
                    onChange={(e) => setEnableQrisPwa(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">BCA Virtual Account</div>
                    <div className="text-[11px] text-zinc-400">Nomor rekening virtual unik per pesanan</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableVaBca}
                    onChange={(e) => setEnableVaBca(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Mandiri &amp; BRI Virtual Account</div>
                    <div className="text-[11px] text-zinc-400">Mendukung ATM, Mobile Banking, Internet Banking</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableVaMandiri}
                    onChange={(e) => setEnableVaMandiri(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">E-Wallet (GoPay &amp; ShopeePay)</div>
                    <div className="text-[11px] text-zinc-400">Deeplink langsung membuka aplikasi dompet digital</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableEwalletGopay}
                    onChange={(e) => setEnableEwalletGopay(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">COD Tunai Saat Diantar</div>
                    <div className="text-[11px] text-zinc-400">Pembayaran tunai kepada kurir toko</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableCodPwa}
                    onChange={(e) => setEnableCodPwa(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                  />
                </label>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Aturan Kedaluwarsa &amp; Limit Checkout</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Maksimal Nominal COD Tunai (Rp)</label>
                  <input
                    type="number"
                    value={maxCodLimit}
                    onChange={(e) => setMaxCodLimit(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                  <span className="text-[10px] text-zinc-500">Mencegah risiko gagal bayar dan pembatalan sepihak</span>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Batas Waktu Pembayaran QRIS / VA (Menit)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={paymentExpiryMinutes}
                      onChange={(e) => setPaymentExpiryMinutes(Number(e.target.value))}
                      className="w-24 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                    />
                    <span className="text-zinc-400">Menit sebelum pesanan otomatis batal</span>
                  </div>
                </div>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Auto-Cancel &amp; Kembalikan Stok</div>
                    <div className="text-[11px] text-zinc-400">Lepaskan stok kembali ke rak jika lewat batas waktu</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoCancelUnpaid}
                    onChange={(e) => setAutoCancelUnpaid(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Aturan Pembayaran PWA</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 5. HAK DAN AKSES */}
      {/* ============================================================== */}
      {activeSub === 'hak_akses' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Otentikasi &amp; Akses Profil Pelanggan</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Metode Autentikasi Registrasi</label>
                  <select
                    value={authMethod}
                    onChange={(e) => setAuthMethod(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="both">WhatsApp OTP &amp; Google Sign-In (Keduanya)</option>
                    <option value="whatsapp_otp">Hanya Nomor WhatsApp OTP</option>
                    <option value="google_sso">Hanya Akun Google SSO</option>
                  </select>
                </div>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Izinkan Guest Checkout</div>
                    <div className="text-[11px] text-zinc-400">Pembeli dapat checkout tanpa mendaftar akun</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowGuestWithoutLogin}
                    onChange={(e) => setAllowGuestWithoutLogin(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Unduh PDF Faktur &amp; E-Struk Resmi</div>
                    <div className="text-[11px] text-zinc-400">Pelanggan dapat mencetak struk dari riwayat pesanan</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowCustomerDownloadInvoicePdf}
                    onChange={(e) => setAllowCustomerDownloadInvoicePdf(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Persetujuan Privasi Data (UU PDP)</div>
                    <div className="text-[11px] text-zinc-400">Wajibkan centang syarat privasi saat checkout pertama</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforceUuPdpPrivacyConsent}
                    onChange={(e) => setEnforceUuPdpPrivacyConsent(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-0"
                  />
                </label>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Proteksi Anti-Fraud &amp; Validasi Perangkat</span>
              </h3>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Validasi GPS Perangkat Nyata</div>
                    <div className="text-[11px] text-zinc-400">Wajibkan izin lokasi akurat saat delivery</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireGpsValidation}
                    onChange={(e) => setRequireGpsValidation(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Blokir Fake GPS / Mock Location</div>
                    <div className="text-[11px] text-zinc-400">Tolak order dari emulator atau aplikasi spoof GPS</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={blockMockGps}
                    onChange={(e) => setBlockMockGps(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Tahan Order Resiko Fraud Tinggi</div>
                    <div className="text-[11px] text-zinc-400">Order dengan fraud score &gt; threshold ditahan untuk verifikasi kasir</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoHoldFraudRiskOrders}
                    onChange={(e) => setAutoHoldFraudRiskOrders(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-0"
                  />
                </label>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Ambang Batas Skor Fraud (0 - 100)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="40"
                      max="90"
                      value={fraudScoreThreshold}
                      onChange={(e) => setFraudScoreThreshold(Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                    <span className="font-mono font-bold text-rose-400 text-sm">{fraudScoreThreshold}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">Nilai rekomendasi: 70</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-900/30"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Aturan Hak dan Akses PWA</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
