import React, { useState, useEffect } from 'react';
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
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onToggleSidebar,
}) => {
  const { language, toggleLanguage, currencyMode, toggleCurrency, t } = useLanguage();
  const [pendingPwaCount, setPendingPwaCount] = useState<number>(0);

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
    { id: 'admin_dashboard', label: 'ADMIN DASHBOARD', icon: LayoutDashboard, badge: 'Admin' },
    { id: 'transactions', label: 'Transactions Feed', icon: ShoppingBag, badge: 'Live' },
    { id: 'assets', label: 'Financial Assets', icon: Gauge },
    { id: 'products', label: 'Halaman Produk', icon: Boxes },
    { id: 'anti_fraud', label: 'AI Anti-Fraud', icon: Cpu },
    { id: 'restock', label: 'Restock Advisor', icon: Sparkles },
    { id: 'client_pwa', label: 'Client PWA', icon: Smartphone, highlight: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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
        <nav className="hidden 2xl:flex items-center gap-1 overflow-x-auto min-w-0">
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

