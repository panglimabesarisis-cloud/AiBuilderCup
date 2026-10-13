import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Store,
  LayoutDashboard,
  Gauge,
  Boxes,
  Cpu,
  Sparkles,
  Smartphone,
  Settings,
  ShoppingBag,
  Menu,
  Phone,
  Globe,
  DollarSign,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { PWAInstallButton } from './PWAInstallButton';
import { RiskCartLogo } from './RiskCartLogo';
import { useLanguage } from '../../context/LanguageContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleSidebar?: () => void;
  setActiveSubModule?: (sub: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onToggleSidebar,
  setActiveSubModule,
}) => {
  const { language, toggleLanguage, currencyMode, toggleCurrency, t } = useLanguage();
  const [pendingPwaCount, setPendingPwaCount] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiSubOpen, setAiSubOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    const qTx = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(25));
    const unsub = onSnapshot(
      qTx,
      (snapshot) => {
        let count = 0;
        snapshot.forEach((d) => {
          const data = d.data();
          if (
            data.channel === 'pwa_client' &&
            (data.status === 'pending_approval' || data.status === 'pending')
          ) {
            count++;
          }
        });
        setPendingPwaCount(count);
      },
      (err) => console.warn('Navbar transactions listener notice:', err)
    );
    return () => unsub();
  }, []);

  const navItems = [
    { id: 'pos_machine', label: 'POS Machine', icon: Store, badge: 'Terminal' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: 'Wharf' },
    { id: 'products', label: 'Halaman Produk', icon: Boxes },
    { id: 'restock', label: 'Restock Advisor', icon: Sparkles },
    { id: 'client_pwa', label: 'Client PWA', icon: Smartphone, highlight: true },
  ];

  const menuUtamaItems = [
    { id: 'admin_dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'anti_fraud', label: 'AI Anti-Fraud', icon: Cpu },
    { id: 'transactions', label: 'Transaction Feed', icon: ShoppingBag },
    { id: 'assets', label: 'Financial Asset', icon: Gauge },
    { id: 'settings', label: 'Setting', icon: Settings },
  ];
  const menuUtamaActive =
    menuUtamaItems.some((i) => i.id === activeTab) || activeTab === 'module_ai';

  const goMenu = (tab: string, sub?: string) => {
    setActiveTab(tab);
    if (sub && setActiveSubModule) setActiveSubModule(sub);
    setMenuOpen(false);
    setAiSubOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="w-full px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Left Section: Burger Menu & Brand Logo placed on the far left */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition flex items-center justify-center shadow-sm cursor-pointer"
              title="Toggle & Minimize Sidebar"
              aria-label="Toggle Sidebar Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div
            onClick={() => setActiveTab('landing')}
            className="cursor-pointer group shrink-0"
            title="RiskCart Artificial Intelligence"
          >
            <RiskCartLogo size="md" />
          </div>
        </div>

        {/* Center / Navigation Items (Desktop) */}
        <nav className="hidden 2xl:flex items-center gap-1 min-w-0">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                menuUtamaActive || menuOpen
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Menu className={`w-3.5 h-3.5 ${menuUtamaActive ? 'text-blue-400' : ''}`} />
              MENU UTAMA
              <ChevronDown className={`w-3 h-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full mt-2 w-60 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl p-1.5 z-50"
              >
                {menuUtamaItems.slice(0, 2).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      role="menuitem"
                      onClick={() => goMenu(item.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left transition ${
                        activeTab === item.id ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-blue-400" />
                      {item.label}
                    </button>
                  );
                })}
                <button
                  role="menuitem"
                  onClick={() => setAiSubOpen((o) => !o)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left transition ${
                    activeTab === 'module_ai' ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Artificial Intelligence
                  </span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${aiSubOpen ? 'rotate-90' : ''}`} />
                </button>
                {aiSubOpen && (
                  <div className="ml-4 pl-2 border-l border-purple-500/60 my-0.5">
                    <button
                      role="menuitem"
                      onClick={() => goMenu('module_ai', 'ai_master')}
                      className="w-full px-3 py-1.5 rounded-lg text-xs text-left text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
                    >
                      List AI Agent
                    </button>
                  </div>
                )}
                {menuUtamaItems.slice(2).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      role="menuitem"
                      onClick={() => goMenu(item.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left transition ${
                        activeTab === item.id ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-blue-400" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : item.highlight
                    ? 'bg-purple-950/50 text-purple-300 border border-purple-800/60 hover:bg-purple-900/40'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : ''}`} />
                {item.label}
                {item.id === 'pos_machine' && pendingPwaCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black animate-pulse shadow-sm">
                    {pendingPwaCount} Baru
                  </span>
                ) : item.badge ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Right CTA: Currency Toggle (IDR / USD) & Language Switcher (EN / ID) */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton />

          {/* Currency Toggle (IDR / USD) */}
          <button
            onClick={toggleCurrency}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white text-xs font-bold transition shadow-sm cursor-pointer group hover:border-emerald-500/50"
            title={currencyMode === 'IDR' ? 'Ubah Mata Uang ke USD ($)' : 'Switch Currency to Rupiah (Rp)'}
            aria-label="Toggle Currency IDR / USD"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <span
                className={`px-1.5 py-0.5 rounded transition ${
                  currencyMode === 'IDR'
                    ? 'bg-emerald-600 text-white font-black shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                IDR
              </span>
              <span className="text-zinc-600 font-bold">/</span>
              <span
                className={`px-1.5 py-0.5 rounded transition ${
                  currencyMode === 'USD'
                    ? 'bg-emerald-600 text-white font-black shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                USD
              </span>
            </div>
          </button>

          {/* Language Switcher EN / ID */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white text-xs font-bold transition shadow-sm cursor-pointer group hover:border-blue-500/50"
            title={language === 'id' ? 'Ganti Bahasa ke English (EN)' : 'Switch Language to Bahasa Indonesia (ID)'}
            aria-label="Toggle Language EN / ID"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400 group-hover:rotate-12 transition-transform shrink-0" />
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <span className={`px-1.5 py-0.5 rounded transition ${language === 'en' ? 'bg-blue-600 text-white font-black shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}>
                EN
              </span>
              <span className="text-zinc-600 font-bold">/</span>
              <span className={`px-1.5 py-0.5 rounded transition ${language === 'id' ? 'bg-blue-600 text-white font-black shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}>
                ID
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

