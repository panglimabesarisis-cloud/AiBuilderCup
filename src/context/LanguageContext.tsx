import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en';
export type CurrencyMode = 'IDR' | 'USD';

export const USD_TO_IDR_RATE = 16000;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  currencyMode: CurrencyMode;
  setCurrencyMode: (curr: CurrencyMode) => void;
  toggleCurrency: () => void;
  formatCurrency: (amountInIdr: number) => string;
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

    // Product Management & Add Product Form
    product_management: 'Halaman Produk',
    add_product: 'Tambah Produk',
    add_product_subtitle: 'Lengkapi formulir di bawah ini untuk menambahkan produk baru ke katalog POS Machine & Toko Online PWA.',
    photo_and_image: 'Foto & Gambar Produk',
    photo_format_hint: 'Format: JPG, PNG, WebP (Maks. 5MB)',
    image_box: 'Kotak Gambar',
    click_to_pick: 'Klik untuk pilih foto',
    upload_product_photo: 'Upload Foto Produk',
    upload_photo_desc: 'Unggah gambar produk untuk ditampilkan di etalase POS Terminal Kasir dan aplikasi PWA Pelanggan. Foto resolusi tajam meningkatkan daya tarik produk.',
    change_image: 'Ganti Gambar',
    upload_image_btn: 'Upload Gambar',
    delete_image: 'Hapus',
    uploaded_badge: 'Terunggah',
    basic_info: 'Informasi Dasar Produk',
    part_1_of_4: 'Bagian 1 dari 4 • Wajib diisi (*)',
    product_name: 'Nama Produk',
    product_name_placeholder: 'Contoh: Aqua 600ml Botol / Le Minerale Dus 24x600ml / Gas Melon 3Kg',
    barcode_sku: 'Kode Barcode / SKU',
    random_sku: 'Acak SKU',
    product_category: 'Kategori Produk',
    brand_label: 'Merek / Pabrik',
    brand_placeholder: 'Contoh: Danone, Mayora, Wings, Pertamina',
    selling_unit: 'Satuan Jual',
    product_desc_optional: 'Deskripsi / Keterangan Tambahan (Opsional)',
    desc_placeholder: 'Catatan detail produk, cara penyajian, syarat retur botol, dsb...',
    pricing_profit_margin: 'Harga Jual, Modal & Margin Laba',
    pos_pwa_auto_sync: 'POS & PWA otomatis sinkron',
    cost_price: 'Harga Modal / Beli',
    selling_price_standard: 'Harga Jual Standar',
    pos_price: 'Harga Kasir POS',
    pwa_price: 'Harga Online PWA',
    wholesale_carton_price: 'Harga Grosir per Dus',
    auto_badge: 'Otomatis',
    carton_badge: 'Dus / Karton',
    profit_per_unit: 'Keuntungan per Unit',
    net_profit_margin: 'Margin Laba Bersih',
    margin_healthy: 'Margin Sangat Sehat',
    margin_medium: 'Margin Sedang',
    margin_thin: 'Margin Tipis',
    tax_setting: 'Pengaturan Pajak',
    tax_none: 'Bebas Pajak (Non PPN)',
    tax_ppn11: 'PPN 11% (Tambah Otomatis)',
    tax_inclusive: 'Termasuk Pajak (Include)',
    stock_management: 'Manajemen Stok & Konversi Dus / Karton',
    manage_stock: 'Kelola Stok',
    initial_stock: 'Stok Awal (Pcs / Unit)',
    min_stock_critical: 'Batas Stok Minimum (Kritis)',
    items_per_carton: 'Isi per Karton / Dus',
    shelf_location: 'Lokasi Rak / Penyimpanan',
    shelf_placeholder: 'Rak A-01 / Gudang 2',
    weight_volume: 'Berat / Volume Satuan (ml / gr)',
    product_variants: 'Varian Produk (Ukuran, Rasa, Kemasan)',
    product_variants_desc: 'Aktifkan jika produk memiliki berbagai pilihan (misal: 600ml, 1500ml, Original, Dingin).',
    variants_active: 'Aktif',
    variants_inactive: 'Nonaktif',
    variant_list_title: 'Daftar Pilihan Varian',
    add_new_variant: '+ Tambah Varian Baru',
    variant_name_th: 'Nama Varian',
    variant_sku_th: 'SKU',
    variant_cost_th: 'Harga Modal',
    variant_sell_th: 'Harga Jual',
    variant_stock_th: 'Stok',
    variant_action_th: 'Aksi',
    reset_form: 'Reset Form',
    back: 'Kembali',
    save_and_add_another: 'Simpan & Tambah Lainnya',
    save_product: 'Simpan Produk',
    switch_currency_label: 'Ubah Mata Uang',
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

    // Product Management & Add Product Form
    product_management: 'Product Management',
    add_product: 'Add Product',
    add_product_subtitle: 'Fill out the form below to add a new item into the POS Machine catalog & Customer Online PWA.',
    photo_and_image: 'Product Photos & Imagery',
    photo_format_hint: 'Formats: JPG, PNG, WebP (Max 5MB)',
    image_box: 'Image Box',
    click_to_pick: 'Click to select photo',
    upload_product_photo: 'Upload Product Photo',
    upload_photo_desc: 'Upload high-resolution product imagery to display on the POS Cashier Terminal and Customer PWA storefront.',
    change_image: 'Change Image',
    upload_image_btn: 'Upload Image',
    delete_image: 'Delete',
    uploaded_badge: 'Uploaded',
    basic_info: 'Basic Product Information',
    part_1_of_4: 'Part 1 of 4 • Required (*)',
    product_name: 'Product Name',
    product_name_placeholder: 'Example: Aqua 600ml Bottle / Le Minerale Carton 24x600ml / Gas Cylinder 3Kg',
    barcode_sku: 'Barcode / SKU',
    random_sku: 'Generate SKU',
    product_category: 'Product Category',
    brand_label: 'Brand / Manufacturer',
    brand_placeholder: 'Example: Danone, Mayora, Wings, Pertamina',
    selling_unit: 'Selling Unit',
    product_desc_optional: 'Description / Additional Notes (Optional)',
    desc_placeholder: 'Product details, serving notes, bottle return terms, etc...',
    pricing_profit_margin: 'Sales Price, Capital & Profit Margin',
    pos_pwa_auto_sync: 'POS & PWA auto-synchronized',
    cost_price: 'Purchase Price / Cost',
    selling_price_standard: 'Standard Retail Price',
    pos_price: 'POS Cashier Price',
    pwa_price: 'Online PWA Price',
    wholesale_carton_price: 'Wholesale Box Price',
    auto_badge: 'Auto',
    carton_badge: 'Box / Carton',
    profit_per_unit: 'Unit Profit',
    net_profit_margin: 'Net Profit Margin',
    margin_healthy: 'Healthy Margin',
    margin_medium: 'Moderate Margin',
    margin_thin: 'Thin Margin',
    tax_setting: 'Tax Setting',
    tax_none: 'Tax Exempt (No VAT)',
    tax_ppn11: 'VAT 11% (Auto Append)',
    tax_inclusive: 'Tax Inclusive',
    stock_management: 'Stock Management & Carton Conversion',
    manage_stock: 'Track Inventory',
    initial_stock: 'Initial Stock (Units / Pcs)',
    min_stock_critical: 'Minimum Threshold (Critical)',
    items_per_carton: 'Items per Carton / Box',
    shelf_location: 'Shelf / Storage Location',
    shelf_placeholder: 'Shelf A-01 / Warehouse 2',
    weight_volume: 'Unit Weight / Volume (ml / gr)',
    product_variants: 'Product Variants (Size, Flavor, Package)',
    product_variants_desc: 'Enable if product comes in multiple variations (e.g., 600ml, 1500ml, Regular, Cold).',
    variants_active: 'Active',
    variants_inactive: 'Inactive',
    variant_list_title: 'Variant Options List',
    add_new_variant: '+ Add New Variant',
    variant_name_th: 'Variant Name',
    variant_sku_th: 'SKU',
    variant_cost_th: 'Cost Price',
    variant_sell_th: 'Retail Price',
    variant_stock_th: 'Stock',
    variant_action_th: 'Actions',
    reset_form: 'Reset Form',
    back: 'Back',
    save_and_add_another: 'Save & Add Another',
    save_product: 'Save Product',
    switch_currency_label: 'Switch Currency',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'id',
  setLanguage: () => {},
  toggleLanguage: () => {},
  currencyMode: 'IDR',
  setCurrencyMode: () => {},
  toggleCurrency: () => {},
  formatCurrency: () => '',
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

  const [currencyMode, setCurrencyModeState] = useState<CurrencyMode>(() => {
    try {
      const saved = localStorage.getItem('riskcart_currency');
      if (saved === 'IDR' || saved === 'USD') return saved;
    } catch {
      // ignore
    }
    return 'IDR';
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

  const setCurrencyMode = (curr: CurrencyMode) => {
    setCurrencyModeState(curr);
    try {
      localStorage.setItem('riskcart_currency', curr);
    } catch {
      // ignore
    }
  };

  const toggleCurrency = () => {
    setCurrencyMode(currencyMode === 'IDR' ? 'USD' : 'IDR');
  };

  const formatCurrency = (amountInIdr: number): string => {
    const num = Number(amountInIdr) || 0;
    if (currencyMode === 'USD') {
      const usdVal = num / USD_TO_IDR_RATE;
      return `$${usdVal.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        currencyMode,
        setCurrencyMode,
        toggleCurrency,
        formatCurrency,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
