import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  id: {
    // Top Bar & Navigation
    pos_terminal: 'Terminal Kasir POS',
    dashboard_admin: 'Dashboard Admin',
    transactions: 'Transaksi Penjualan',
    financial_assets: 'Aset Finansial',
    product_carton: 'Halaman Produk',
    ai_anti_fraud: 'AI Anti-Fraud',
    restock_advisor: 'Restock Advisor',
    client_pwa: 'Client PWA',
    settings: 'Pengaturan',
    lang_toggle: 'Ganti Bahasa',

    // AI Advisor Purchase & Rules
    ai_advisor_purchase: 'AI Advisor Purchase',
    ai_advisor_purchase_desc: 'Rekomendasi pengadaan stok otomatis dengan kunci formula penjualan & stok tersedia. Wajib restock jika sisa stok < 1 minggu.',
    available_stock: 'Stok Tersedia',
    sales_velocity: 'Penjualan Harian',
    runway_days: 'Estimasi Sisa (Hari)',
    mandatory_restock: 'WAJIB RESTOCK (< 7 HARI)',
    warning_restock: 'WASPADA (7-14 HARI)',
    safe_stock: 'STOK AMAN (> 14 HARI)',
    lock_recommendation: 'Kunci Rekomendasi (Locked)',
    unlock_recommendation: 'Buka Kunci (Unlocked)',
    generate_po: 'Buat Purchase Order (PO)',
    po_generated: 'Purchase Order Berhasil Dibuat!',
    lock_active_msg: 'Formula dan kuantitas pesanan terkunci untuk mencegah manipulasi.',

    // Instruction & Knowledge Panel
    instruction_knowledge_title: 'Kolom Instruksi & Knowledge Agen',
    instruction_knowledge_desc: 'Konfigurasi prompt sistem, aturan guardrail, dan basis pengetahuan (RAG) yang disinkronkan langsung ke agen AI.',
    system_instruction: 'Instruksi Prompt Sistem',
    knowledge_base: 'Basis Pengetahuan & Konteks Toko',
    save_instruction: 'Simpan Instruksi',
    reset_default: 'Reset ke Default SOP',
    instruction_saved: 'Instruksi AI berhasil disimpan & disinkronkan ke Gemini 3.8 Flash!',
    add_knowledge: '+ Tambah Dokumen Pengetahuan',
    knowledge_title_placeholder: 'Judul Dokumen / Aturan SOP...',
    knowledge_content_placeholder: 'Tuliskan aturan, batas harga, toleransi kasir, atau data referensi...',
    save_knowledge: 'Simpan ke Knowledge Base',
    knowledge_added: 'Dokumen berhasil ditambahkan ke knowledge index!',

    // Common
    search: 'Cari...',
    filter: 'Filter',
    status: 'Status',
    actions: 'Aksi',
    active: 'Aktif',
    paused: 'Dijeda',
    all: 'Semua',
    cancel: 'Batal',
    save: 'Simpan',
  },
  en: {
    // Top Bar & Navigation
    pos_terminal: 'POS Cashier Terminal',
    dashboard_admin: 'Admin Dashboard',
    transactions: 'Sales Transactions',
    financial_assets: 'Financial Assets',
    product_carton: 'Products & Cartons',
    ai_anti_fraud: 'AI Anti-Fraud',
    restock_advisor: 'Restock Advisor',
    client_pwa: 'Client PWA',
    settings: 'Settings',
    lang_toggle: 'Switch Language',

    // AI Advisor Purchase & Rules
    ai_advisor_purchase: 'AI Advisor Purchase',
    ai_advisor_purchase_desc: 'Automated procurement recommendations locked to sales velocity & available stock. Mandatory restock if stock runway < 1 week.',
    available_stock: 'Available Stock',
    sales_velocity: 'Daily Sales',
    runway_days: 'Estimated Runway (Days)',
    mandatory_restock: 'MANDATORY RESTOCK (< 7 DAYS)',
    warning_restock: 'WARNING (7-14 DAYS)',
    safe_stock: 'SAFE STOCK (> 14 DAYS)',
    lock_recommendation: 'Lock Recommendation',
    unlock_recommendation: 'Unlock Recommendation',
    generate_po: 'Generate Purchase Order (PO)',
    po_generated: 'Purchase Order Successfully Created!',
    lock_active_msg: 'Formula and order quantities are locked to prevent unauthorized tampering.',

    // Instruction & Knowledge Panel
    instruction_knowledge_title: 'Agent Instruction & Knowledge Panel',
    instruction_knowledge_desc: 'Configure system prompt directives, guardrail rules, and governed knowledge base (RAG) synchronized to the AI agent.',
    system_instruction: 'System Prompt Instructions',
    knowledge_base: 'Governed Knowledge Base & Store Context',
    save_instruction: 'Save Instructions',
    reset_default: 'Reset to Default SOP',
    instruction_saved: 'AI Instructions successfully saved & synced to Gemini 3.8 Flash!',
    add_knowledge: '+ Add Knowledge Document',
    knowledge_title_placeholder: 'Document title / SOP rule...',
    knowledge_content_placeholder: 'Write rules, pricing bounds, cashier tolerances, or domain references...',
    save_knowledge: 'Save to Knowledge Base',
    knowledge_added: 'Document successfully indexed into knowledge base!',

    // Common
    search: 'Search...',
    filter: 'Filter',
    status: 'Status',
    actions: 'Actions',
    active: 'Active',
    paused: 'Paused',
    all: 'All',
    cancel: 'Cancel',
    save: 'Save',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'id',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('riskcart_lang');
      if (saved === 'en' || saved === 'id') return saved;
    } catch {
      // ignore
    }
    return 'id';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('riskcart_lang', lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
