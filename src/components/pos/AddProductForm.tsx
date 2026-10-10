import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Package,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Info,
  QrCode,
  RotateCcw,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  Boxes,
  Store,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Tag,
  Hash,
} from 'lucide-react';
import { ProductGroupItem, ProductVariantItem } from './ProductCartonManager';

interface AddProductFormProps {
  isDark: boolean;
  onBack: () => void;
  onSubmit: (product: ProductGroupItem) => void;
  onToggleTheme: (theme: 'dark' | 'light') => void;
  onSaveAndAddAnother?: (product: ProductGroupItem) => void;
}

export const AddProductForm: React.FC<AddProductFormProps> = ({
  isDark,
  onBack,
  onSubmit,
  onToggleTheme,
  onSaveAndAddAnother,
}) => {
  // Form fields: Informasi Dasar
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('P' + Math.floor(100 + Math.random() * 900));
  const [category, setCategory] = useState('MINERAL');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [description, setDescription] = useState('');

  // Preset Image selection
  const [selectedPresetImage, setSelectedPresetImage] = useState<string>('💧 Aqua Botol');

  // Form fields: Harga & Pajak
  const [costPrice, setCostPrice] = useState<number>(20000);
  const [sellPrice, setSellPrice] = useState<number>(25000);
  const [posPrice, setPosPrice] = useState<number>(25000);
  const [pwaPrice, setPwaPrice] = useState<number>(25000);
  const [taxMode, setTaxMode] = useState<'none' | 'ppn11' | 'inclusive'>('none');
  const [autoSyncPrices, setAutoSyncPrices] = useState(true);

  // Form fields: Stok & Konversi Dus / Karton
  const [trackStock, setTrackStock] = useState(true);
  const [stock, setStock] = useState<number>(50);
  const [minStock, setMinStock] = useState<number>(10);
  const [itemsPerCarton, setItemsPerCarton] = useState<number>(24);
  const [cartonWholesalePrice, setCartonWholesalePrice] = useState<number>(550000);
  const [weightMl, setWeightMl] = useState<number>(600);
  const [shelfLocation, setShelfLocation] = useState('Rak A-01');

  // Form fields: Visibilitas & Status
  const [isActive, setIsActive] = useState(true);
  const [isPosVisible, setIsPosVisible] = useState(true);
  const [isPwaVisible, setIsPwaVisible] = useState(true);

  // Variant toggle & list
  const [hasVariants, setHasVariants] = useState(false);
  const [variantsList, setVariantsList] = useState<ProductVariantItem[]>([
    {
      id: 'v_1',
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      name: 'Varian 1 (Regular)',
      category: 'MINERAL',
      brand: '',
      costPrice: 20000,
      sellPrice: 25000,
      posPrice: 25000,
      pwaPrice: 25000,
      stock: 30,
      itemsPerCarton: 24,
      weightMl: 600,
      isActive: true,
      isPosVisible: true,
      isPwaVisible: true,
    },
  ]);

  // Notifications inside form
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const showFlash = (msg: string) => {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(null), 3000);
  };

  // Profit calculation
  const profitPerUnit = sellPrice - costPrice;
  const marginPercent = sellPrice > 0 ? ((profitPerUnit / sellPrice) * 100).toFixed(1) : '0';

  // Handle Sell Price Change with Auto-Calculation
  const handleSellPriceChange = (val: number) => {
    setSellPrice(val);
    if (autoSyncPrices) {
      setPosPrice(val);
      setPwaPrice(val);
    }
  };

  // Generate random SKU
  const handleGenerateSku = () => {
    const generated = 'P' + Math.floor(100 + Math.random() * 900);
    setSku(generated);
    showFlash(`SKU Baru di-generate: ${generated}`);
  };

  // Add Variant item
  const handleAddVariant = () => {
    const newIndex = variantsList.length + 1;
    const newVariant: ProductVariantItem = {
      id: 'v_' + Date.now(),
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      name: `${productName ? productName + ' ' : ''}Varian ${newIndex}`,
      category: category,
      brand: brand,
      costPrice: costPrice,
      sellPrice: sellPrice,
      posPrice: posPrice,
      pwaPrice: pwaPrice,
      stock: 20,
      itemsPerCarton: itemsPerCarton,
      weightMl: weightMl,
      isActive: true,
      isPosVisible: true,
      isPwaVisible: true,
    };
    setVariantsList([...variantsList, newVariant]);
  };

  // Remove Variant
  const handleRemoveVariant = (id: string) => {
    if (variantsList.length <= 1) return;
    setVariantsList(variantsList.filter((v) => v.id !== id));
  };

  // Update specific variant field
  const handleUpdateVariantField = (
    id: string,
    field: keyof ProductVariantItem,
    value: string | number
  ) => {
    setVariantsList((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const updated = { ...v, [field]: value };
          if (field === 'sellPrice' && autoSyncPrices) {
            updated.posPrice = Number(value);
            updated.pwaPrice = Number(value);
          }
          return updated;
        }
        return v;
      })
    );
  };

  // Construct Product Item
  const buildProductObject = (): ProductGroupItem => {
    return {
      id: 'grp_' + Date.now(),
      name: productName,
      sku: sku || 'P' + Math.floor(100 + Math.random() * 900),
      category: category,
      brand: brand || productName,
      hasVariants: hasVariants,
      costPrice: costPrice,
      sellPrice: sellPrice,
      posPrice: posPrice,
      pwaPrice: pwaPrice,
      sellPriceRange: hasVariants ? `Rp ${sellPrice.toLocaleString('id-ID')}` : undefined,
      totalStock: hasVariants
        ? variantsList.reduce((acc, curr) => acc + curr.stock, 0)
        : stock,
      itemsPerCarton: itemsPerCarton,
      weightMl: weightMl,
      isActive: isActive,
      isPosVisible: isPosVisible,
      isPwaVisible: isPwaVisible,
      variants: hasVariants
        ? variantsList.map((v) => ({
            ...v,
            category: category,
            brand: brand || productName,
          }))
        : undefined,
    };
  };

  // Reset Form
  const handleResetForm = () => {
    setProductName('');
    setSku('P' + Math.floor(100 + Math.random() * 900));
    setBrand('');
    setDescription('');
    setCostPrice(20000);
    setSellPrice(25000);
    setPosPrice(25000);
    setPwaPrice(25000);
    setStock(50);
    setCartonWholesalePrice(550000);
    setWeightMl(600);
    setHasVariants(false);
    showFlash('Form berhasil di-reset!');
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      showFlash('Peringatan: Silakan isi Nama Produk terlebih dahulu!');
      return;
    }
    const newGroup = buildProductObject();
    onSubmit(newGroup);
  };

  // Save & Add Another Handler
  const handleSaveAndAnother = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      showFlash('Peringatan: Silakan isi Nama Produk terlebih dahulu!');
      return;
    }
    const newGroup = buildProductObject();
    if (onSaveAndAddAnother) {
      onSaveAndAddAnother(newGroup);
    } else {
      onSubmit(newGroup);
    }
    handleResetForm();
    showFlash(`Produk "${newGroup.name}" tersimpan! Siap menambah produk baru.`);
  };

  // Preset visuals
  const imagePresets = [
    { label: '💧 Aqua Botol', desc: 'Air Mineral 600ml / 1.5L' },
    { label: '📦 Aqua Dus', desc: 'Karton 240ml Gelas' },
    { label: '🔵 Aqua Galon', desc: 'Galon 19L Refill' },
    { label: '🍃 Teh Pucuk', desc: 'Teh Melati 350ml' },
    { label: '🥤 Coca-Cola', desc: 'Soft Drink 390ml' },
    { label: '🍈 Gas Melon 3Kg', desc: 'LPG Subsidi Melon' },
    { label: '☕ Good Day Kopi', desc: 'Kopi Botol & Sachet' },
    { label: '🍜 Indomie Goreng', desc: 'Mie Instan Dus/Pcs' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {flashMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-white" />
          <span>{flashMessage}</span>
        </div>
      )}

      {/* TOP HEADER - Matches image style: Title, Subtitle, Theme Toggle & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-500 border border-blue-500/30 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <h1
              className={`text-2xl font-black tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Tambah Produk
            </h1>
          </div>
          <p
            className={`text-xs mt-1 ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            Lengkapi formulir di bawah ini untuk menambahkan produk baru ke katalog POS Machine &amp; Toko Online PWA.
          </p>
        </div>

        {/* Action Controls: Theme Switcher & <- Kembali Button */}
        <div className="flex items-center gap-3">
          {/* Theme switcher */}
          <div
            className={`flex items-center p-1 rounded-xl border shadow-xs ${
              isDark
                ? 'bg-zinc-900 border-zinc-800'
                : 'bg-white border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => onToggleTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isDark
                  ? 'bg-zinc-800 text-white shadow-xs font-bold border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Dark Theme"
            >
              <Moon className="w-3.5 h-3.5 text-blue-400" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                !isDark
                  ? 'bg-slate-100 text-slate-900 shadow-xs font-bold border border-slate-200'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Light Theme"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
          </div>

          {/* <- Kembali Button */}
          <button
            type="button"
            onClick={onBack}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition shadow-xs cursor-pointer ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-200'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
        </div>
      </div>

      {/* MAIN FORM CONTAINER - Styled according to reference image with cards */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CARD 1: INFORMASI DASAR PRODUK */}
        <div
          className={`rounded-2xl border p-6 sm:p-7 space-y-5 shadow-sm transition-colors ${
            isDark
              ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 border-zinc-800/60">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Informasi Dasar Produk
              </h2>
            </div>
            <span className="text-[11px] text-zinc-400">
              Bagian 1 dari 4 &bull; Wajib diisi (*)
            </span>
          </div>

          {/* Row 1: Nama Produk & Barcode/SKU */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-zinc-300' : 'text-slate-700'
                }`}
              >
                Nama Produk <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Aqua 600ml Botol / Le Minerale Dus 24x600ml / Gas Melon 3Kg"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-zinc-300' : 'text-slate-700'
                  }`}
                >
                  Kode Barcode / SKU
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Acak SKU
                </button>
              </div>
              <div className="relative">
                <span
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs ${
                    isDark ? 'text-zinc-500' : 'text-slate-400'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-blue-500" />
                </span>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border font-mono text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-700 text-zinc-100'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Kategori, Brand, Unit Satuan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Kategori */}
            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-zinc-300' : 'text-slate-700'
                }`}
              >
                Kategori Produk
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-zinc-100 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500'
                }`}
              >
                <option value="MINERAL">MINERAL (Air Mineral)</option>
                <option value="FLAVORED">FLAVORED (Minuman Berperisa)</option>
                <option value="COLA">COLA (Minuman Soda)</option>
                <option value="GAS">GAS (LPG &amp; Tabung)</option>
                <option value="COFFEE">COFFEE (Kopi &amp; Minuman Susu)</option>
                <option value="SNACK">SNACK (Makanan Ringan)</option>
                <option value="DAIRY">DAIRY (Susu &amp; Olahan)</option>
                <option value="INSTANT_FOOD">INSTANT FOOD (Mie &amp; Cepat Saji)</option>
                <option value="OTHER">LAINNYA</option>
              </select>
            </div>

            {/* Brand / Merek */}
            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-zinc-300' : 'text-slate-700'
                }`}
              >
                Merek / Pabrik
              </label>
              <input
                type="text"
                placeholder="Contoh: Danone, Mayora, Wings, Pertamina"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500'
                }`}
              />
            </div>

            {/* Unit Satuan */}
            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-zinc-300' : 'text-slate-700'
                }`}
              >
                Satuan Jual
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-zinc-100 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500'
                }`}
              >
                <option value="Pcs">Pcs (Satuan Unit)</option>
                <option value="Botol">Botol</option>
                <option value="Dus / Karton">Dus / Karton</option>
                <option value="Cup">Cup / Gelas</option>
                <option value="Pack">Pack</option>
                <option value="Galon">Galon 19L</option>
                <option value="Tabung">Tabung Gas</option>
                <option value="Kg">Kilogram (Kg)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Deskripsi Produk */}
          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                isDark ? 'text-zinc-300' : 'text-slate-700'
              }`}
            >
              Deskripsi / Keterangan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Catatan detail produk, cara penyajian, syarat retur botol, dsb..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl border text-xs transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? 'bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500'
              }`}
            />
          </div>
        </div>

        {/* CARD 2: FOTO & VISUAL PRESET PRODUK */}
        <div
          className={`rounded-2xl border p-6 sm:p-7 space-y-4 shadow-sm transition-colors ${
            isDark
              ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 border-zinc-800/60">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Visual &amp; Foto Produk
              </h2>
            </div>
            <span className="text-[11px] text-zinc-400">Pilih Preset Cepat atau Ikon</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {imagePresets.map((preset) => {
              const isSelected = selectedPresetImage === preset.label;
              return (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setSelectedPresetImage(preset.label)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-600/15 text-white ring-2 ring-blue-500/30'
                      : isDark
                      ? 'border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/60 text-zinc-300'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{preset.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <span className={`text-[10px] mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    {preset.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CARD 3: HARGA, PAJAK & KALKULASI MARGIN */}
        <div
          className={`rounded-2xl border p-6 sm:p-7 space-y-5 shadow-sm transition-colors ${
            isDark
              ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 border-zinc-800/60">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Harga Jual, Modal &amp; Margin Laba
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-400">
              <Info className="w-3.5 h-3.5" />
              <span>POS &amp; PWA otomatis sinkron</span>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Modal */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                Harga Modal / Beli (Rp)
              </label>
              <div className="relative">
                <span
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold ${
                    isDark ? 'text-zinc-500' : 'text-slate-400'
                  }`}
                >
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border font-mono text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-700 text-zinc-100'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            {/* Jual */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                Harga Jual Standar (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold ${
                    isDark ? 'text-zinc-500' : 'text-slate-400'
                  }`}
                >
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={sellPrice}
                  onChange={(e) => handleSellPriceChange(Number(e.target.value))}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border font-mono text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-700 text-emerald-400'
                      : 'bg-slate-50 border-slate-200 text-emerald-700 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            {/* POS Price */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={`text-xs font-semibold ${
                    isDark ? 'text-zinc-400' : 'text-slate-600'
                  }`}
                >
                  Harga Kasir POS (Rp)
                </label>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.2 rounded">
                  Otomatis
                </span>
              </div>
              <div className="relative">
                <span
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold ${
                    isDark ? 'text-zinc-500' : 'text-slate-400'
                  }`}
                >
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={posPrice}
                  onChange={(e) => setPosPrice(Number(e.target.value))}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border font-mono text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-700 text-zinc-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>

            {/* PWA Price */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={`text-xs font-semibold ${
                    isDark ? 'text-zinc-400' : 'text-slate-600'
                  }`}
                >
                  Harga Online PWA (Rp)
                </label>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.2 rounded">
                  Otomatis
                </span>
              </div>
              <div className="relative">
                <span
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold ${
                    isDark ? 'text-zinc-500' : 'text-slate-400'
                  }`}
                >
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={pwaPrice}
                  onChange={(e) => setPwaPrice(Number(e.target.value))}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border font-mono text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-700 text-zinc-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>

            {/* Carton Wholesale Price */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={`text-xs font-semibold ${
                    isDark ? 'text-zinc-400' : 'text-slate-600'
                  }`}
                >
                  Harga Grosir per Dus (Rp)
                </label>
                <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded">
                  Dus / Karton
                </span>
              </div>
              <div className="relative">
                <span
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold ${
                    isDark ? 'text-zinc-500' : 'text-slate-400'
                  }`}
                >
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={cartonWholesalePrice}
                  onChange={(e) => setCartonWholesalePrice(Number(e.target.value))}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border font-mono text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-700 text-amber-400'
                      : 'bg-slate-50 border-slate-200 text-amber-700'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Live Profit Margin Calculator Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              profitPerUnit >= 0
                ? isDark
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : isDark
                ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="font-bold text-sm">
                  Keuntungan per Unit: Rp {profitPerUnit.toLocaleString('id-ID')}
                </span>
                <div className="text-[11px] opacity-80 mt-0.5">
                  Margin Laba Bersih: <span className="font-black font-mono">{marginPercent}%</span> &bull; Status:{' '}
                  {Number(marginPercent) >= 20 ? 'Margin Sangat Sehat' : Number(marginPercent) >= 10 ? 'Margin Sedang' : 'Margin Tipis'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold">Pengaturan Pajak:</span>
              <select
                value={taxMode}
                onChange={(e) => setTaxMode(e.target.value as any)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="none">Bebas Pajak (Non PPN)</option>
                <option value="ppn11">PPN 11% (Tambah Otomatis)</option>
                <option value="inclusive">Termasuk Pajak (Include)</option>
              </select>
            </div>
          </div>
        </div>

        {/* CARD 4: STOK, KONVERSI KARTON / DUS & LOKASI GUDANG */}
        <div
          className={`rounded-2xl border p-6 sm:p-7 space-y-5 shadow-sm transition-colors ${
            isDark
              ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 border-zinc-800/60">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Manajemen Stok &amp; Konversi Dus / Karton
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">Kelola Stok:</span>
              <button
                type="button"
                onClick={() => setTrackStock(!trackStock)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  trackStock ? 'bg-blue-600' : isDark ? 'bg-zinc-700' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                    trackStock ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stok Awal */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                Stok Awal (Pcs / Unit)
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-zinc-100'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                }`}
              />
            </div>

            {/* Batas Kritis */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                Batas Stok Minimum (Kritis)
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-amber-400'
                    : 'bg-slate-50 border-slate-200 text-amber-600 focus:bg-white'
                }`}
              />
            </div>

            {/* Isi per Dus/Karton */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                Isi per Karton / Dus
              </label>
              <input
                type="number"
                min="1"
                value={itemsPerCarton}
                onChange={(e) => setItemsPerCarton(Number(e.target.value))}
                className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-zinc-100'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                }`}
              />
            </div>

            {/* Lokasi Rak Gudang */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                Lokasi Rak / Penyimpanan
              </label>
              <input
                type="text"
                placeholder="Rak A-01 / Gudang 2"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                }`}
              />
            </div>

            {/* Berat / Volume */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                Berat / Volume Satuan (ml / gr)
              </label>
              <input
                type="number"
                min="0"
                value={weightMl}
                onChange={(e) => setWeightMl(Number(e.target.value))}
                className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-zinc-100'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                }`}
              />
            </div>
          </div>
        </div>

        {/* CARD 5: VARIAN PRODUK (OPSIONAL) */}
        <div
          className={`rounded-2xl border p-6 sm:p-7 space-y-4 shadow-sm transition-colors ${
            isDark
              ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 border-zinc-800/60">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Varian Produk (Ukuran, Rasa, Kemasan)
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Aktifkan jika produk memiliki berbagai pilihan (misal: 600ml, 1500ml, Original, Dingin).
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold ${
                  hasVariants ? 'text-blue-500 font-bold' : isDark ? 'text-zinc-500' : 'text-slate-400'
                }`}
              >
                {hasVariants ? 'Aktif' : 'Nonaktif'}
              </span>
              <button
                type="button"
                onClick={() => setHasVariants(!hasVariants)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  hasVariants ? 'bg-blue-600' : isDark ? 'bg-zinc-700' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ${
                    hasVariants ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Dynamic Variant Table */}
          {hasVariants && (
            <div className="pt-2 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">
                  Daftar Pilihan Varian ({variantsList.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Varian Baru</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className={`font-semibold border-b ${
                        isDark
                          ? 'text-zinc-400 border-zinc-800 bg-zinc-950/60'
                          : 'text-slate-500 border-slate-200 bg-slate-100/60'
                      }`}
                    >
                      <th className="py-2.5 px-3">Nama Varian</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Harga Modal (Rp)</th>
                      <th className="py-2.5 px-3">Harga Jual (Rp)</th>
                      <th className="py-2.5 px-3 text-center">Stok</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-zinc-800/60' : 'divide-slate-200/60'}`}>
                    {variantsList.map((v) => (
                      <tr key={v.id}>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => handleUpdateVariantField(v.id, 'name', e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                              isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => handleUpdateVariantField(v.id, 'sku', e.target.value)}
                            className={`w-24 px-2 py-1.5 rounded-lg border font-mono text-xs ${
                              isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={v.costPrice}
                            onChange={(e) => handleUpdateVariantField(v.id, 'costPrice', Number(e.target.value))}
                            className={`w-28 px-2 py-1.5 rounded-lg border font-mono text-xs ${
                              isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={v.sellPrice}
                            onChange={(e) => handleUpdateVariantField(v.id, 'sellPrice', Number(e.target.value))}
                            className={`w-28 px-2 py-1.5 rounded-lg border font-mono text-xs font-bold text-emerald-500 ${
                              isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => handleUpdateVariantField(v.id, 'stock', Number(e.target.value))}
                            className={`w-16 px-2 py-1.5 rounded-lg border font-mono text-center text-xs ${
                              isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(v.id)}
                            disabled={variantsList.length <= 1}
                            className={`p-1.5 rounded-lg transition ${
                              variantsList.length <= 1
                                ? 'opacity-30 cursor-not-allowed text-zinc-500'
                                : 'text-rose-500 hover:bg-rose-500/10 cursor-pointer'
                            }`}
                            title="Hapus Varian"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR - Matches image with Reset, Batal, Simpan & Tambah Lainnya, Simpan Produk */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetForm}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className={`px-5 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              Batal
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSaveAndAnother}
              className={`px-5 py-2.5 rounded-xl border text-xs font-bold transition shadow-xs cursor-pointer ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200'
                  : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'
              }`}
            >
              Simpan &amp; Tambah Lainnya
            </button>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Simpan Produk</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
