import React, { useState, useEffect } from 'react';
import { useProductGroups } from '../../hooks/useProductGroups';
import { useFirestoreList } from '../../hooks/useFirestoreList';
import {
  Search,
  Plus,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  ClipboardList,
  Edit,
  Trash2,
  X,
  Sparkles,
  Sun,
  Moon,
  Activity,
  ArrowUpDown,
  Filter,
  Boxes,
  Tag,
  Percent,
  DollarSign,
  TrendingUp,
  Grid,
  Store,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { DEMO_STORE_ID } from '../../services/dataSeeder';
import { AddProductForm } from './AddProductForm';

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

export interface ProductVariantItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  costPrice: number;
  sellPrice: number;
  posPrice: number;
  pwaPrice: number;
  stock: number;
  itemsPerCarton: number;
  weightMl: number;
  isActive: boolean;
  isPosVisible: boolean;
  isPwaVisible: boolean;
}

export interface ProductGroupItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  hasVariants: boolean;
  sku?: string;
  costPrice?: number;
  sellPrice?: number;
  posPrice?: number;
  pwaPrice?: number;
  sellPriceRange?: string;
  costPriceRange?: string;
  totalStock: number;
  itemsPerCarton?: number;
  weightMl?: number;
  isActive?: boolean;
  isPosVisible?: boolean;
  isPwaVisible?: boolean;
  variants?: ProductVariantItem[];
}

export interface ProductCartonManagerProps {
  initialSubTab?: ProductCartonTabType;
  initialViewMode?: 'table' | 'add_product';
}

export const ProductCartonManager: React.FC<ProductCartonManagerProps> = ({
  initialSubTab,
  initialViewMode,
}) => {
  const [activeTab, setActiveTab] = useState<ProductCartonTabType>(
    initialSubTab || 'list'
  );
  // Satu sumber data: koleksi Firestore `products` (sama dengan yang dipakai POS dan PWA)
  const [products, setProducts] = useProductGroups();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Theme State: 'dark' or 'light'
  const [tableTheme, setTableTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('riskcart_product_table_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark'; // Harmonizes with RiskCart POS dark styling
  });

  const handleSetTheme = (theme: 'dark' | 'light') => {
    setTableTheme(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('riskcart_product_table_theme', theme);
    }
    showToast(`Switched to ${theme === 'dark' ? 'Dark' : 'Light'} theme`);
  };

  // View Mode: 'table' or 'add_product' (full page layout matching add produk.jpg)
  const [viewMode, setViewMode] = useState<'table' | 'add_product'>(initialViewMode || 'table');

  // Sync props if changed externally
  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Dynamic Inbound and Outbound Records
  const [stockInRecords, setStockInRecords] = useFirestoreList('stock_in', [
    { id: 'DO-202610-091', date: '09/10/2026 10:15', product: 'Aqua Carton 240ml Cup', qty: 50, supplier: 'PT Tirta Distribusi Jaya', status: 'Recorded' },
    { id: 'DO-202610-088', date: '08/10/2026 14:30', product: 'LPG Gas 3 Kg Melon', qty: 40, supplier: 'Agen Gas Pertamina Mitra', status: 'Recorded' },
  ]);

  const [stockOutRecords, setStockOutRecords] = useFirestoreList('stock_out', [
    { id: 'OUT-202610-044', date: '09/10/2026 12:40', product: 'Aqua Gallon 19L Refill', qty: 12, dest: 'Store POS Sales', status: 'Dispensed' },
    { id: 'OUT-202610-041', date: '09/10/2026 09:15', product: 'Floridina Orange 350ml Carton', qty: 5, dest: 'PWA Client Wholesale', status: 'Dispensed' },
  ]);

  // Interactive Modals State
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProductGroupItem | null>(null);
  const [adjustingStockGroup, setAdjustingStockGroup] = useState<ProductGroupItem | null>(null);
  const [stockAdjustQty, setStockAdjustQty] = useState<number>(10);

  // Stock In Form
  const [stockInForm, setStockInForm] = useState({
    productName: 'Aqua Carton 240ml Cup',
    qty: 30,
    supplier: 'PT Tirta Distribusi Jaya',
  });

  // Stock Out Form
  const [stockOutForm, setStockOutForm] = useState({
    productName: 'Aqua Gallon 19L Refill',
    qty: 10,
    dest: 'Store POS Sales',
  });

  // Simulator & Package Filter State
  const [simProductSku, setSimProductSku] = useState<string>('');
  const [simQty, setSimQty] = useState<number>(2);
  const [simUnitType, setSimUnitType] = useState<'carton' | 'unit'>('carton');
  const [simCustomerType, setSimCustomerType] = useState<'regular' | 'pwa_member'>('pwa_member');
  const [packageCategoryFilter, setPackageCategoryFilter] = useState<string>('ALL');

  // New Product Form
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    sku: 'P' + Math.floor(100 + Math.random() * 900),
    category: 'FLAVORED',
    brand: '',
    costPrice: 20000,
    sellPrice: 25000,
    posPrice: 25000,
    pwaPrice: 25000,
    stock: 50,
    itemsPerCarton: 24,
    weightMl: 250,
  });

  // Handle Record Stock In Submit
  const handleRecordStockIn = (e: React.FormEvent) => {
    e.preventDefault();
    const newDo = 'DO-' + Date.now().toString().slice(-6);
    const newRecord = {
      id: newDo,
      date: new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      product: stockInForm.productName,
      qty: Number(stockInForm.qty),
      supplier: stockInForm.supplier || 'Distributor Resmi',
      status: 'Recorded',
    };
    setStockInRecords([newRecord, ...stockInRecords]);
    // Replenish stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.name.toLowerCase().includes(stockInForm.productName.toLowerCase().split(' ')[0])) {
          return { ...p, totalStock: p.totalStock + Number(stockInForm.qty) };
        }
        return p;
      })
    );
    setIsStockInModalOpen(false);
    showToast(`Inbound stock ${stockInForm.qty} karton berhasil dicatat (${newDo})!`);
  };

  // Handle Record Stock Out Submit
  const handleRecordStockOut = (e: React.FormEvent) => {
    e.preventDefault();
    const newSo = 'OUT-' + Date.now().toString().slice(-6);
    const newRecord = {
      id: newSo,
      date: new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      product: stockOutForm.productName,
      qty: Number(stockOutForm.qty),
      dest: stockOutForm.dest || 'Toko Retail POS',
      status: 'Dispensed',
    };
    setStockOutRecords([newRecord, ...stockOutRecords]);
    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.name.toLowerCase().includes(stockOutForm.productName.toLowerCase().split(' ')[0])) {
          return { ...p, totalStock: Math.max(0, p.totalStock - Number(stockOutForm.qty)) };
        }
        return p;
      })
    );
    setIsStockOutModalOpen(false);
    showToast(`Outbound stock ${stockOutForm.qty} unit/karton berhasil dicatat (${newSo})!`);
  };

  // Handle Save Edit Product
  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === editingGroup.id ? editingGroup : p))
    );
    setEditingGroup(null);
    showToast(`Produk "${editingGroup.name}" berhasil diperbarui!`);
  };

  // Handle Save Stock Adjustment
  const handleSaveStockAdjustment = (delta: number) => {
    if (!adjustingStockGroup) return;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === adjustingStockGroup.id) {
          const updatedStock = Math.max(0, p.totalStock + delta);
          return { ...p, totalStock: updatedStock };
        }
        return p;
      })
    );
    showToast(`Stok ${adjustingStockGroup.name} disesuaikan: ${delta >= 0 ? '+' : ''}${delta} unit!`);
    setAdjustingStockGroup(null);
  };

  // Dispatch Auto-Restock
  const handleDispatchRestock = (productName: string, cartonsQty: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.name.toLowerCase().includes(productName.toLowerCase().split(' ')[0])) {
          return { ...p, totalStock: p.totalStock + cartonsQty };
        }
        return p;
      })
    );
    const newDo = 'PO-' + Date.now().toString().slice(-5);
    setStockInRecords([
      {
        id: newDo,
        date: new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        product: productName,
        qty: cartonsQty,
        supplier: 'Restock Otomatis AI',
        status: 'Recorded',
      },
      ...stockInRecords,
    ]);
    showToast(`PO ${newDo} diterbitkan: +${cartonsQty} karton ${productName} ditambahkan ke stok!`);
  };

  // Toggle variant dropdown accordion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Update POS price inline
  const handleUpdatePosPrice = (groupId: string, variantId: string | null, newPrice: number) => {
    setProducts((prev) =>
      prev.map((grp) => {
        if (variantId && grp.variants) {
          const updatedVariants = grp.variants.map((v) =>
            v.id === variantId ? { ...v, posPrice: newPrice } : v
          );
          return { ...grp, variants: updatedVariants };
        } else if (grp.id === groupId) {
          return { ...grp, posPrice: newPrice };
        }
        return grp;
      })
    );
    showToast('POS cashier price updated!');
  };

  // Update PWA price inline
  const handleUpdatePwaPrice = (groupId: string, variantId: string | null, newPrice: number) => {
    setProducts((prev) =>
      prev.map((grp) => {
        if (variantId && grp.variants) {
          const updatedVariants = grp.variants.map((v) =>
            v.id === variantId ? { ...v, pwaPrice: newPrice } : v
          );
          return { ...grp, variants: updatedVariants };
        } else if (grp.id === groupId) {
          return { ...grp, pwaPrice: newPrice };
        }
        return grp;
      })
    );
    showToast('PWA online price updated!');
  };

  // Delete product
  const handleDeleteProduct = (groupId: string) => {
    if (confirm('Delete this product from catalog?')) {
      setProducts((prev) => prev.filter((p) => p.id !== groupId));
      setActiveDropdownId(null);
      showToast('Product successfully removed.');
    }
  };

  // Quick Add Product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newGroup: ProductGroupItem = {
      id: 'grp_' + Date.now(),
      name: newProductForm.name,
      sku: newProductForm.sku,
      category: newProductForm.category,
      brand: newProductForm.brand || newProductForm.name,
      hasVariants: false,
      costPrice: Number(newProductForm.costPrice),
      sellPrice: Number(newProductForm.sellPrice),
      posPrice: Number(newProductForm.posPrice),
      pwaPrice: Number(newProductForm.pwaPrice),
      totalStock: Number(newProductForm.stock),
      itemsPerCarton: Number(newProductForm.itemsPerCarton),
      weightMl: Number(newProductForm.weightMl),
      isActive: true,
      isPosVisible: true,
      isPwaVisible: true,
    };
    setProducts([newGroup, ...products]);
    setIsAddModalOpen(false);
    showToast(`Product "${newProductForm.name}" created successfully!`);
  };

  // Refresh
  const handleRefresh = () => {
    showToast('Katalog tersinkron realtime dengan Firestore.');
  };

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.variants && p.variants.some((v) => v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.sku.toLowerCase().includes(searchTerm.toLowerCase())));

    if (activeTab === 'kritis') {
      return matchesSearch && p.totalStock <= 5;
    }

    return matchesSearch;
  });

  // Count total displayed products
  const totalCount = products.reduce((acc, p) => acc + (p.variants ? p.variants.length : 1), 0);

  const isDark = tableTheme === 'dark';

  if (viewMode === 'add_product') {
    return (
      <div className="w-full space-y-4 font-sans select-none pb-12">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-700 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
        <AddProductForm
          isDark={isDark}
          onBack={() => setViewMode('table')}
          onToggleTheme={handleSetTheme}
          onSubmit={(newProduct) => {
            setProducts([newProduct, ...products]);
            setViewMode('table');
            showToast(`Produk "${newProduct.name}" berhasil ditambahkan!`);
          }}
          onSaveAndAddAnother={(newProduct) => {
            setProducts([newProduct, ...products]);
            showToast(`Produk "${newProduct.name}" disimpan!`);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 font-sans select-none pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-700 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER - Title: Halaman Produk */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-500" />
            <span>Halaman Produk</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pusat kelola List Produk, Paket Produk (Dus/Karton), Kategori &amp; Brand, serta Pengaturan Harga Diskon.
          </p>
        </div>

        {/* Action Controls & Light/Dark Theme Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Light / Dark Theme Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
            <button
              onClick={() => handleSetTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isDark
                  ? 'bg-zinc-800 text-white shadow-sm font-bold border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Dark Theme"
              aria-label="Dark Theme"
            >
              <Moon className="w-3.5 h-3.5 text-blue-400" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => handleSetTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                !isDark
                  ? 'bg-white text-slate-900 shadow-sm font-bold border border-slate-200'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Light Theme"
              aria-label="Light Theme"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold transition shadow-sm cursor-pointer"
            title="Refresh product data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setViewMode('add_product')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* HORIZONTAL SUB-NAVIGATION TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div
          className={`flex items-center gap-1 overflow-x-auto p-1.5 rounded-xl border text-xs transition-colors ${
            isDark
              ? 'bg-zinc-900/90 border-zinc-800 text-zinc-400'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          {/* 1. List Produk */}
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'list'
                ? isDark
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-600 text-white shadow-xs'
                : isDark
                ? 'hover:text-white hover:bg-zinc-800/50'
                : 'hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>List Produk</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-white font-mono">
              {totalCount}
            </span>
          </button>

          {/* 2. Paket Produk */}
          <button
            onClick={() => setActiveTab('paket')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'paket'
                ? isDark
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-600 text-white shadow-xs'
                : isDark
                ? 'hover:text-white hover:bg-zinc-800/50'
                : 'hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Paket Produk</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-white font-mono">
              Dus / Karton
            </span>
          </button>

          {/* 3. Kategori dan Brand */}
          <button
            onClick={() => setActiveTab('kategori')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'kategori'
                ? isDark
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-600 text-white shadow-xs'
                : isDark
                ? 'hover:text-white hover:bg-zinc-800/50'
                : 'hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Kategori dan Brand</span>
          </button>

          {/* 4. Harga Diskon */}
          <button
            onClick={() => setActiveTab('harga_diskon')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'harga_diskon'
                ? isDark
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-600 text-white shadow-xs'
                : isDark
                ? 'hover:text-white hover:bg-zinc-800/50'
                : 'hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Harga Diskon</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 font-bold">
              Promo
            </span>
          </button>
        </div>

        {/* Secondary Stock Audit Pills */}
        <div
          className={`flex items-center gap-1 overflow-x-auto p-1 rounded-xl border text-[11px] ${
            isDark ? 'bg-zinc-950/60 border-zinc-800/70 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}
        >
          <span className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Log:</span>
          <button
            onClick={() => setActiveTab('masuk')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'masuk' ? 'bg-zinc-800 text-white font-bold' : 'hover:text-white'
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => setActiveTab('keluar')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'keluar' ? 'bg-zinc-800 text-white font-bold' : 'hover:text-white'
            }`}
          >
            Keluar
          </button>
          <button
            onClick={() => setActiveTab('opname')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'opname' ? 'bg-zinc-800 text-white font-bold' : 'hover:text-white'
            }`}
          >
            Opname
          </button>
          <button
            onClick={() => setActiveTab('pergerakan')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'pergerakan' ? 'bg-zinc-800 text-white font-bold' : 'hover:text-white'
            }`}
          >
            Mutasi
          </button>
          <button
            onClick={() => setActiveTab('kritis')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
              activeTab === 'kritis' ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800' : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Kritis</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH ROW */}
      <div
        className={`rounded-2xl p-3 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors ${
          isDark
            ? 'bg-zinc-900/90 border-zinc-800 text-zinc-200'
            : 'bg-white border-slate-200/90 text-slate-800'
        }`}
      >
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDark
                ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-900'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white'
            }`}
          />
        </div>

        {/* Date Filter & Counter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            <span className="text-[11px] font-medium">Created from</span>
            <div className="relative">
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-28 px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isDark
                    ? 'border-zinc-800 bg-zinc-950 text-zinc-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            <span className="text-[11px] font-medium">To</span>
            <div className="relative">
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-28 px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isDark
                    ? 'border-zinc-800 bg-zinc-950 text-zinc-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg border font-bold text-xs ${
              isDark
                ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            {totalCount} products
          </div>
        </div>
      </div>

      {/* PRODUCT DATA TABLE CONTAINER (Light & Dark Theme Adaptive) */}
      {activeTab === 'list' && (
        <div
          className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
            isDark
              ? 'bg-zinc-900/95 border-zinc-800'
              : 'bg-white border-slate-200'
          }`}
        >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            {/* Table Header with theme styling */}
            <thead>
              <tr
                className={`border-b font-bold uppercase text-[10px] sm:text-[11px] tracking-wider whitespace-nowrap transition-colors ${
                  isDark
                    ? 'bg-zinc-950/90 border-zinc-800 text-zinc-300'
                    : 'bg-blue-50/90 border-blue-100/90 text-blue-950'
                }`}
              >
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Brand</th>
                <th className="py-3 px-3">Cost Price</th>
                <th className="py-3 px-3">Selling Price</th>
                <th className="py-3 px-3 text-center">POS Price</th>
                <th className="py-3 px-3 text-center">PWA Price</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-center">Items / Carton</th>
                <th className="py-3 px-3 text-center">Total Weight (ml)</th>
                <th className="py-3 px-3 text-center">Visibility</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody
              className={`divide-y transition-colors ${
                isDark ? 'divide-zinc-800/80 text-zinc-200' : 'divide-slate-100 text-slate-800'
              }`}
            >
              {filteredProducts.map((group) => {
                const isExpanded = !!expandedGroups[group.id];

                return (
                  <React.Fragment key={group.id}>
                    {/* Top Group Row */}
                    <tr
                      className={`transition-colors ${
                        isDark
                          ? `hover:bg-zinc-800/50 ${isExpanded ? 'bg-zinc-950/60' : 'bg-transparent'}`
                          : `hover:bg-blue-50/30 ${isExpanded ? 'bg-slate-50/60' : 'bg-white'}`
                      }`}
                    >
                      {/* 1. Product Name */}
                      <td className="py-3 px-4">
                        {group.hasVariants ? (
                          <div
                            onClick={() => toggleGroup(group.id)}
                            className="cursor-pointer group flex items-start gap-2"
                          >
                            <button
                              className={`mt-0.5 transition ${
                                isDark
                                  ? 'text-zinc-500 group-hover:text-blue-400'
                                  : 'text-slate-400 group-hover:text-blue-600'
                              }`}
                              title="Toggle Variants"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-blue-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-bold transition ${
                                    isDark
                                      ? 'text-zinc-100 group-hover:text-blue-400'
                                      : 'text-slate-900 group-hover:text-blue-600'
                                  }`}
                                >
                                  {group.name}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                    isDark
                                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                      : 'bg-slate-100 border-slate-200 text-slate-600'
                                  }`}
                                >
                                  {group.variants?.length || 0} variants
                                </span>
                              </div>
                              <div
                                className={`text-[10px] mt-0.5 font-normal ${
                                  isDark ? 'text-zinc-500' : 'text-slate-400'
                                }`}
                              >
                                Click to view all variants
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="pl-6">
                            <div className="font-bold text-blue-500 hover:underline cursor-pointer">
                              {group.name}
                            </div>
                            <div
                              className={`text-[10px] font-mono mt-0.5 ${
                                isDark ? 'text-zinc-500' : 'text-slate-400'
                              }`}
                            >
                              {group.sku}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 2. Category */}
                      <td
                        className={`py-3 px-3 font-medium uppercase text-[11px] ${
                          isDark ? 'text-zinc-400' : 'text-slate-500'
                        }`}
                      >
                        {group.category}
                      </td>

                      {/* 3. Brand */}
                      <td
                        className={`py-3 px-3 font-medium text-[11px] ${
                          isDark ? 'text-zinc-300' : 'text-slate-600'
                        }`}
                      >
                        {group.brand}
                      </td>

                      {/* 4. Cost Price */}
                      <td
                        className={`py-3 px-3 font-mono text-[11px] ${
                          isDark ? 'text-zinc-400' : 'text-slate-600'
                        }`}
                      >
                        {group.hasVariants
                          ? group.costPriceRange || '-'
                          : group.costPrice
                          ? `Rp ${group.costPrice.toLocaleString('id-ID')}`
                          : '-'}
                      </td>

                      {/* 5. Selling Price */}
                      <td
                        className={`py-3 px-3 font-mono text-[11px] font-semibold ${
                          isDark ? 'text-zinc-100' : 'text-slate-800'
                        }`}
                      >
                        {group.hasVariants
                          ? group.sellPriceRange || '-'
                          : group.sellPrice
                          ? `Rp ${group.sellPrice.toLocaleString('id-ID')}`
                          : '-'}
                      </td>

                      {/* 6. POS Cashier Price */}
                      <td className="py-3 px-3 text-center">
                        {!group.hasVariants && group.posPrice !== undefined ? (
                          <input
                            type="number"
                            defaultValue={group.posPrice}
                            onBlur={(e) =>
                              handleUpdatePosPrice(group.id, null, Number(e.target.value))
                            }
                            className={`w-20 px-2 py-1 text-center font-mono text-xs rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs ${
                              isDark
                                ? 'bg-zinc-950 border-zinc-700 text-zinc-100'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        ) : null}
                      </td>

                      {/* 7. PWA Online Price */}
                      <td className="py-3 px-3 text-center">
                        {!group.hasVariants && group.pwaPrice !== undefined ? (
                          <input
                            type="number"
                            defaultValue={group.pwaPrice}
                            onBlur={(e) =>
                              handleUpdatePwaPrice(group.id, null, Number(e.target.value))
                            }
                            className={`w-20 px-2 py-1 text-center font-mono text-xs rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs ${
                              isDark
                                ? 'bg-zinc-950 border-zinc-700 text-zinc-100'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        ) : null}
                      </td>

                      {/* 8. Stock */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-bold text-xs ${
                            group.totalStock === 0
                              ? 'text-rose-500 font-black'
                              : group.totalStock <= 5
                              ? 'text-amber-500'
                              : isDark
                              ? 'text-emerald-400'
                              : 'text-slate-900'
                          }`}
                        >
                          {group.totalStock}
                        </span>
                      </td>

                      {/* 9. Items / Carton */}
                      <td
                        className={`py-3 px-3 text-center font-mono ${
                          isDark ? 'text-zinc-400' : 'text-slate-500'
                        }`}
                      >
                        {group.hasVariants ? '' : group.itemsPerCarton || 1}
                      </td>

                      {/* 10. Total Weight */}
                      <td
                        className={`py-3 px-3 text-center font-mono ${
                          isDark ? 'text-zinc-400' : 'text-slate-500'
                        }`}
                      >
                        {group.hasVariants ? '' : `${group.weightMl || 0} ml`}
                      </td>

                      {/* 11. Visibility */}
                      <td className="py-3 px-3 text-center">
                        {!group.hasVariants && (
                          <div className="flex items-center justify-center gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white uppercase">
                              ACTIVE
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                                isDark
                                  ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              POS
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                                isDark
                                  ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              PWA
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 12. Action Menu */}
                      <td className="py-3 px-4 text-right relative">
                        <button
                          onClick={() =>
                            setActiveDropdownId(activeDropdownId === group.id ? null : group.id)
                          }
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            isDark
                              ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                          title="Action Menu"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdownId === group.id && (
                          <div
                            className={`absolute right-4 top-10 w-44 rounded-xl border shadow-xl z-20 py-1 text-left text-xs animate-in fade-in ${
                              isDark
                                ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                setEditingGroup(group);
                              }}
                              className={`w-full px-3 py-2 flex items-center gap-2 cursor-pointer ${
                                isDark
                                  ? 'hover:bg-zinc-800 hover:text-blue-400'
                                  : 'hover:bg-blue-50 hover:text-blue-600'
                              }`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit Details
                            </button>
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                setAdjustingStockGroup(group);
                              }}
                              className={`w-full px-3 py-2 flex items-center gap-2 cursor-pointer ${
                                isDark
                                  ? 'hover:bg-zinc-800 hover:text-blue-400'
                                  : 'hover:bg-blue-50 hover:text-blue-600'
                              }`}
                            >
                              <Package className="w-3.5 h-3.5" />
                              Stock Adjustment
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(group.id)}
                              className={`w-full px-3 py-2 flex items-center gap-2 text-rose-500 cursor-pointer ${
                                isDark ? 'hover:bg-rose-950/40' : 'hover:bg-rose-50'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Product
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* SUB-VARIANTS EXPANDED ROWS */}
                    {group.hasVariants &&
                      isExpanded &&
                      group.variants?.map((v) => (
                        <tr
                          key={v.id}
                          className={`text-xs transition-colors border-t ${
                            isDark
                              ? 'bg-zinc-950/70 border-zinc-800/80 hover:bg-zinc-800/40 text-zinc-300'
                              : 'bg-slate-50/70 border-slate-100 hover:bg-blue-50/20 text-slate-700'
                          }`}
                        >
                          {/* Variant Name & SKU */}
                          <td className="py-2.5 px-4 pl-12">
                            <div className="font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span className={isDark ? 'text-zinc-200' : 'text-slate-800'}>
                                {v.name}
                              </span>
                            </div>
                            <div
                              className={`text-[10px] font-mono mt-0.5 pl-3 ${
                                isDark ? 'text-zinc-500' : 'text-slate-400'
                              }`}
                            >
                              SKU: {v.sku}
                            </div>
                          </td>

                          {/* Category */}
                          <td
                            className={`py-2.5 px-3 uppercase text-[10px] ${
                              isDark ? 'text-zinc-400' : 'text-slate-400'
                            }`}
                          >
                            {v.category}
                          </td>

                          {/* Brand */}
                          <td
                            className={`py-2.5 px-3 text-[10px] ${
                              isDark ? 'text-zinc-400' : 'text-slate-500'
                            }`}
                          >
                            {v.brand}
                          </td>

                          {/* Cost Price */}
                          <td
                            className={`py-2.5 px-3 font-mono text-[11px] ${
                              isDark ? 'text-zinc-400' : 'text-slate-600'
                            }`}
                          >
                            Rp {v.costPrice.toLocaleString('id-ID')}
                          </td>

                          {/* Selling Price */}
                          <td
                            className={`py-2.5 px-3 font-mono text-[11px] font-medium ${
                              isDark ? 'text-zinc-200' : 'text-slate-800'
                            }`}
                          >
                            Rp {v.sellPrice.toLocaleString('id-ID')}
                          </td>

                          {/* POS Price */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              defaultValue={v.posPrice}
                              onBlur={(e) =>
                                handleUpdatePosPrice(group.id, v.id, Number(e.target.value))
                              }
                              className={`w-20 px-2 py-1 text-center font-mono text-xs rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs ${
                                isDark
                                  ? 'bg-zinc-950 border-zinc-700 text-zinc-100'
                                  : 'bg-white border-slate-200 text-slate-800'
                              }`}
                            />
                          </td>

                          {/* PWA Price */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              defaultValue={v.pwaPrice}
                              onBlur={(e) =>
                                handleUpdatePwaPrice(group.id, v.id, Number(e.target.value))
                              }
                              className={`w-20 px-2 py-1 text-center font-mono text-xs rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs ${
                                isDark
                                  ? 'bg-zinc-950 border-zinc-700 text-zinc-100'
                                  : 'bg-white border-slate-200 text-slate-800'
                              }`}
                            />
                          </td>

                          {/* Stock */}
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`font-bold text-xs ${
                                v.stock === 0
                                  ? 'text-rose-500 font-black'
                                  : v.stock <= 5
                                  ? 'text-amber-500'
                                  : isDark
                                  ? 'text-emerald-400'
                                  : 'text-slate-800'
                              }`}
                            >
                              {v.stock}
                            </span>
                          </td>

                          {/* Items / Carton */}
                          <td
                            className={`py-2.5 px-3 text-center font-mono ${
                              isDark ? 'text-zinc-400' : 'text-slate-500'
                            }`}
                          >
                            {v.itemsPerCarton}
                          </td>

                          {/* Total Weight */}
                          <td
                            className={`py-2.5 px-3 text-center font-mono ${
                              isDark ? 'text-zinc-400' : 'text-slate-500'
                            }`}
                          >
                            {v.weightMl} ml
                          </td>

                          {/* Visibility */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white uppercase">
                                ACTIVE
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                                  isDark
                                    ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                POS
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                                  isDark
                                    ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                PWA
                              </span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => setEditingGroup(group)}
                              className={`p-1 rounded transition cursor-pointer ${
                                isDark
                                  ? 'text-zinc-400 hover:text-blue-400 hover:bg-zinc-800'
                                  : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
                              }`}
                              title="Edit Variant"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: PAKET PRODUK (Konversi Dus / Karton, Grosir, & Bundling Multi-Pack) */}
      {/* ========================================================================= */}
      {activeTab === 'paket' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Header & KPI Summary */}
          <div
            className={`rounded-2xl p-6 border shadow-sm transition-colors ${
              isDark
                ? 'bg-zinc-900/95 border-zinc-800 text-zinc-200'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-zinc-800/40">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-500" />
                  <span>Paket Produk (Manajemen Dus, Karton &amp; Grosir)</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Kelola kemasan dus/karton, rasio isi per karton, dan harga jual grosir paket untuk toko ritel &amp; PWA.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('add_product')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Paket Dus Baru</span>
                </button>
              </div>
            </div>

            {/* KPI Cards for Packages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-zinc-400 font-medium">SKU Paket Dus</div>
                  <div className="text-lg font-bold text-white">
                    {products.reduce((acc, p) => acc + (p.variants || []).filter((v) => v.itemsPerCarton >= 1).length, 0)} Paket
                  </div>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-zinc-400 font-medium">Total Stok Karton Siap</div>
                  <div className="text-lg font-bold text-blue-400 font-mono">
                    {products.reduce((acc, p) => {
                      const v = p.variants?.[0];
                      const ipc = v?.itemsPerCarton || 24;
                      return acc + Math.floor((p.totalStock || 0) / ipc);
                    }, 0)} Karton
                  </div>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-zinc-400 font-medium">Rata-rata Diskon Dus</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">~10% Lebih Hemat</div>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-zinc-400 font-medium">Margin Rata-rata Dus</div>
                  <div className="text-lg font-bold text-purple-400 font-mono">18.5% Laba Kotor</div>
                </div>
              </div>
            </div>
          </div>

          {/* Table: Paket Produk & Detail Dus */}
          <div
            className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
              isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="p-4 border-b border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-amber-500" />
                Daftar Paket Dus / Karton Terdaftar
              </span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-[11px]">Filter Kategori:</span>
                <select
                  value={packageCategoryFilter}
                  onChange={(e) => setPackageCategoryFilter(e.target.value)}
                  className={`px-2.5 py-1 rounded-lg border text-xs ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="MINERAL">MINERAL</option>
                  <option value="FLAVORED">FLAVORED</option>
                  <option value="COLA">COLA</option>
                  <option value="GAS">GAS</option>
                  <option value="COFFEE">COFFEE</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`font-bold uppercase text-[10px] tracking-wider border-b whitespace-nowrap ${
                      isDark ? 'bg-zinc-950/70 text-zinc-400 border-zinc-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <th className="py-3 px-4">Nama Produk Paket</th>
                    <th className="py-3 px-3">Kategori &amp; Brand</th>
                    <th className="py-3 px-3 text-center">Isi Satuan (Pcs)</th>
                    <th className="py-3 px-3 text-center">Berat / Dus</th>
                    <th className="py-3 px-3 text-right">Modal per Dus</th>
                    <th className="py-3 px-3 text-right">Harga Grosir Dus</th>
                    <th className="py-3 px-3 text-right">Nilai Eceran Satuan</th>
                    <th className="py-3 px-3 text-center">Hemat Pembeli</th>
                    <th className="py-3 px-3 text-center">Stok Dus Gudang</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-zinc-800/80 text-zinc-200' : 'divide-slate-100 text-slate-800'}`}>
                  {products
                    .filter((p) => packageCategoryFilter === 'ALL' || p.category.toUpperCase() === packageCategoryFilter)
                    .map((p) => {
                      const v = p.variants?.[0] || {
                        id: p.id,
                        sku: p.sku,
                        name: p.name,
                        category: p.category,
                        brand: p.brand,
                        costPrice: 20000,
                        sellPrice: 25000,
                        posPrice: 25000,
                        pwaPrice: 25000,
                        stock: p.totalStock,
                        itemsPerCarton: p.itemsPerCarton || 24,
                        weightMl: p.weightMl || 600,
                        isActive: true,
                        isPosVisible: true,
                        isPwaVisible: true,
                      };

                      const itemsInCarton = v.itemsPerCarton || 24;
                      const cartonCost = v.costPrice * itemsInCarton;
                      const retailTotal = v.sellPrice * itemsInCarton;
                      // Calculated wholesale price with approx 8%-12% carton wholesale discount
                      const wholesaleCartonPrice = Math.round((retailTotal * 0.9) / 1000) * 1000;
                      const savingsAmount = retailTotal - wholesaleCartonPrice;
                      const savingsPercent = retailTotal > 0 ? ((savingsAmount / retailTotal) * 100).toFixed(0) : '0';
                      const stockCartons = Math.floor(p.totalStock / itemsInCarton);

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-zinc-800/30 transition-colors ${
                            isDark ? '' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{p.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                                Dus
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">SKU: {p.sku}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold text-[10px]">
                              {p.category}
                            </span>
                            <div className="text-[10px] text-zinc-500 mt-0.5">{p.brand || 'Umum'}</div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold font-mono text-amber-400">
                              {itemsInCarton} pcs
                            </span>
                            <span className="text-[10px] text-zinc-500 block">per Dus</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-zinc-400">
                            {((v.weightMl * itemsInCarton) / 1000).toFixed(1)} kg
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-zinc-400">
                            Rp {cartonCost.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-amber-400 text-sm">
                            Rp {wholesaleCartonPrice.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-zinc-500 line-through">
                            Rp {retailTotal.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                              Hemat Rp {savingsAmount.toLocaleString('id-ID')} ({savingsPercent}%)
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                                stockCartons > 5
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-400'
                              }`}
                            >
                              {stockCartons} Dus
                            </span>
                            <span className="text-[10px] text-zinc-500 block">
                              ({p.totalStock} pcs fisik)
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setEditingGroup(p);
                                showToast(`Edit paket "${p.name}"`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer"
                            >
                              Ubah Paket
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: KATEGORI DAN BRAND (Manajemen Kategori Barang, Produsen & Merek)   */}
      {/* ========================================================================= */}
      {activeTab === 'kategori' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Section 1: Kategori Barang */}
          <div
            className={`rounded-2xl p-6 border shadow-sm space-y-4 transition-colors ${
              isDark ? 'bg-zinc-900/95 border-zinc-800 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-zinc-800/40">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-400" />
                  <span>Kategori Produk &amp; Kelompok Barang</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Kelompok kategori barang untuk pengelompokan POS Terminal Kasir dan etalase PWA Pelanggan.
                </p>
              </div>

              <button
                onClick={() => {
                  showToast('Kategori baru siap diisi saat Tambah Produk');
                  setViewMode('add_product');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                + Tambah Kategori
              </button>
            </div>

            {/* Grid Kartu Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {[
                { key: 'MINERAL', name: 'Air Mineral & Galon', icon: '💧', color: 'from-blue-600/20 to-cyan-600/20', border: 'border-blue-500/30' },
                { key: 'FLAVORED', name: 'Minuman Berperisa & Teh', icon: '🧃', color: 'from-amber-600/20 to-orange-600/20', border: 'border-amber-500/30' },
                { key: 'COLA', name: 'Minuman Soda & Kola', icon: '🥤', color: 'from-rose-600/20 to-red-600/20', border: 'border-rose-500/30' },
                { key: 'GAS', name: 'LPG 3Kg & Gas Melon', icon: '🔥', color: 'from-emerald-600/20 to-green-600/20', border: 'border-emerald-500/30' },
                { key: 'COFFEE', name: 'Kopi Siap Minum & Bubuk', icon: '☕', color: 'from-amber-800/20 to-yellow-800/20', border: 'border-amber-700/30' },
                { key: 'SNACK', name: 'Makanan Ringan & Biskuit', icon: '🍿', color: 'from-orange-600/20 to-yellow-600/20', border: 'border-orange-500/30' },
                { key: 'DAIRY', name: 'Susu & Olahan Susu', icon: '🥛', color: 'from-indigo-600/20 to-blue-600/20', border: 'border-indigo-500/30' },
                { key: 'INSTANT_FOOD', name: 'Mie Instan & Cepat Saji', icon: '🍜', color: 'from-yellow-600/20 to-amber-600/20', border: 'border-yellow-500/30' },
                { key: 'OTHER', name: 'Kategori Lainnya', icon: '📦', color: 'from-zinc-700/20 to-zinc-800/20', border: 'border-zinc-700/30' },
              ].map((cat) => {
                const countSku = products.filter((p) => p.category.toUpperCase().includes(cat.key)).length;
                const totalStock = products
                  .filter((p) => p.category.toUpperCase().includes(cat.key))
                  .reduce((sum, p) => sum + (p.totalStock || 0), 0);

                return (
                  <div
                    key={cat.key}
                    className={`p-4 rounded-xl border bg-gradient-to-br ${cat.color} ${cat.border} flex flex-col justify-between space-y-3 transition hover:scale-[1.01]`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                        {countSku} SKU
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-white text-sm">{cat.name}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Total Stok Fisik: <span className="font-mono text-white font-bold">{totalStock} pcs</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSearchTerm(cat.key);
                        setActiveTab('list');
                        showToast(`Menampilkan produk kategori ${cat.key}`);
                      }}
                      className="w-full py-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <span>Lihat Produk</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Brand / Produsen / Manufaktur */}
          <div
            className={`rounded-2xl p-6 border shadow-sm space-y-4 transition-colors ${
              isDark ? 'bg-zinc-900/95 border-zinc-800 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-zinc-800/40">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Store className="w-5 h-5 text-blue-400" />
                  <span>Daftar Brand, Merek &amp; Produsen</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Produsen dan distributor pemasok barang utama ke toko ritel.
                </p>
              </div>

              <button
                onClick={() => {
                  showToast('Brand baru siap diisi di form Tambah Produk');
                  setViewMode('add_product');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                + Tambah Brand
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { name: 'Danone Aqua', tag: 'Principal Air Mineral', count: 3, verified: true },
                { name: 'Le Minerale (Mayora)', tag: 'Principal Minuman Botol', count: 2, verified: true },
                { name: 'Pertamina Mitra Gas', tag: 'Agen Resmi LPG 3Kg', count: 2, verified: true },
                { name: 'Wings Group (Floridina)', tag: 'Minuman Berperisa Buah', count: 2, verified: true },
                { name: 'Sosro (Teh Botol)', tag: 'Principal Minuman Teh', count: 2, verified: true },
                { name: 'Indofood Sukses Makmur', tag: 'Mie & Biskuit Instan', count: 3, verified: true },
                { name: 'Good Day Coffee', tag: 'Kopi Strip & Can Carton', count: 2, verified: true },
                { name: 'Coca-Cola Bottling ID', tag: 'Minuman Soda & Cola', count: 2, verified: true },
              ].map((brand) => (
                <div
                  key={brand.name}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-2.5 transition ${
                    isDark ? 'bg-zinc-950/70 border-zinc-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{brand.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Pemasok Aktif" />
                  </div>
                  <div className="text-[11px] text-zinc-400">{brand.tag}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40 text-[11px]">
                    <span className="text-zinc-500">{brand.count} Varian Terdaftar</span>
                    <button
                      onClick={() => {
                        setSearchTerm(brand.name.split(' ')[0]);
                        setActiveTab('list');
                        showToast(`Filter produk ${brand.name}`);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                    >
                      Filter &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: HARGA DISKON (Matriks Diskon Grosir, PWA Member & Simulasi Margin) */}
      {/* ========================================================================= */}
      {activeTab === 'harga_diskon' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Banner KPI */}
          <div
            className={`rounded-2xl p-6 border shadow-sm transition-colors ${
              isDark ? 'bg-zinc-900/95 border-zinc-800 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-zinc-800/40">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Percent className="w-5 h-5 text-emerald-400" />
                  <span>Pengaturan Harga Diskon &amp; Matriks Promo</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Kelola potongan harga khusus grosir per dus, diskon member PWA otomatis (5%), dan simulasi margin kasir.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Promo Otomatis Aktif</span>
                </span>
              </div>
            </div>

            {/* 3 Active Discount Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4 text-xs">
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-purple-950/20 border-purple-800/40 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm">Diskon Member PWA</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white font-black text-[10px]">5% OFF</span>
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  Semua transaksi melalui Client PWA dengan nomor handphone terdaftar otomatis mendapatkan potongan harga 5%.
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm">Diskon Grosir Karton</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-black text-[10px]">~10% Hemat</span>
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  Pembelian dalam jumlah dus/karton mendapatkan harga grosir langsung lebih murah dibanding membeli satuan eceran.
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm">Proteksi Margin Toko</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 font-black text-[10px]">&gt; 18% Aman</span>
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  Sistem otomatis menjaga harga jual promo agar tidak pernah berada di bawah harga modal (COGS).
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Pricing Matrix Table */}
          <div
            className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
              isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-400" />
                Matriks Komparasi Harga Normal vs Diskon Member &amp; Grosir
              </span>
              <span className="text-[11px] text-zinc-400">Sinkron dengan Database POS</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`font-bold uppercase text-[10px] tracking-wider border-b whitespace-nowrap ${
                      isDark ? 'bg-zinc-950/70 text-zinc-400 border-zinc-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <th className="py-3 px-4">Nama Produk &amp; SKU</th>
                    <th className="py-3 px-3 text-right">Modal HPP (Rp)</th>
                    <th className="py-3 px-3 text-right">Harga Normal POS</th>
                    <th className="py-3 px-3 text-right">Harga Member PWA (-5%)</th>
                    <th className="py-3 px-3 text-right">Harga Grosir Dus</th>
                    <th className="py-3 px-3 text-center">Diskon Hemat Dus</th>
                    <th className="py-3 px-3 text-center">Margin Laba Toko</th>
                    <th className="py-3 px-4 text-center">Status Promo</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-zinc-800/80 text-zinc-200' : 'divide-slate-100 text-slate-800'}`}>
                  {products.slice(0, 8).map((p) => {
                    const v = p.variants?.[0] || {
                      costPrice: 20000,
                      sellPrice: 25000,
                      pwaPrice: 23750,
                      itemsPerCarton: 24,
                    };
                    const itemsInCarton = v.itemsPerCarton || 24;
                    const retailTotal = v.sellPrice * itemsInCarton;
                    const wholesaleCarton = Math.round((retailTotal * 0.9) / 1000) * 1000;
                    const pwaDiscounted = Math.round(v.sellPrice * 0.95);
                    const marginPercent = v.sellPrice > 0 ? (((v.sellPrice - v.costPrice) / v.sellPrice) * 100).toFixed(1) : '0';

                    return (
                      <tr key={p.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">{p.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">SKU: {p.sku}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-zinc-400">
                          Rp {v.costPrice.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          Rp {v.sellPrice.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-purple-400">
                          Rp {pwaDiscounted.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                          Rp {wholesaleCarton.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                            Hemat 10% / Dus
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                          {marginPercent}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                            Aktif
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Discount Simulator for Cashier/Manager */}
          <div
            className={`rounded-2xl p-6 border shadow-sm space-y-4 transition-colors ${
              isDark ? 'bg-zinc-900/95 border-zinc-800 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-zinc-800/40">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Simulasi &amp; Kalkulator Diskon Kasir Real-Time
                </h4>
              </div>
              <span className="text-[11px] text-zinc-400">Uji coba simulasi checkout berdiskon</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5">Pilih Produk:</label>
                <select
                  value={simProductSku}
                  onChange={(e) => setSimProductSku(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.sku}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5">Jumlah Pembelian:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={simQty}
                  onChange={(e) => setSimQty(Math.max(1, Number(e.target.value)))}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5">Kemasan:</label>
                <select
                  value={simUnitType}
                  onChange={(e) => setSimUnitType(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="carton">Dus / Karton (Diskon Grosir)</option>
                  <option value="unit">Satuan Pcs (Harga Eceran)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5">Tipe Pelanggan:</label>
                <select
                  value={simCustomerType}
                  onChange={(e) => setSimCustomerType(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="pwa_member">Member VIP PWA (Diskon 5%)</option>
                  <option value="regular">Pelanggan Umum (Tanpa Member)</option>
                </select>
              </div>
            </div>

            {/* Live Calculation Output Card */}
            {(() => {
              const selectedP = products.find((p) => p.sku === simProductSku) || products[0];
              const v = selectedP?.variants?.[0] || {
                costPrice: selectedP?.costPrice ?? 0,
                sellPrice: selectedP?.sellPrice ?? 0,
                itemsPerCarton: selectedP?.itemsPerCarton ?? 1,
              };

              const itemsInCarton = v.itemsPerCarton || 1;
              const unitPrice = v.sellPrice;
              const regularTotal =
                simUnitType === 'carton' ? unitPrice * itemsInCarton * simQty : unitPrice * simQty;

              const cogsTotal =
                simUnitType === 'carton' ? v.costPrice * itemsInCarton * simQty : v.costPrice * simQty;

              // Discounts
              const cartonDiscount =
                simUnitType === 'carton' ? Math.round(regularTotal * 0.1) : 0; // 10% wholesale discount
              const afterCarton = regularTotal - cartonDiscount;

              const memberDiscount =
                simCustomerType === 'pwa_member' ? Math.round(afterCarton * 0.05) : 0; // 5% member discount

              const finalTotal = afterCarton - memberDiscount;
              const totalDiscountGiven = cartonDiscount + memberDiscount;
              const netProfit = finalTotal - cogsTotal;
              const profitMargin = finalTotal > 0 ? ((netProfit / finalTotal) * 100).toFixed(1) : '0';

              return (
                <div
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDark ? 'bg-zinc-950/80 border-emerald-900/50' : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-400">Hasil Simulasi Tagihan:</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black font-mono text-emerald-400">
                        Rp {finalTotal.toLocaleString('id-ID')}
                      </span>
                      {totalDiscountGiven > 0 && (
                        <span className="text-xs text-zinc-500 line-through font-mono">
                          Rp {regularTotal.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Diskon yang didapat pembeli:{' '}
                      <span className="text-emerald-400 font-bold">
                        Rp {totalDiscountGiven.toLocaleString('id-ID')}
                      </span>{' '}
                      {simUnitType === 'carton' && '(Grosir Dus)'}{' '}
                      {simCustomerType === 'pwa_member' && '+ (Member 5%)'}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-zinc-800/80 pt-3 md:pt-0 md:pl-6 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Total Modal Toko (COGS)</span>
                      <span className="font-mono font-bold text-white">
                        Rp {cogsTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Laba Bersih Toko</span>
                      <span className="font-mono font-bold text-emerald-400">
                        Rp {netProfit.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Margin Bersih</span>
                      <span className="font-mono font-bold text-amber-400">{profitMargin}%</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ADDITIONAL SUB-PANELS (STOCK IN, STOCK OUT, AUDIT, MOVEMENT, LOW STOCK) */}
      {activeTab === 'masuk' && (
        <div
          className={`rounded-2xl p-6 border shadow-sm space-y-4 transition-colors ${
            isDark
              ? 'bg-zinc-900/95 border-zinc-800 text-zinc-200'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b border-zinc-800/40 pb-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                Stock In Records (Inbound Supply)
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Receipt history from distributors / suppliers and carton breakdown.
              </p>
            </div>
            <button
              onClick={() => setIsStockInModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              + Record Stock In
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className={`font-bold uppercase text-[10px] border-b ${
                    isDark
                      ? 'bg-zinc-950/60 text-zinc-400 border-zinc-800'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  <th className="py-2.5 px-3">Delivery Order No.</th>
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  <th className="py-2.5 px-3">Product / Carton</th>
                  <th className="py-2.5 px-3">Quantity In</th>
                  <th className="py-2.5 px-3">Supplier / Distributor</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-zinc-800/80' : 'divide-slate-100'}`}>
                {stockInRecords.map((rec) => (
                  <tr key={rec.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-500">{rec.id}</td>
                    <td className={`py-2.5 px-3 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {rec.date}
                    </td>
                    <td className={`py-2.5 px-3 font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-800'}`}>
                      {rec.product}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-500">+{rec.qty} Cartons</td>
                    <td className={`py-2.5 px-3 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                      {rec.supplier}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'keluar' && (
        <div
          className={`rounded-2xl p-6 border shadow-sm space-y-4 transition-colors ${
            isDark
              ? 'bg-zinc-900/95 border-zinc-800 text-zinc-200'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b border-zinc-800/40 pb-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-500" />
                Stock Out Records (Outbound &amp; Dispensed)
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Logs of store carton dispatches, wholesale sales, and damaged units written off.
              </p>
            </div>
            <button
              onClick={() => setIsStockOutModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              + Record Stock Out
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className={`font-bold uppercase text-[10px] border-b ${
                    isDark
                      ? 'bg-zinc-950/60 text-zinc-400 border-zinc-800'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  <th className="py-2.5 px-3">Dispatch Code</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Product Item</th>
                  <th className="py-2.5 px-3">Quantity Out</th>
                  <th className="py-2.5 px-3">Destination / Reason</th>
                  <th className="py-2.5 px-3">Auditor</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-zinc-800/80' : 'divide-slate-100'}`}>
                {stockOutRecords.map((rec) => (
                  <tr key={rec.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-500">{rec.id}</td>
                    <td className={`py-2.5 px-3 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{rec.date}</td>
                    <td className={`py-2.5 px-3 font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-800'}`}>{rec.product}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-500">-{rec.qty} Units</td>
                    <td className={`py-2.5 px-3 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{rec.dest}</td>
                    <td className="py-2.5 px-3">Petugas Gudang</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'opname' && (
        <div
          className={`rounded-2xl p-6 border shadow-sm space-y-4 transition-colors ${
            isDark
              ? 'bg-zinc-900/95 border-zinc-800 text-zinc-200'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b border-zinc-800/40 pb-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-500" />
                Physical Stock Audit & Opname
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                System vs physical warehouse count reconciliation to prevent inventory shrinkage.
              </p>
            </div>
            <button
              onClick={() => showToast('New Stock Audit Session Started')}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              + Start Stock Audit
            </button>
          </div>

          <div
            className={`p-4 rounded-xl border text-xs space-y-1 ${
              isDark
                ? 'bg-blue-950/30 border-blue-800/50 text-blue-200'
                : 'bg-blue-50/80 border-blue-100 text-blue-900'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Last Audit Status:
            </div>
            <p className={isDark ? 'text-blue-300' : 'text-blue-800'}>
              All 118 product variants verified. Warehouse inventory accuracy recorded at 99.4%.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'pergerakan' && (
        <div
          className={`rounded-2xl p-6 border shadow-sm space-y-4 transition-colors ${
            isDark
              ? 'bg-zinc-900/95 border-zinc-800 text-zinc-200'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b border-zinc-800/40 pb-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Real-Time Stock Movement Log
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Comprehensive ledger of every carton and bottle moving in and out of the warehouse.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <span className="font-bold text-blue-400">Aqua Carton 240ml Gelas</span>
                <div className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Stock Balance: 120 Cartons &bull; Velocity: Fast Moving (High Demand)
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                Healthy Supply
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <span className="font-bold text-blue-400">Gas LPG 3 Kg Melon</span>
                <div className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Stock Balance: 36 Tanks &bull; Velocity: Stable Daily Inflow
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                Active Flow
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'kritis' && (
        <div
          className={`rounded-2xl p-6 border shadow-sm space-y-4 transition-colors ${
            isDark
              ? 'bg-zinc-900/95 border-zinc-800 text-zinc-200'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b border-zinc-800/40 pb-3">
            <div>
              <h3 className="font-bold text-rose-500 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Critical &amp; Out of Stock List (Restock Recommended)
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Products below minimum threshold (5 units / cartons) at risk of missed POS and PWA sales.
              </p>
            </div>
            <button
              onClick={() => {
                handleDispatchRestock('Es Teler', 20);
                handleDispatchRestock('Good Day', 25);
                handleDispatchRestock('Aspen Mineral', 30);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              Auto-Generate Purchase Order (PO)
            </button>
          </div>

          <div className="space-y-2">
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                isDark
                  ? 'border-rose-900/60 bg-rose-950/30'
                  : 'border-rose-200 bg-rose-50/50'
              }`}
            >
              <div>
                <span className="font-bold text-rose-400">Es Teler Cup Carton (SKU: P046)</span>
                <div className="text-[11px] text-rose-300 mt-0.5">Current Stock: 0 Cartons &bull; Min. Stock: 10 Cartons</div>
              </div>
              <button
                onClick={() => handleDispatchRestock('Es Teler', 20)}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-xs cursor-pointer"
              >
                + Order 20 Cartons
              </button>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                isDark
                  ? 'border-rose-900/60 bg-rose-950/30'
                  : 'border-rose-200 bg-rose-50/50'
              }`}
            >
              <div>
                <span className="font-bold text-rose-400">Good Day Coffee (2 Variants)</span>
                <div className="text-[11px] text-rose-300 mt-0.5">Current Stock: 0 &bull; Min. Stock: 15 Cartons</div>
              </div>
              <button
                onClick={() => handleDispatchRestock('Good Day', 25)}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-xs cursor-pointer"
              >
                + Order 25 Cartons
              </button>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                isDark
                  ? 'border-amber-900/60 bg-amber-950/30'
                  : 'border-amber-200 bg-amber-50/50'
              }`}
            >
              <div>
                <span className="font-bold text-amber-400">Aspen Mineral (5 Variants)</span>
                <div className="text-[11px] text-amber-300 mt-0.5">Current Stock: 2 Cartons &bull; Running Critically Low</div>
              </div>
              <button
                onClick={() => handleDispatchRestock('Aspen Mineral', 30)}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-xs cursor-pointer"
              >
                + Order 30 Cartons
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW PRODUCT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 text-xs ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`flex items-center justify-between border-b pb-3 ${
                isDark ? 'border-zinc-800' : 'border-slate-100'
              }`}
            >
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  Add New Product
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Product details will automatically synchronize with POS Terminal and Client PWA.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aqua Carton 330ml"
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark
                        ? 'border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500'
                        : 'border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProductForm.sku}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border font-mono transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark
                        ? 'border-zinc-700 bg-zinc-950 text-zinc-100'
                        : 'border-slate-200 bg-slate-50 text-slate-800 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Category
                  </label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark
                        ? 'border-zinc-700 bg-zinc-950 text-zinc-100'
                        : 'border-slate-200 bg-slate-50 text-slate-800 focus:bg-white'
                    }`}
                  >
                    <option value="FLAVORED">FLAVORED</option>
                    <option value="MINERAL">MINERAL</option>
                    <option value="COLA">COLA</option>
                    <option value="GAS">GAS</option>
                    <option value="COFFEE">COFFEE</option>
                    <option value="SNACK">SNACK</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    placeholder="Brand Name"
                    value={newProductForm.brand}
                    onChange={(e) => setNewProductForm({ ...newProductForm, brand: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark
                        ? 'border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500'
                        : 'border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Cost Price (Rp)
                  </label>
                  <input
                    type="number"
                    value={newProductForm.costPrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, costPrice: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border font-mono transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark
                        ? 'border-zinc-700 bg-zinc-950 text-zinc-100'
                        : 'border-slate-200 bg-slate-50 text-slate-800 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Standard Selling Price (Rp)
                  </label>
                  <input
                    type="number"
                    value={newProductForm.sellPrice}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        sellPrice: Number(e.target.value),
                        posPrice: Number(e.target.value),
                        pwaPrice: Number(e.target.value),
                      })
                    }
                    className={`w-full px-3 py-2 rounded-lg border font-mono transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark
                        ? 'border-zinc-700 bg-zinc-950 text-zinc-100'
                        : 'border-slate-200 bg-slate-50 text-slate-800 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    POS Cashier Price (Rp)
                  </label>
                  <input
                    type="number"
                    value={newProductForm.posPrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, posPrice: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border font-mono transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark
                        ? 'border-zinc-700 bg-zinc-950 text-zinc-100'
                        : 'border-slate-200 bg-slate-50 text-slate-800 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    PWA Online Price (Rp)
                  </label>
                  <input
                    type="number"
                    value={newProductForm.pwaPrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, pwaPrice: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border font-mono transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark
                        ? 'border-zinc-700 bg-zinc-950 text-zinc-100'
                        : 'border-slate-200 bg-slate-50 text-slate-800 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={newProductForm.stock}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stock: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border font-mono transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark
                        ? 'border-zinc-700 bg-zinc-950 text-zinc-100'
                        : 'border-slate-200 bg-slate-50 text-slate-800 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Items / Carton
                  </label>
                  <input
                    type="number"
                    value={newProductForm.itemsPerCarton}
                    onChange={(e) => setNewProductForm({ ...newProductForm, itemsPerCarton: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border font-mono transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark
                        ? 'border-zinc-700 bg-zinc-950 text-zinc-100'
                        : 'border-slate-200 bg-slate-50 text-slate-800 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Weight (ml / g)
                  </label>
                  <input
                    type="number"
                    value={newProductForm.weightMl}
                    onChange={(e) => setNewProductForm({ ...newProductForm, weightMl: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border font-mono transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark
                        ? 'border-zinc-700 bg-zinc-950 text-zinc-100'
                        : 'border-slate-200 bg-slate-50 text-slate-800 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className={`flex gap-2 pt-2 border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`flex-1 py-2 rounded-xl font-semibold cursor-pointer ${
                    isDark
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
