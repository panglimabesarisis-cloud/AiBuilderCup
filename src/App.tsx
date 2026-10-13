/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { GlobalModals } from './components/common/GlobalModals';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { LandingPage } from './components/landing/LandingPage';
import { PosMachine } from './components/pos/PosMachine';
import { TransactionDashboard } from './components/pos/TransactionDashboard';
import { AssetFinancialDashboard } from './components/pos/AssetFinancialDashboard';
import { ProductCartonManager } from './components/pos/ProductCartonManager';
import { AntiFraudInspector } from './components/pos/AntiFraudInspector';
import { RestockAdvisor } from './components/pos/RestockAdvisor';
import { ClientPwaApp } from './components/pwa/ClientPwaApp';
import { PwaSettings } from './components/admin/PwaSettings';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { seedDemoDataIfEmpty, seedReportDemoIfNeeded } from './services/dataSeeder';

import { ProductCartonTabType } from './components/common/Sidebar';
import { AIHubModule } from './components/modules/AIHubModule';
import { MultiOutletModule } from './components/modules/MultiOutletModule';
import { ShiftModule } from './components/modules/ShiftModule';
import { ProcurementModule } from './components/modules/ProcurementModule';
import { POSTransactionsModule } from './components/modules/POSTransactionsModule';
import { InventoryTrackingModule } from './components/modules/InventoryTrackingModule';
import { CustomerModule } from './components/modules/CustomerModule';
import { MarketingModule } from './components/modules/MarketingModule';
import { StaffModule } from './components/modules/StaffModule';
import { FinanceModule } from './components/modules/FinanceModule';
import { OnlineOrderModule } from './components/modules/OnlineOrderModule';
import { PWASettingsModule } from './components/modules/PWASettingsModule';
import { POSSettingsModule } from './components/modules/POSSettingsModule';
import { PaymentIntegrationModule } from './components/modules/PaymentIntegrationModule';
import { OrdersModule } from './components/modules/OrdersModule';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

function AppContent() {
  const { currencyMode, setCurrencyMode } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('pos_machine'); // Default to POS Machine
  const [activeSubModule, setActiveSubModule] = useState<string>('ai_master');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [productSubTab, setProductSubTab] = useState<ProductCartonTabType>('list');
  const [productViewMode, setProductViewMode] = useState<'table' | 'add_product'>('table');

  // Live session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync URL query parameter (?agent=<slug>) on initial load and history popstate navigation
  useEffect(() => {
    const handleUrlSync = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const agentSlug = searchParams.get('agent');
        if (agentSlug) {
          setActiveTab('module_ai');
          setActiveSubModule(agentSlug);
        }
      } catch (err) {
        // Safe fallback
      }
    };

    handleUrlSync();
    window.addEventListener('popstate', handleUrlSync);
    return () => window.removeEventListener('popstate', handleUrlSync);
  }, []);

  useEffect(() => {
    // Automatically seed Firestore with initial demo catalog and transactions if empty
    seedDemoDataIfEmpty()
      .then(() => seedReportDemoIfNeeded())
      .catch((err) => {
        console.warn('Initial seed error:', err);
      });
  }, []);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="h-dvh flex flex-col bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-hidden">
      {/* 1. STICKY TOP HEADER - Placed at the very top */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* 2. MAIN WORKSPACE CONTAINER - Sidebar persistent on all pages, content never covered */}
      <div className="flex-1 flex w-full overflow-hidden min-h-0">
        {/* Persistent Sidebar (available on all pages with hamburger minimize) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'products') {
              setProductViewMode('table');
            }
          }}
          activeSubModule={activeSubModule}
          setActiveSubModule={setActiveSubModule}
          isCollapsed={isSidebarCollapsed}
          toggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
          currencyMode={currencyMode}
          setCurrencyMode={setCurrencyMode}
          onOpenModal={(modal) => setActiveModal(modal)}
          sessionSeconds={sessionSeconds}
          onSelectProductSubTab={(subTab) => {
            setProductSubTab(subTab);
            setProductViewMode('table');
          }}
          onOpenAddProduct={() => {
            setProductViewMode('add_product');
          }}
        />

        {/* Content Area - class="flex-1 w-full overflow-hidden" directly below header */}
        <div className="flex-1 w-full overflow-hidden flex flex-col min-w-0">
          {activeTab === 'pos_machine' ? (
            <main className="flex-1 w-full overflow-hidden min-h-0">
              <PosMachine
                onNavigateTab={setActiveTab}
                currencyMode={currencyMode}
                setCurrencyMode={setCurrencyMode}
              />
            </main>
          ) : (
            <main className="flex-1 w-full overflow-y-auto px-4 sm:px-6 py-6">
              <div className={`${activeTab === 'products' ? 'w-full max-w-[1600px]' : 'max-w-7xl'} mx-auto`}>
                {activeTab === 'landing' && <LandingPage onNavigate={setActiveTab} />}
                {activeTab === 'admin_dashboard' && (
                  <AdminDashboard
                    onNavigateTab={setActiveTab}
                    onOpenAddProduct={() => {
                      setActiveTab('products');
                      setProductViewMode('add_product');
                    }}
                  />
                )}
                {activeTab === 'orders' && (
                  <OrdersModule
                    currencyMode={currencyMode}
                    onNavigateTab={setActiveTab}
                  />
                )}
                {activeTab === 'transactions' && <TransactionDashboard />}
                {activeTab === 'assets' && <AssetFinancialDashboard />}
                {activeTab === 'products' && (
                  <ProductCartonManager
                    initialSubTab={productSubTab}
                    initialViewMode={productViewMode}
                  />
                )}
                {activeTab === 'anti_fraud' && <AntiFraudInspector />}
                {activeTab === 'restock' && <RestockAdvisor />}
                {activeTab === 'client_pwa' && <ClientPwaApp />}
                {activeTab === 'settings' && <PwaSettings />}

                {/* NEW INTEGRATED MODULES (A - Q ARCHITECTURE) */}
                {activeTab === 'module_ai' && (
                  <AIHubModule
                    subModule={activeSubModule as any || 'ai_master'}
                    onNavigateTab={setActiveTab}
                    currencyMode={currencyMode}
                  />
                )}
                {activeTab === 'module_multi_outlet' && (
                  <MultiOutletModule
                    subModule={activeSubModule as any || 'lihat_outlet'}
                    onNavigateTab={setActiveTab}
                    currencyMode={currencyMode}
                  />
                )}
                {activeTab === 'module_shift' && (
                  <ShiftModule
                    subModule={activeSubModule as any || 'cashir'}
                    onNavigateTab={setActiveTab}
                    currencyMode={currencyMode}
                  />
                )}
                {activeTab === 'module_procurement' && (
                  <ProcurementModule
                    subModule={activeSubModule as any || 'daftar_supplier'}
                    onNavigateTab={setActiveTab}
                    currencyMode={currencyMode}
                  />
                )}
                {activeTab === 'module_pos_transactions' && (
                  <POSTransactionsModule
                    subModule={activeSubModule as any || 'transaksi_penjualan'}
                    onNavigateTab={setActiveTab}
                    currencyMode={currencyMode}
                  />
                )}
                {activeTab === 'module_inventory' && (
                  <InventoryTrackingModule
                    subModule={activeSubModule as any || 'inventory'}
                    onNavigateTab={setActiveTab}
                    currencyMode={currencyMode}
                  />
                )}
                {activeTab === 'module_customer' && (
                  <CustomerModule
                    subModule={activeSubModule as any || 'daftar_pelanggan'}
                    onNavigateTab={setActiveTab}
                    currencyMode={currencyMode}
                  />
                )}
                {activeTab === 'module_marketing' && (
                  <MarketingModule
                    subModule={activeSubModule as any || 'hadiah_target'}
                    onNavigateTab={setActiveTab}
                    currencyMode={currencyMode}
                  />
                )}
                {activeTab === 'module_staff' && (
                  <StaffModule
                    subModule={activeSubModule as any || 'daftar_staff'}
                    onNavigateTab={setActiveTab}
                    currencyMode={currencyMode}
                  />
                )}
                {activeTab === 'module_finance' && (
                  <FinanceModule
                    subModule={activeSubModule as any || 'bangkas_toko'}
                    onNavigateTab={setActiveTab}
                    currencyMode={currencyMode}
                  />
                )}
                {activeTab === 'module_online_order' && (
                  <OnlineOrderModule
                    subModule={activeSubModule as any || 'website_setting'}
                    onNavigateTab={setActiveTab}
                    currencyMode={currencyMode}
                  />
                )}
                {activeTab === 'module_pwa_settings' && (
                  <PWASettingsModule
                    subModule={activeSubModule as any || 'umum'}
                    onNavigateTab={setActiveTab}
                    currencyMode={currencyMode}
                  />
                )}
                {activeTab === 'module_pos_settings' && (
                  <POSSettingsModule
                    subModule={activeSubModule as any || 'umum'}
                    onNavigateTab={setActiveTab}
                    currencyMode={currencyMode}
                  />
                )}
                {activeTab === 'module_payment' && (
                  <PaymentIntegrationModule
                    subModule={activeSubModule as any || 'xendit'}
                    onNavigateTab={setActiveTab}
                    currencyMode={currencyMode}
                  />
                )}
              </div>

              {/* Footer */}
              <footer className="mt-12 pt-6 border-t border-zinc-900 text-center text-xs text-zinc-500">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span>RiskCart Point Of Sale &copy; 2026 &mdash; Built for AI Builder Cup 2026</span>
                  <div className="flex items-center gap-4 text-zinc-400">
                    <span>Cloud Firestore Realtime</span>
                    <span>Gemini 3.8 Flash AI</span>
                    <span>PWA Offline-Ready</span>
                  </div>
                </div>
              </footer>
            </main>
          )}
        </div>
      </div>

      {/* Global Modals triggered from Persistent Sidebar across all pages */}
      <GlobalModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        currencyMode={currencyMode}
        onNavigateTab={setActiveTab}
        sessionSeconds={sessionSeconds}
      />

      {/* Offline Status Badge */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
