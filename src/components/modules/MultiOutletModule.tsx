import { useFirestoreList } from '../../hooks/useFirestoreList';
import React, { useState } from 'react';
import {
  Store,
  Warehouse,
  Plus,
  MapPin,
  Building2,
  Boxes,
  ArrowRightLeft,
  CheckCircle,
  AlertCircle,
  Phone,
  Clock,
  ShieldCheck,
  RefreshCw,
  Search,
} from 'lucide-react';

interface MultiOutletModuleProps {
  subModule: 'lihat_outlet' | 'warehose';
  currencyMode?: 'IDR' | 'USD';
  onNavigateTab?: (tab: string) => void;
}

export const MultiOutletModule: React.FC<MultiOutletModuleProps> = ({
  subModule,
  currencyMode = 'IDR',
  onNavigateTab,
}) => {
  const [activeSub, setActiveSub] = useState<'lihat_outlet' | 'warehose'>(subModule);
  const [searchQuery, setSearchQuery] = useState('');

  // Outlets Data
  const [outlets, setOutlets] = useFirestoreList('outlets', [
    {
      id: 'out_1',
      name: 'RiskCart Flagship Store (Pusat)',
      code: 'RC-JKT-01',
      type: 'Toko Utama & Hub',
      address: 'Jl. Boulevard Raya Blok QF1 No. 12, Kelapa Gading, Jakarta Utara',
      phone: '+62 812-9988-7711',
      cashierActive: 3,
      todaySales: 18450000,
      stockValue: 142000000,
      status: 'active',
      geofenceRadius: 300,
      isHQ: true,
    },
    {
      id: 'out_2',
      name: 'RiskCart Express Tebet',
      code: 'RC-JKT-02',
      type: 'Cabang Satelit',
      address: 'Jl. Tebet Barat Dalam Raya No. 45, Jakarta Selatan',
      phone: '+62 813-2233-4455',
      cashierActive: 1,
      todaySales: 7230000,
      stockValue: 56000000,
      status: 'active',
      geofenceRadius: 250,
      isHQ: false,
    },
    {
      id: 'out_3',
      name: 'RiskCart Kios BSD Fresh',
      code: 'RC-TGR-01',
      type: 'Cabang Kios',
      address: 'Ruko Golden Madrid 2 Blok F-08, BSD City, Tangerang Selatan',
      phone: '+62 817-4455-6677',
      cashierActive: 2,
      todaySales: 5120000,
      stockValue: 39500000,
      status: 'active',
      geofenceRadius: 200,
      isHQ: false,
    },
  ]);

  // Warehouses Data
  const [warehouses, setWarehouses] = useFirestoreList('warehouses', [
    {
      id: 'wh_1',
      name: 'Central Distribution Center (CDC Cikarang)',
      code: 'WH-CKR-CENTRAL',
      manager: 'Bambang Supriyanto',
      capacityPct: 78,
      cartonsStored: 4850,
      pendingTransfer: 4,
      address: 'Kawasan Industri Delta Silicon 3, Lippo Cikarang',
      temperature: 'Ambient (24°C)',
      status: 'active',
    },
    {
      id: 'wh_2',
      name: 'Hub Transit Jakarta Utara',
      code: 'WH-JKT-NORTH',
      manager: 'Rian Hidayat',
      capacityPct: 45,
      cartonsStored: 1420,
      pendingTransfer: 1,
      address: 'Kawasan Pergudangan Pluit Blok C No. 5, Pluit, Jakarta Utara',
      temperature: 'Cold Storage (4°C) & Ambient',
      status: 'active',
    },
  ]);

  // Modal State for New Outlet
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOutletName, setNewOutletName] = useState('');
  const [newOutletCode, setNewOutletCode] = useState('');
  const [newOutletAddress, setNewOutletAddress] = useState('');
  const [newOutletPhone, setNewOutletPhone] = useState('');

  const handleCreateOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutletName) return;
    const newEntry = {
      id: `out_${Date.now()}`,
      name: newOutletName,
      code: newOutletCode || `RC-BRN-${outlets.length + 1}`,
      type: 'Cabang Satelit',
      address: newOutletAddress || 'Alamat operasional toko',
      phone: newOutletPhone || '+62 811-0000-0000',
      cashierActive: 1,
      todaySales: 0,
      stockValue: 0,
      status: 'active',
      geofenceRadius: 250,
      isHQ: false,
    };
    setOutlets([...outlets, newEntry]);
    setShowAddModal(false);
    setNewOutletName('');
    setNewOutletCode('');
    setNewOutletAddress('');
    setNewOutletPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-black text-white tracking-tight">
              MULTI OUTLET ECOSYSTEM
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manajemen hierarki toko fisik, sinkronisasi inventori multi-cabang, dan pergudangan terpusat (*Central Warehouse*).
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            onClick={() => setActiveSub('lihat_outlet')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSub === 'lihat_outlet'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Lihat Outlet</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
              {outlets.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSub('warehose')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSub === 'warehose'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>Warehose</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
              {warehouses.length}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW: LIHAT OUTLET */}
      {activeSub === 'lihat_outlet' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari cabang outlet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Cabang Baru</span>
            </button>
          </div>

          {/* Outlets Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {outlets
              .filter((o) => o.name.toLowerCase().includes(searchQuery.toLowerCase()) || o.code.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((outlet) => (
                <div
                  key={outlet.id}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono text-[10px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-1.5 py-0.5 rounded">
                            {outlet.code}
                          </span>
                          {outlet.isHQ && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
                              HEADQUARTERS
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-white text-base leading-snug">
                          {outlet.name}
                        </h3>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse mt-1 shrink-0" />
                    </div>

                    <p className="text-xs text-zinc-400 flex items-start gap-1.5 mb-4 line-clamp-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                      <span>{outlet.address}</span>
                    </p>

                    <div className="space-y-2 pt-3 border-t border-zinc-800/80 text-xs">
                      <div className="flex justify-between text-zinc-400">
                        <span>Penjualan Hari Ini:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          Rp {outlet.todaySales.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Valuasi Stok Toko:</span>
                        <span className="font-mono font-bold text-zinc-200">
                          Rp {outlet.stockValue.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Kasir Aktif:</span>
                        <span className="text-zinc-200 font-bold">{outlet.cashierActive} POS Terminal</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Geofence Radius:</span>
                        <span className="text-zinc-300 font-mono">{outlet.geofenceRadius} meter</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {outlet.phone}
                    </span>
                    <button
                      onClick={() => onNavigateTab && onNavigateTab('pos_machine')}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold transition cursor-pointer"
                    >
                      Buka Terminal POS
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* VIEW: WAREHOSE */}
      {activeSub === 'warehose' && (
        <div className="space-y-6">
          <div className="bg-purple-950/20 border border-purple-900/40 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
                <Warehouse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">
                  Gudang Utama &amp; Pusat Distribusi Karton (Warehose)
                </h3>
                <p className="text-xs text-zinc-400">
                  Semua restock dus/karton dari supplier dibongkar muat di Central Warehouse sebelum didistribusikan ke outlet satelit.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab && onNavigateTab('restock')}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Transfer Antar Gudang
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warehouses.map((wh) => (
              <div
                key={wh.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded">
                      {wh.code}
                    </span>
                    <h3 className="font-black text-white text-lg mt-1">{wh.name}</h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {wh.address}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    OPERASIONAL
                  </span>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Kapasitas Muat:</span>
                    <span className="font-mono font-bold text-white">{wh.capacityPct}% Terisi</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full rounded-full ${
                        wh.capacityPct > 85 ? 'bg-rose-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${wh.capacityPct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
                    <span className="text-zinc-500 block text-[10px]">Stok Karton:</span>
                    <span className="font-mono font-bold text-white text-base">
                      {wh.cartonsStored.toLocaleString('id-ID')} Dus
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
                    <span className="text-zinc-500 block text-[10px]">Kepala Gudang:</span>
                    <span className="font-bold text-zinc-200 text-xs">
                      {wh.manager}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800 text-zinc-400">
                  <span>Kondisi Ruangan: {wh.temperature}</span>
                  <span className="text-purple-400 font-bold">{wh.pendingTransfer} Transfer Antrean</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add Outlet */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">Tambah Cabang Outlet Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateOutlet} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nama Outlet:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: RiskCart Express Kemang"
                  value={newOutletName}
                  onChange={(e) => setNewOutletName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Kode Outlet:</label>
                <input
                  type="text"
                  placeholder="Contoh: RC-JKT-03"
                  value={newOutletCode}
                  onChange={(e) => setNewOutletCode(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Alamat Lengkap:</label>
                <textarea
                  rows={2}
                  placeholder="Alamat jalan, kelurahan, kota..."
                  value={newOutletAddress}
                  onChange={(e) => setNewOutletAddress(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">No. Kontak WhatsApp:</label>
                <input
                  type="text"
                  placeholder="+62 812-..."
                  value={newOutletPhone}
                  onChange={(e) => setNewOutletPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500"
                >
                  Simpan Cabang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
