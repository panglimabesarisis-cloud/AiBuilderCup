import React, { useState, useEffect } from 'react';
import {
  Brain,
  Store,
  Clock,
  LayoutDashboard,
  Boxes,
  Truck,
  ShoppingBag,
  Layers,
  Users,
  Target,
  UserCheck,
  Vault,
  Globe,
  Smartphone,
  Settings,
  CreditCard,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  Search,
  X,
  Plus,
  Coins,
  TrendingUp,
  History,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  FileText,
  FileCheck,
  Package,
  Calendar,
  Gift,
  Ticket,
  Key,
  Printer,
  Database,
  QrCode,
  Warehouse,
  ArrowDownRight,
  ArrowUpRight,
  ClipboardCheck,
  RotateCcw,
} from 'lucide-react';

export type ProductCartonTabType =
  | 'list'
  | 'paket'
  | 'kategori'
  | 'harga_diskon'
  | 'masuk'
  | 'keluar'
  | 'opname'
  | 'pergerakan'
  | 'kritis';

export interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSubModule?: string;
  setActiveSubModule?: (sub: string) => void;
  navigateTo?: (tab: string, sub?: string) => void;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  currencyMode: 'IDR' | 'USD';
  setCurrencyMode: (mode: 'IDR' | 'USD') => void;
  onOpenModal: (modal: string) => void;
  sessionSeconds?: number;
  onSelectProductSubTab?: (subTab: ProductCartonTabType) => void;
  onOpenAddProduct?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeSubModule = '',
  setActiveSubModule,
  navigateTo,
  isCollapsed,
  toggleCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  currencyMode,
  setCurrencyMode,
  onOpenModal,
  sessionSeconds = 0,
  onSelectProductSubTab,
  onOpenAddProduct,
}) => {
  // Accordion open/close states for groups A through P
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    ai: true,
    multi_outlet: false,
    shift: false,
    dashboard: false,
    produk: true,
    pembelian: false,
    transaksi_pos: false,
    inventory: false,
    pelanggan: false,
    marketing: false,
    staff: false,
    keuangan: false,
    online_order: false,
    pengaturan_pwa: false,
    pengaturan_pos: false,
    payment: false,
  });

  // State to expand/collapse AI Agents list inside Artificial Intelligence
  const [openAiAgentsList, setOpenAiAgentsList] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleGroup = (key: string) => {
    if (isCollapsed) return;
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAllGroups = () => {
    if (isCollapsed) return;
    setOpenGroups({
      ai: true,
      multi_outlet: true,
      shift: true,
      dashboard: true,
      produk: true,
      pembelian: true,
      transaksi_pos: true,
      inventory: true,
      pelanggan: true,
      marketing: true,
      staff: true,
      keuangan: true,
      online_order: true,
      pengaturan_pwa: true,
      pengaturan_pos: true,
      payment: true,
    });
    setOpenAiAgentsList(true);
  };

  const collapseAllGroups = () => {
    if (isCollapsed) return;
    setOpenGroups({
      ai: false,
      multi_outlet: false,
      shift: false,
      dashboard: false,
      produk: false,
      pembelian: false,
      transaksi_pos: false,
      inventory: false,
      pelanggan: false,
      marketing: false,
      staff: false,
      keuangan: false,
      online_order: false,
      pengaturan_pwa: false,
      pengaturan_pos: false,
      payment: false,
    });
    setOpenAiAgentsList(false);
  };

  // Agen AI yang benar-benar terhubung ke server (knowledge tersimpan di Firestore: ai_agents/{subModule})
  const aiAgentsList = [
    { id: 'agent_1', name: 'Anti-Fraud Sentinel AI', subModule: 'ai_fraud_transaction' },
    { id: 'agent_2', name: 'Order Intent & Typo Parser', subModule: 'ai_advisor_order' },
    { id: 'agent_3', name: 'Strategic Restock Advisor', subModule: 'ai_advisor_purchase' },
  ];

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNav = (tabId: string, subId?: string) => {
    if (navigateTo) {
      navigateTo(tabId, subId);
    } else {
      setActiveTab(tabId);
      if (subId && setActiveSubModule) setActiveSubModule(subId);
    }
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const handleProductSubTab = (sub: ProductCartonTabType) => {
    setActiveTab('products');
    if (onSelectProductSubTab) onSelectProductSubTab(sub);
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const handleAddProduct = () => {
    setActiveTab('products');
    if (onOpenAddProduct) onOpenAddProduct();
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const renderContent = (collapsed: boolean, isMobile: boolean) => {
    return (
      <div className="flex flex-col justify-between h-full select-none text-xs">
        {/* Top Header & Scrollable Nav */}
        <div className="space-y-2 overflow-y-auto overflow-x-hidden flex-1 px-3 py-3 custom-scrollbar">
          {/* Header Branding */}
          <div className="pb-2.5 border-b border-zinc-800">
            {collapsed ? (
              <button
                onClick={toggleCollapsed}
                className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center transition hover:bg-blue-600/30 mx-auto cursor-pointer"
                title="Perluas Sidebar"
              >
                <Store className="w-5 h-5 text-blue-400" />
              </button>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div
                  onClick={() => handleNav('admin_dashboard')}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center group-hover:scale-105 transition">
                    <Store className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <span className="font-black text-white text-xs tracking-tight block">
                      RISKCART ECOSYSTEM
                    </span>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Multi-Outlet Cloud
                    </span>
                  </div>
                </div>

                {isMobile ? (
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={toggleCollapsed}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                    title="Kecilkan Sidebar"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Cashier Shortcut Button */}
          <button
            onClick={() => handleNav('pos_machine')}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
            } rounded-xl font-bold transition shadow-sm cursor-pointer ${
              activeTab === 'pos_machine'
                ? 'bg-blue-600 text-white shadow-blue-600/30'
                : 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
            }`}
            title="Buka Mesin Kasir POS"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 shrink-0 text-emerald-400" />
              {!collapsed && <span>Terminal Kasir POS</span>}
            </div>
            {!collapsed && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200">LIVE</span>}
          </button>

          {/* Menu Search Bar */}
          {!collapsed && (
            <div className="space-y-1.5 pt-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari menu & agen AI..."
                  className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2 text-zinc-500 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Expand / Collapse All Quick Controls */}
              <div className="flex items-center justify-between px-1 text-[10px] text-zinc-400">
                <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Grup Menu</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={expandAllGroups}
                    className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-blue-300 hover:text-blue-200 font-semibold transition cursor-pointer"
                    title="Buka / Expand semua grup menu A sampai P"
                  >
                    + Expand Semua
                  </button>
                  <button
                    onClick={collapseAllGroups}
                    className="px-2 py-0.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-medium transition cursor-pointer"
                    title="Ciutkan / Collapse semua menu"
                  >
                    − Ciutkan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GROUPS A THROUGH P */}
          <div className="space-y-1 pt-1">
            {/* A. ARTIFICIAL INTELLIGENCE */}
            <div>
              <button
                onClick={() => toggleGroup('ai')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="A. ARTIFICIAL INTELLIGENCE"
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">A. ARTIFICIAL INTELLIGENCE</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.ai ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.ai) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-purple-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('module_ai', 'ai_master')} className="w-full text-left py-1 hover:text-purple-400 block cursor-pointer">
                    Master AI
                  </button>
                  <button onClick={() => handleNav('module_ai', 'ai_advisor_purchase')} className="w-full text-left py-1 hover:text-amber-400 block cursor-pointer flex items-center justify-between group">
                    <span className="group-hover:text-amber-300 font-semibold text-amber-200/95">AI Advisor Purchase</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">Lock 7-Hari</span>
                  </button>
                  <button onClick={() => handleNav('module_ai', 'ai_advisor_order')} className="w-full text-left py-1 hover:text-purple-400 block cursor-pointer">
                    AI Advisor Order
                  </button>
                  <button onClick={() => handleNav('module_ai', 'ai_advisor_strategy')} className="w-full text-left py-1 hover:text-purple-400 block cursor-pointer">
                    AI Advisor Strategy
                  </button>
                  <button onClick={() => handleNav('module_ai', 'ai_chat_pwa')} className="w-full text-left py-1 hover:text-purple-400 block cursor-pointer">
                    AI Chat Client PWA
                  </button>
                  <button onClick={() => handleNav('module_ai', 'ai_preventif')} className="w-full text-left py-1 hover:text-purple-400 block cursor-pointer">
                    AI Preventif
                  </button>
                  <button onClick={() => handleNav('module_ai', 'ai_fraud_transaction')} className="w-full text-left py-1 hover:text-purple-400 block cursor-pointer">
                    AI Fraud Transaction
                  </button>
                  <button onClick={() => handleNav('module_ai', 'ai_knowledge')} className="w-full text-left py-1 hover:text-purple-400 block cursor-pointer">
                    Knowledge All AI Agent
                  </button>

                  {/* Expandable Nested List of AI Agents */}
                  <div className="pt-2 mt-1 border-t border-zinc-800/80">
                    <button
                      onClick={() => setOpenAiAgentsList((prev) => !prev)}
                      className="w-full flex items-center justify-between py-1 text-purple-300 hover:text-purple-200 font-semibold cursor-pointer text-[10px]"
                      title="Klik untuk buka / tutup daftar agen AI"
                    >
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                        <span>List Agen AI ({aiAgentsList.length} Agen)</span>
                      </div>
                      <ChevronDown className={`w-3 h-3 text-purple-400 transition-transform ${openAiAgentsList ? '' : '-rotate-90'}`} />
                    </button>

                    {openAiAgentsList && (
                      <div className="pl-1.5 space-y-1 pt-1.5 text-[10px] text-zinc-400">
                        {aiAgentsList.map((agent) => (
                          <button
                            key={agent.id}
                            onClick={() => handleNav('module_ai', (agent as any).subModule || 'ai_master')}
                            className="w-full text-left py-1 px-1.5 rounded-lg hover:bg-purple-950/40 hover:text-purple-300 flex items-center justify-between group transition cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 group-hover:scale-125 transition-transform" />
                              <span className="truncate">{agent.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* B. MULTI OUTLET */}
            <div>
              <button
                onClick={() => toggleGroup('multi_outlet')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="B. MULTI OUTLET"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">B. MULTI OUTLET</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.multi_outlet ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.multi_outlet) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-blue-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('module_multi_outlet', 'lihat_outlet')} className="w-full text-left py-1 hover:text-blue-400 block cursor-pointer">
                    Lihat Outlet
                  </button>
                  <button onClick={() => handleNav('module_multi_outlet', 'warehose')} className="w-full text-left py-1 hover:text-blue-400 block cursor-pointer">
                    Warehose
                  </button>
                </div>
              )}
            </div>

            {/* C. SHIFT */}
            <div>
              <button
                onClick={() => toggleGroup('shift')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="C. SHIFT"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">C. SHIFT</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.shift ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.shift) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-emerald-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('module_shift', 'cashir')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Cashir
                  </button>
                  <button onClick={() => handleNav('module_shift', 'kas_masuk')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Kas Masuk
                  </button>
                  <button onClick={() => handleNav('module_shift', 'kas_keluar')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Kas Keluar
                  </button>
                  <button onClick={() => handleNav('module_shift', 'riwayat_shit')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Riwayat Shit
                  </button>
                </div>
              )}
            </div>

            {/* D. DASHBOARD */}
            <div>
              <button
                onClick={() => toggleGroup('dashboard')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="D. DASHBOARD"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-cyan-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">D. DASHBOARD</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.dashboard ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.dashboard) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-cyan-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('transactions')} className="w-full text-left py-1 hover:text-cyan-400 block cursor-pointer">
                    Dashboard Transaction
                  </button>
                  <button onClick={() => handleNav('assets')} className="w-full text-left py-1 hover:text-cyan-400 block cursor-pointer">
                    Asset Management
                  </button>
                </div>
              )}
            </div>

            {/* E. HALAMAN PRODUK */}
            <div>
              <button
                onClick={() => toggleGroup('produk')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="E. HALAMAN PRODUK"
              >
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-amber-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">E. HALAMAN PRODUK</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.produk ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.produk) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-amber-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <div className="flex items-center justify-between py-0.5">
                    <button onClick={() => handleProductSubTab('list')} className="text-left font-bold hover:text-blue-400 cursor-pointer text-white">
                      List Produk
                    </button>
                    <button
                      onClick={handleAddProduct}
                      className="text-[9px] px-1 py-0.5 rounded bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white cursor-pointer"
                    >
                      + Tambah
                    </button>
                  </div>
                  <button onClick={() => handleProductSubTab('paket')} className="w-full text-left py-1 hover:text-amber-400 block cursor-pointer">
                    Paket Produk
                  </button>
                  <button onClick={() => handleProductSubTab('kategori')} className="w-full text-left py-1 hover:text-purple-400 block cursor-pointer">
                    Kategori &amp; Brand
                  </button>
                  <button onClick={() => handleProductSubTab('harga_diskon')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Harga Diskon
                  </button>
                </div>
              )}
            </div>

            {/* F. PEMBELIAN PRODUK */}
            <div>
              <button
                onClick={() => toggleGroup('pembelian')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="F. PEMBELIAN PRODUK"
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">F. PEMBELIAN PRODUK</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.pembelian ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.pembelian) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-orange-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('module_procurement', 'daftar_supplier')} className="w-full text-left py-1 hover:text-orange-400 block cursor-pointer">
                    Daftar Supplier
                  </button>
                  <button onClick={() => handleNav('module_procurement', 'daftar_pembelian')} className="w-full text-left py-1 hover:text-orange-400 block cursor-pointer">
                    Daftar Pembelian
                  </button>
                  <button onClick={() => handleNav('module_procurement', 'request_pembelian')} className="w-full text-left py-1 hover:text-orange-400 block cursor-pointer">
                    Request Pembelian
                  </button>
                  <button onClick={() => handleNav('module_procurement', 'pembelian_produk')} className="w-full text-left py-1 hover:text-orange-400 block cursor-pointer">
                    Pembelian Produk
                  </button>
                  <button onClick={() => handleNav('module_procurement', 'statistik_pembelian')} className="w-full text-left py-1 hover:text-orange-400 block cursor-pointer">
                    Statistik Pembelian
                  </button>
                </div>
              )}
            </div>

            {/* G. TRANSAKSI POS */}
            <div>
              <button
                onClick={() => toggleGroup('transaksi_pos')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="G. TRANSAKSI POS"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">G. TRANSAKSI POS</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.transaksi_pos ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.transaksi_pos) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-blue-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('module_pos_transactions', 'transaksi_penjualan')} className="w-full text-left py-1 hover:text-blue-400 block cursor-pointer">
                    Transaksi Penjualan
                  </button>
                  <button onClick={() => handleNav('module_pos_transactions', 'pendapatan_masuk')} className="w-full text-left py-1 hover:text-blue-400 block cursor-pointer">
                    Pendapatan Masuk
                  </button>
                  <button onClick={() => handleNav('module_pos_transactions', 'pengeluaran_toko')} className="w-full text-left py-1 hover:text-blue-400 block cursor-pointer">
                    Pengeluaran Toko
                  </button>
                </div>
              )}
            </div>

            {/* H. LACAK INVENTORY */}
            <div>
              <button
                onClick={() => toggleGroup('inventory')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="H. LACAK INVENTORY"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">H. LACAK INVENTORY</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.inventory ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.inventory) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-emerald-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('module_inventory', 'inventory')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Inventory
                  </button>
                  <button onClick={() => handleNav('module_inventory', 'kartu_stok')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Kartu Stok
                  </button>
                  <button onClick={() => handleNav('module_inventory', 'stok_minimum')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Stok Minimum
                  </button>
                  <button onClick={() => handleNav('module_inventory', 'stok_opname')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Stok Opname
                  </button>
                  <button onClick={() => handleNav('module_inventory', 'produk_restock')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Produk Restock
                  </button>
                </div>
              )}
            </div>

            {/* I. PELANGGAN */}
            <div>
              <button
                onClick={() => toggleGroup('pelanggan')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="I. PELANGGAN"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">I. PELANGGAN</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.pelanggan ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.pelanggan) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-indigo-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('module_customer', 'daftar_pelanggan')} className="w-full text-left py-1 hover:text-indigo-400 block cursor-pointer">
                    Daftar Pelanggan
                  </button>
                  <button onClick={() => handleNav('module_customer', 'tipe_pelanggan')} className="w-full text-left py-1 hover:text-indigo-400 block cursor-pointer">
                    Tipe Pelanggan
                  </button>
                  <button onClick={() => handleNav('module_customer', 'hutang_pelanggan')} className="w-full text-left py-1 hover:text-indigo-400 block cursor-pointer">
                    Hutang Pelanggan
                  </button>
                  <button onClick={() => handleNav('module_customer', 'poin_pelanggan')} className="w-full text-left py-1 hover:text-indigo-400 block cursor-pointer">
                    Poin Pelanggan
                  </button>
                  <button onClick={() => handleNav('module_customer', 'langganan')} className="w-full text-left py-1 hover:text-indigo-400 block cursor-pointer">
                    Langganan
                  </button>
                  <button onClick={() => handleNav('module_customer', 'claim_hadiah')} className="w-full text-left py-1 hover:text-indigo-400 block cursor-pointer">
                    Claim Hadiah
                  </button>
                </div>
              )}
            </div>

            {/* J. TEKNIK MARKETING */}
            <div>
              <button
                onClick={() => toggleGroup('marketing')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="J. TEKNIK MARKETING"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-pink-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">J. TEKNIK MARKETING</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.marketing ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.marketing) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-pink-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('module_marketing', 'hadiah_target')} className="w-full text-left py-1 hover:text-pink-400 block cursor-pointer">
                    Hadiah Target
                  </button>
                  <button onClick={() => handleNav('module_marketing', 'informasi_hadiah')} className="w-full text-left py-1 hover:text-pink-400 block cursor-pointer">
                    Informasi &amp; Hadiah
                  </button>
                  <button onClick={() => handleNav('module_marketing', 'voucher_promo')} className="w-full text-left py-1 hover:text-pink-400 block cursor-pointer">
                    Voucher dan Promo
                  </button>
                  <button onClick={() => handleNav('module_marketing', 'setting_poin')} className="w-full text-left py-1 hover:text-pink-400 block cursor-pointer">
                    Setting Poin
                  </button>
                  <button onClick={() => handleNav('module_marketing', 'setting_poin_pwa')} className="w-full text-left py-1 hover:text-pink-400 block cursor-pointer">
                    Setting Poin PWA
                  </button>
                  <button onClick={() => handleNav('module_marketing', 'statistik_marketing')} className="w-full text-left py-1 hover:text-pink-400 block cursor-pointer">
                    Statistik Marketing
                  </button>
                </div>
              )}
            </div>

            {/* K. STAFF */}
            <div>
              <button
                onClick={() => toggleGroup('staff')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="K. STAFF"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">K. STAFF</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.staff ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.staff) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-teal-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('module_staff', 'daftar_staff')} className="w-full text-left py-1 hover:text-teal-400 block cursor-pointer">
                    Daftar Staff
                  </button>
                  <button onClick={() => handleNav('module_staff', 'role_jabatan')} className="w-full text-left py-1 hover:text-teal-400 block cursor-pointer">
                    Role / Jabatan
                  </button>
                  <button onClick={() => handleNav('module_staff', 'hak_akses')} className="w-full text-left py-1 hover:text-teal-400 block cursor-pointer">
                    Hak Akses
                  </button>
                  <button onClick={() => handleNav('module_staff', 'kpi_staff')} className="w-full text-left py-1 hover:text-teal-400 block cursor-pointer">
                    KPI Staff
                  </button>
                  <button onClick={() => handleNav('module_staff', 'ai_setting_job_staff')} className="w-full text-left py-1 hover:text-teal-400 block cursor-pointer">
                    AI Setting Job Staff
                  </button>
                </div>
              )}
            </div>

            {/* L. KEUANGAN */}
            <div>
              <button
                onClick={() => toggleGroup('keuangan')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="L. KEUANGAN"
              >
                <div className="flex items-center gap-2">
                  <Vault className="w-4 h-4 text-emerald-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">L. KEUANGAN</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.keuangan ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.keuangan) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-emerald-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('module_finance', 'bangkas_toko')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Bangkas Toko
                  </button>
                  <button onClick={() => handleNav('module_finance', 'bangkas_modal')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Bangkas Modal
                  </button>
                  <button onClick={() => handleNav('module_finance', 'bangkas_untung')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Bangkas Untung
                  </button>
                  <button onClick={() => handleNav('module_finance', 'type_keuangan')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Type Keuangan
                  </button>
                  <button onClick={() => handleNav('module_finance', 'riwayat_keuangan')} className="w-full text-left py-1 hover:text-emerald-400 block cursor-pointer">
                    Riwayat Keuangan
                  </button>
                </div>
              )}
            </div>

            {/* M. SETTING ONLINE ORDER */}
            <div>
              <button
                onClick={() => toggleGroup('online_order')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="M. SETTING ONLINE ORDER"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">M. SETTING ONLINE ORDER</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.online_order ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.online_order) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-blue-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('module_online_order', 'website_setting')} className="w-full text-left py-1 hover:text-blue-400 block cursor-pointer">
                    Website Setting
                  </button>
                  <button onClick={() => handleNav('module_online_order', 'client_pwa_setting')} className="w-full text-left py-1 hover:text-blue-400 block cursor-pointer">
                    Client PWA Setting
                  </button>
                </div>
              )}
            </div>

            {/* N. PENGATURAN PWA */}
            <div>
              <button
                onClick={() => toggleGroup('pengaturan_pwa')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="N. PENGATURAN PWA"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">N. PENGATURAN PWA</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.pengaturan_pwa ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.pengaturan_pwa) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-purple-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('module_pwa_settings', 'umum')} className="w-full text-left py-1 hover:text-purple-400 block cursor-pointer">
                    Umum
                  </button>
                  <button onClick={() => handleNav('module_pwa_settings', 'order_pelanggan')} className="w-full text-left py-1 hover:text-purple-400 block cursor-pointer">
                    Order Pelanggan
                  </button>
                  <button onClick={() => handleNav('module_pwa_settings', 'notifikasi')} className="w-full text-left py-1 hover:text-purple-400 block cursor-pointer">
                    Notifikasi
                  </button>
                  <button onClick={() => handleNav('module_pwa_settings', 'pembayaran')} className="w-full text-left py-1 hover:text-purple-400 block cursor-pointer">
                    Pembayaran
                  </button>
                  <button onClick={() => handleNav('module_pwa_settings', 'hak_akses')} className="w-full text-left py-1 hover:text-purple-400 block cursor-pointer">
                    Hak dan Akses
                  </button>
                </div>
              )}
            </div>

            {/* O. PENGATURAN POS */}
            <div>
              <button
                onClick={() => toggleGroup('pengaturan_pos')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="O. PENGATURAN POS"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-zinc-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">O. PENGATURAN POS</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.pengaturan_pos ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.pengaturan_pos) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-zinc-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('module_pos_settings', 'umum')} className="w-full text-left py-1 hover:text-white block cursor-pointer">
                    Umum
                  </button>
                  <button onClick={() => handleNav('module_pos_settings', 'toko')} className="w-full text-left py-1 hover:text-white block cursor-pointer">
                    Toko
                  </button>
                  <button onClick={() => handleNav('module_pos_settings', 'pembayaran')} className="w-full text-left py-1 hover:text-white block cursor-pointer">
                    Pembayaran
                  </button>
                  <button onClick={() => handleNav('module_pos_settings', 'printer_struk')} className="w-full text-left py-1 hover:text-white block cursor-pointer">
                    Printer Struk
                  </button>
                  <button onClick={() => handleNav('module_pos_settings', 'global_setup')} className="w-full text-left py-1 hover:text-white block cursor-pointer">
                    Global Setup
                  </button>
                  <button onClick={() => handleNav('module_pos_settings', 'hak_akses')} className="w-full text-left py-1 hover:text-white block cursor-pointer">
                    Hak dan Akses
                  </button>
                  <button onClick={() => handleNav('module_pos_settings', 'backup_restore')} className="w-full text-left py-1 hover:text-white block cursor-pointer">
                    Backup and Restore
                  </button>
                  <button onClick={() => handleNav('module_pos_settings', 'payment_gateway')} className="w-full text-left py-1 hover:text-cyan-400 block cursor-pointer">
                    Payment Gateway
                  </button>
                  <button onClick={() => handleNav('module_pos_settings', 'audit_log')} className="w-full text-left py-1 hover:text-white block cursor-pointer">
                    Audit Log
                  </button>
                </div>
              )}
            </div>

            {/* P. INTEGRASI PAYMENT */}
            <div>
              <button
                onClick={() => toggleGroup('payment')}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
                } rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-semibold cursor-pointer`}
                title="P. INTEGRASI PAYMENT"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
                  {!collapsed && <span className="uppercase text-[11px] tracking-wider text-zinc-200">P. INTEGRASI PAYMENT</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${openGroups.payment ? '' : '-rotate-90'}`} />
                )}
              </button>

              {(!collapsed && openGroups.payment) && (
                <div className="pl-6 pr-1 py-1 space-y-1 bg-zinc-950/40 rounded-xl border-l-2 border-cyan-500/80 my-1 text-[11px] font-medium text-zinc-400">
                  <button onClick={() => handleNav('module_payment', 'xendit')} className="w-full text-left py-1 hover:text-cyan-400 block cursor-pointer">
                    Xendit
                  </button>
                  <button onClick={() => handleNav('module_payment', 'doku')} className="w-full text-left py-1 hover:text-cyan-400 block cursor-pointer">
                    Doku
                  </button>
                  <button onClick={() => handleNav('module_payment', 'midtrans')} className="w-full text-left py-1 hover:text-cyan-400 block cursor-pointer">
                    Midtrans
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Q. TANYA AI (Dedicated AI Assistant at Bottom of Sidebar) */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/90 space-y-2">
          <button
            onClick={() => handleNav('module_ai', 'tanya_ai')}
            className={`w-full p-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold transition flex items-center ${
              collapsed ? 'justify-center' : 'justify-between'
            } shadow-lg shadow-blue-900/30 cursor-pointer`}
            title="Q. TANYA AI Assistant"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse shrink-0" />
              {!collapsed && <span className="tracking-wide text-xs">TANYA AI</span>}
            </div>
            {!collapsed && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/30 font-mono text-blue-200">
                COPILOT
              </span>
            )}
          </button>

          {/* User profile & currency footer */}
          {!collapsed && (
            <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-zinc-300">Ahmad Fauzi</span>
              </div>
              <button
                onClick={() => setCurrencyMode(currencyMode === 'IDR' ? 'USD' : 'IDR')}
                className="font-bold text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-blue-400 hover:bg-zinc-700 transition border border-zinc-700 cursor-pointer"
              >
                {currencyMode}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 bg-zinc-900 border-r border-zinc-800 transition-all duration-200 z-30 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {renderContent(isCollapsed, false)}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-72 max-w-[85vw] h-full bg-zinc-900 border-r border-zinc-800 shadow-2xl flex flex-col justify-between">
            {renderContent(false, true)}
          </div>
          <div className="flex-1" onClick={() => setIsMobileOpen(false)} />
        </div>
      )}
    </>
  );
};
