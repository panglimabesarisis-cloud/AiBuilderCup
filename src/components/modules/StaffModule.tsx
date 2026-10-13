import React, { useState } from 'react';
import {
  UserCheck,
  Shield,
  Key,
  Award,
  Sparkles,
  Plus,
  Search,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  Briefcase,
  AlertCircle,
  TrendingUp,
  X,
  User,
} from 'lucide-react';
import { useFirestoreList } from '../../hooks/useFirestoreList';

interface StaffModuleProps {
  subModule: 'daftar_staff' | 'role_jabatan' | 'hak_akses' | 'kpi_staff' | 'ai_setting_job_staff';
  currencyMode?: 'IDR' | 'USD';
  onNavigateTab?: (tab: string) => void;
}

const INITIAL_STAFF = [
  {
    id: 'STF-01',
    name: 'Ahmad Fauzi',
    role: 'Kasir Senior (Head Cashier)',
    outlet: 'RiskCart Flagship Store (Pusat)',
    phone: '+62 812-3344-5566',
    shift: 'Pagi (07:30 - 15:00)',
    kpiScore: 96.5,
    joinedDate: 'Januari 2025',
    status: 'active',
  },
  {
    id: 'STF-02',
    name: 'Siti Rahmawati',
    role: 'Kasir Shift Sore',
    outlet: 'RiskCart Express Tebet',
    phone: '+62 813-4455-6677',
    shift: 'Sore (15:00 - 22:30)',
    kpiScore: 94.0,
    joinedDate: 'Maret 2025',
    status: 'active',
  },
  {
    id: 'STF-03',
    name: 'Bambang Supriyanto',
    role: 'Kepala Gudang & Bongkar Muat',
    outlet: 'Central Distribution Center (CDC)',
    phone: '+62 817-6677-8899',
    shift: 'Reguler (08:00 - 17:00)',
    kpiScore: 98.2,
    joinedDate: 'November 2024',
    status: 'active',
  },
  {
    id: 'STF-04',
    name: 'Rian Hidayat',
    role: 'Kurir Pengantar Galon & Dus PWA',
    outlet: 'RiskCart Flagship Store (Pusat)',
    phone: '+62 819-7788-9900',
    shift: 'On-Demand Antar',
    kpiScore: 91.8,
    joinedDate: 'Mei 2025',
    status: 'active',
  },
];

export const StaffModule: React.FC<StaffModuleProps> = ({
  subModule,
  currencyMode = 'IDR',
  onNavigateTab,
}) => {
  const [activeSub, setActiveSub] = useState<
    'daftar_staff' | 'role_jabatan' | 'hak_akses' | 'kpi_staff' | 'ai_setting_job_staff'
  >(subModule);

  const [searchQuery, setSearchQuery] = useState('');

  // Staff Employees via useFirestoreList
  const { data: staffList, addItem: addStaff } = useFirestoreList('staff', INITIAL_STAFF);

  // Modal State for Add Staff
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Kasir Reguler');
  const [newStaffOutlet, setNewStaffOutlet] = useState('RiskCart Flagship Store (Pusat)');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffShift, setNewStaffShift] = useState('Pagi (07:30 - 15:00)');

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    await addStaff({
      name: newStaffName.trim(),
      role: newStaffRole,
      outlet: newStaffOutlet,
      phone: newStaffPhone.trim() || '-',
      shift: newStaffShift,
      kpiScore: 95.0,
      joinedDate: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      status: 'active',
    });
    setNewStaffName('');
    setNewStaffPhone('');
    setShowAddStaffModal(false);
  };

  // Roles & Permissions (Role / Jabatan & Hak Akses)
  const [roles, setRoles] = useState([
    {
      id: 'role_admin',
      name: 'Owner & Super Admin',
      description: 'Akses penuh seluruh cabang, laba bersih, audit log, dan integrasi payment gateway.',
      membersCount: 1,
      canVoid: true,
      canExport: true,
      canEditPrice: true,
      canAccessFinance: true,
    },
    {
      id: 'role_cashier',
      name: 'Operator Kasir (Cashier)',
      description: 'Buka tutup shift kasir, input belanja produk, cetak struk, dan catat kas masuk/keluar harian.',
      membersCount: 3,
      canVoid: false,
      canExport: false,
      canEditPrice: false,
      canAccessFinance: false,
    },
    {
      id: 'role_warehouse',
      name: 'Petugas Gudang (Inventory Keeper)',
      description: 'Penerimaan PO dari supplier, bongkar muat karton/dus, stock opname fisik, dan retur barang cacat.',
      membersCount: 2,
      canVoid: false,
      canExport: true,
      canEditPrice: false,
      canAccessFinance: false,
    },
  ]);

  // AI Setting Job Staff state
  const [jobTitleInput, setJobTitleInput] = useState('Kasir Multi-Outlet dengan AI Fraud Sentinel');
  const [aiJobResult, setAiJobResult] = useState<{
    summary: string;
    responsibilities: string[];
    kpiMetrics: string[];
    riskSafeguards: string[];
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateJobAI = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setAiJobResult({
        summary: `Standar Kompetensi & SOP Kerja Otomatis untuk posisi ${jobTitleInput}. Dirancang sesuai arsitektur anti-fraud RiskCart POS 2026.`,
        responsibilities: [
          'Memproses transaksi belanja eceran dan grosir karton via POS Terminal secara cepat (<35 detik per pelanggan).',
          'Melakukan verifikasi tanda centang radius lokasi pelanggan saat pesanan online Client PWA masuk.',
          'Menghitung dan mencocokkan fisik uang laci tunai (*cash drawer*) dengan sistem saat pergantian shift kasir (X/Z Report).',
          'Menginput bukti nota kas kecil pengeluaran operasional toko pada menu Shift Kasir.',
        ],
        kpiMetrics: [
          'Tingkat Akurasi Saldo Laci Kasir: 99.8% (Maksimal selisih Rp 2.000 / shift).',
          'Kecepatan Layanan Kasir: Rata-rata 25 detik per struk belanja.',
          'Deteksi Penipuan (Fraud Prevention): 100% verifikasi QRIS sukses sebelum barang diserahkan.',
        ],
        riskSafeguards: [
          'Dilarang melakukan pembatalan transaksi (*Void*) tanpa otorisasi PIN Supervisor.',
          'Batas uang tunai laci maksimal Rp 3.000.000; kelebihan wajib disetor ke brankas toko (*Safe Drop*).',
        ],
      });
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-black text-white tracking-tight">
            STAFF, ROLE &amp; HAK AKSES OPERASIONAL
          </h1>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Manajemen direktori karyawan, pembatasan hak akses (*RBAC*), evaluasi KPI kinerja kasir, dan perumusan SOP kerja cerdas AI.
        </p>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto w-fit max-w-full mb-4">
          <button
            onClick={() => setActiveSub('daftar_staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeSub === 'daftar_staff' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Daftar Staff
          </button>
          <button
            onClick={() => setActiveSub('role_jabatan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'role_jabatan' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Role / Jabatan</span>
          </button>
          <button
            onClick={() => setActiveSub('hak_akses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'hak_akses' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Hak Akses</span>
          </button>
          <button
            onClick={() => setActiveSub('kpi_staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'kpi_staff' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>KPI Staff</span>
          </button>
          <button
            onClick={() => setActiveSub('ai_setting_job_staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              activeSub === 'ai_setting_job_staff' ? 'bg-pink-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Setting Job Staff</span>
          </button>
        </div>

      {/* VIEW: DAFTAR STAFF */}
      {activeSub === 'daftar_staff' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama staff / cabang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Staff Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffList
              .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.role.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((stf) => (
                <div key={stf.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-purple-400 bg-purple-950/80 border border-purple-800 px-1.5 py-0.5 rounded">
                        {stf.id}
                      </span>
                      <h3 className="font-bold text-white text-base mt-1">{stf.name}</h3>
                      <p className="text-xs text-zinc-300 font-medium">{stf.role}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                      KPI: {stf.kpiScore}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-400 space-y-1 pt-2 border-t border-zinc-800">
                    <div>Penempatan: <strong className="text-zinc-200">{stf.outlet}</strong></div>
                    <div>Shift Jadwal: <strong className="text-zinc-300">{stf.shift}</strong></div>
                    <div className="flex items-center gap-1 pt-1">
                      <Phone className="w-3 h-3 text-zinc-500" />
                      <span>{stf.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* VIEW: ROLE / JABATAN */}
      {activeSub === 'role_jabatan' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((r) => (
            <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-400 bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded">
                  {r.membersCount} Pegawai
                </span>
                <h3 className="font-bold text-white text-base mt-2">{r.name}</h3>
                <p className="text-xs text-zinc-400 mt-1">{r.description}</p>
              </div>
              <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-400">
                <span>Otoritas Khusus:</span>
                <span className="text-emerald-400 font-bold">
                  {r.canVoid ? 'Bisa Void Transaksi' : 'Kasir Reguler'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW: HAK AKSES */}
      {activeSub === 'hak_akses' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Matriks Hak Akses Kasir &amp; Supervisor (RBAC Matrix)</h3>
          <p className="text-xs text-zinc-400">Pastikan kasir tidak dapat melihat laporan keuntungan bersih ataupun mengubah harga jual produk.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Fitur / Halaman Sistem</th>
                  <th className="py-3 px-4 text-center">Owner &amp; Super Admin</th>
                  <th className="py-3 px-4 text-center">Kasir Toko (Cashier)</th>
                  <th className="py-3 px-4 text-center">Petugas Gudang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Buka Transaksi Kasir POS</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Penuh</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Penuh</td>
                  <td className="py-3 px-4 text-center text-zinc-600">-</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Laba Bersih &amp; Keuangan (Bangkas)</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Penuh</td>
                  <td className="py-3 px-4 text-center text-rose-500 font-bold">✗ Terkunci</td>
                  <td className="py-3 px-4 text-center text-rose-500 font-bold">✗ Terkunci</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Ubah Harga Beli &amp; Jual Produk</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Penuh</td>
                  <td className="py-3 px-4 text-center text-rose-500 font-bold">✗ Terkunci</td>
                  <td className="py-3 px-4 text-center text-rose-500 font-bold">✗ Terkunci</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Input Pembelian Dus (PO Supplier)</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Penuh</td>
                  <td className="py-3 px-4 text-center text-zinc-600">-</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Penuh</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: KPI STAFF */}
      {activeSub === 'kpi_staff' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-zinc-500 block text-[10px] font-bold uppercase">Kasir Terbaik Bulan Ini</span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">Ahmad Fauzi (Pusat)</span>
              <span className="text-emerald-400 text-[11px] font-bold mt-1 block">Skor KPI 96.5 &bull; 0 Selisih Kasir</span>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-zinc-500 block text-[10px] font-bold uppercase">Rata-rata Waktu Transaksi</span>
              <span className="text-xl font-mono font-bold text-white mt-1 block">28 Detik / Struk</span>
              <span className="text-zinc-400 text-[11px] mt-1 block">Optimal di bawah batas toleransi</span>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <span className="text-zinc-500 block text-[10px] font-bold uppercase">Ketepatan Jam Masuk Shift</span>
              <span className="text-xl font-mono font-bold text-emerald-400 mt-1 block">99.2% On-Time</span>
              <span className="text-zinc-400 text-[11px] mt-1 block">Absensi sidik jari &amp; GPS toko</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: AI SETTING JOB STAFF */}
      {activeSub === 'ai_setting_job_staff' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <h3 className="font-bold text-white text-base">AI Job Setting &amp; SOP Generator (Gemini 3.8 Flash)</h3>
          </div>
          <p className="text-xs text-zinc-400">
            Rumuskan deskripsi pekerjaan, batasan wewenang pencegahan fraud, dan metrik target KPI untuk setiap staf toko secara instan.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={jobTitleInput}
              onChange={(e) => setJobTitleInput(e.target.value)}
              placeholder="Ketik jabatan, misal: Kasir Shift Malam atau Admin Gudang..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
            />
            <button
              onClick={handleGenerateJobAI}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'AI Merumuskan SOP...' : 'Generate Standar Job AI'}</span>
            </button>
          </div>

          {aiJobResult && (
            <div className="p-5 bg-zinc-950 rounded-2xl border border-pink-900/50 space-y-4 text-xs">
              <div className="border-b border-zinc-800 pb-3">
                <span className="text-[10px] font-bold text-pink-400 bg-pink-950/80 border border-pink-800 px-2 py-0.5 rounded">
                  AI RECOMMENDATION READY
                </span>
                <p className="text-white font-medium mt-2">{aiJobResult.summary}</p>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase text-[11px] mb-1.5 text-zinc-300">Tanggung Jawab Utama (SOP):</h4>
                <ul className="list-disc list-inside space-y-1 text-zinc-400">
                  {aiJobResult.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase text-[11px] mb-1.5 text-amber-300">Target KPI Terukur:</h4>
                <ul className="list-disc list-inside space-y-1 text-zinc-400">
                  {aiJobResult.kpiMetrics.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase text-[11px] mb-1.5 text-rose-300">Prosedur Keamanan &amp; Pencegahan Fraud:</h4>
                <ul className="list-disc list-inside space-y-1 text-zinc-400">
                  {aiJobResult.riskSafeguards.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Tambah Staff Baru */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Tambah Karyawan / Staf Baru</h3>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveStaff} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Nama Lengkap Karyawan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Irfan"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Jabatan / Role</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Kasir Reguler">Kasir Reguler</option>
                    <option value="Kasir Senior (Head Cashier)">Kasir Senior (Head Cashier)</option>
                    <option value="Staf Gudang & Bongkar">Staf Gudang & Bongkar</option>
                    <option value="Kurir Pengantar Galon & Dus">Kurir Pengantar Galon & Dus</option>
                    <option value="Supervisor Shift">Supervisor Shift</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Shift Kerja</label>
                  <select
                    value={newStaffShift}
                    onChange={(e) => setNewStaffShift(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Pagi (07:30 - 15:00)">Pagi (07:30 - 15:00)</option>
                    <option value="Sore (15:00 - 22:30)">Sore (15:00 - 22:30)</option>
                    <option value="Reguler (08:00 - 17:00)">Reguler (08:00 - 17:00)</option>
                    <option value="On-Demand Antar">On-Demand Antar</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Cabang Penempatan</label>
                <select
                  value={newStaffOutlet}
                  onChange={(e) => setNewStaffOutlet(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="RiskCart Flagship Store (Pusat)">RiskCart Flagship Store (Pusat)</option>
                  <option value="RiskCart Express Tebet">RiskCart Express Tebet</option>
                  <option value="Central Distribution Center (CDC)">Central Distribution Center (CDC)</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">No. WhatsApp / HP</label>
                <input
                  type="text"
                  placeholder="+62 8..."
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-lg"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
