import React, { useState, useRef } from 'react';
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
  Upload,
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
import { collection, addDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ProductGroupItem, ProductVariantItem } from './ProductCartonManager';
import { useLanguage, USD_TO_IDR_RATE } from '../../context/LanguageContext';

interface AddProductFormProps {
  isDark: boolean;
  onBack: () => void;
  onSubmit: (product: ProductGroupItem) => void;
  onToggleTheme: (theme: 'dark' | 'light') => void;
  onSaveAndAddAnother?: (product: ProductGroupItem) => void;
  initialProduct?: any;
}

export const AddProductForm: React.FC<AddProductFormProps> = ({
  isDark,
  onBack,
  onSubmit,
  onToggleTheme,
  onSaveAndAddAnother,
  initialProduct,
}) => {
  const { language, t, currencyMode, formatCurrency } = useLanguage();

  // Currency conversion helpers
  const currencySymbol = currencyMode === 'USD' ? '$' : 'Rp';
  const priceStep = currencyMode === 'USD' ? '0.01' : '500';
  const cartonPriceStep = currencyMode === 'USD' ? '0.1' : '1000';

  const toDisplayValue = (valInIdr: number): number | string => {
    if (currencyMode === 'USD') {
      const usd = valInIdr / USD_TO_IDR_RATE;
      return Number(usd.toFixed(2));
    }
    return Math.round(valInIdr);
  };

  const parseInputToIdr = (displayVal: number | string): number => {
    const num = Number(displayVal) || 0;
    if (currencyMode === 'USD') {
      return Math.round(num * USD_TO_IDR_RATE);
    }
    return Math.round(num);
  };

  // Form fields: Informasi Dasar
  const [productName, setProductName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(initialProduct?.sku || ('P' + Math.floor(100 + Math.random() * 900)));
  const [category, setCategory] = useState(initialProduct?.category || 'MINERAL');
  const [brand, setBrand] = useState(initialProduct?.brand || '');
  const [unit, setUnit] = useState(initialProduct?.unit || 'Pcs');
  const [description, setDescription] = useState(initialProduct?.description || '');

  // Image Upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialProduct?.imageUrl || null);
  const [uploadedImageName, setUploadedImageName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showFlash(
          language === 'id'
            ? 'Ukuran gambar melebihi batas 5MB!'
            : 'Image size exceeds 5MB limit!'
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedImage(result);
        setUploadedImageName(file.name);
        showFlash(
          language === 'id'
            ? `Gambar "${file.name}" berhasil diunggah!`
            : `Image "${file.name}" uploaded successfully!`
        );
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset Image selection
  const [selectedPresetImage, setSelectedPresetImage] = useState<string>('💧 Aqua Bottle');

  // Form fields: Pricing & Tax
  const initialCost = initialProduct?.costPrice ?? initialProduct?.costPerUnit ?? 20000;
  const initialSell = initialProduct?.price ?? initialProduct?.sellPrice ?? initialProduct?.pricePerUnit ?? 25000;
  const initialStock = initialProduct?.stock ?? initialProduct?.stockInUnits ?? 50;
  const initialMinStock = initialProduct?.minStockAlert ?? initialProduct?.minStock ?? 10;
  const initialCartonPcs = initialProduct?.piecesPerCarton ?? initialProduct?.itemsPerCarton ?? 24;
  const initialCartonWholesale = initialProduct?.pricePerCarton ?? 550000;

  const [costPrice, setCostPrice] = useState<number>(initialCost);
  const [sellPrice, setSellPrice] = useState<number>(initialSell);
  const [posPrice, setPosPrice] = useState<number>(initialProduct?.posPrice ?? initialSell);
  const [pwaPrice, setPwaPrice] = useState<number>(initialProduct?.pwaPrice ?? initialSell);
  const [taxMode, setTaxMode] = useState<'none' | 'ppn11' | 'inclusive'>('none');
  const [autoSyncPrices, setAutoSyncPrices] = useState(true);

  // Form fields: Stock & Carton Conversion
  const [trackStock, setTrackStock] = useState(true);
  const [stock, setStock] = useState<number>(initialStock);
  const [minStock, setMinStock] = useState<number>(initialMinStock);
  const [itemsPerCarton, setItemsPerCarton] = useState<number>(initialCartonPcs);
  const [cartonWholesalePrice, setCartonWholesalePrice] = useState<number>(initialCartonWholesale);
  const [weightMl, setWeightMl] = useState<number>(initialProduct?.weightMl ?? 600);
  const [shelfLocation, setShelfLocation] = useState(initialProduct?.storageLocation ?? 'Shelf A-01');

  // Currency string states to allow smooth input in both IDR and USD
  const [costPriceStr, setCostPriceStr] = useState<string>(() => String(toDisplayValue(initialCost)));
  const [sellPriceStr, setSellPriceStr] = useState<string>(() => String(toDisplayValue(initialSell)));
  const [posPriceStr, setPosPriceStr] = useState<string>(() => String(toDisplayValue(initialProduct?.posPrice ?? initialSell)));
  const [pwaPriceStr, setPwaPriceStr] = useState<string>(() => String(toDisplayValue(initialProduct?.pwaPrice ?? initialSell)));
  const [cartonPriceStr, setCartonPriceStr] = useState<string>(() => String(toDisplayValue(initialCartonWholesale)));

  // Sync state if initialProduct prop updates
  React.useEffect(() => {
    if (initialProduct) {
      setProductName(initialProduct.name || '');
      setSku(initialProduct.sku || '');
      setCategory(initialProduct.category || 'MINERAL');
      setBrand(initialProduct.brand || '');
      setUnit(initialProduct.unit || 'Pcs');
      setDescription(initialProduct.description || '');
      const cst = initialProduct.costPrice ?? initialProduct.costPerUnit ?? 20000;
      const sll = initialProduct.price ?? initialProduct.sellPrice ?? initialProduct.pricePerUnit ?? 25000;
      const stk = initialProduct.stock ?? initialProduct.stockInUnits ?? 50;
      const minStk = initialProduct.minStockAlert ?? initialProduct.minStock ?? 10;
      const crtPcs = initialProduct.piecesPerCarton ?? initialProduct.itemsPerCarton ?? 24;
      const crtPrice = initialProduct.pricePerCarton ?? 550000;
      setCostPrice(cst);
      setSellPrice(sll);
      setPosPrice(initialProduct.posPrice ?? sll);
      setPwaPrice(initialProduct.pwaPrice ?? sll);
      setStock(stk);
      setMinStock(minStk);
      setItemsPerCarton(crtPcs);
      setCartonWholesalePrice(crtPrice);
      setCostPriceStr(String(toDisplayValue(cst)));
      setSellPriceStr(String(toDisplayValue(sll)));
      setPosPriceStr(String(toDisplayValue(initialProduct.posPrice ?? sll)));
      setPwaPriceStr(String(toDisplayValue(initialProduct.pwaPrice ?? sll)));
      setCartonPriceStr(String(toDisplayValue(crtPrice)));
      if (initialProduct.imageUrl) {
        setUploadedImage(initialProduct.imageUrl);
      }
    }
  }, [initialProduct]);

  // Automatically update input strings when currencyMode toggles (IDR <-> USD)
  React.useEffect(() => {
    setCostPriceStr(String(toDisplayValue(costPrice)));
    setSellPriceStr(String(toDisplayValue(sellPrice)));
    setPosPriceStr(String(toDisplayValue(posPrice)));
    setPwaPriceStr(String(toDisplayValue(pwaPrice)));
    setCartonPriceStr(String(toDisplayValue(cartonWholesalePrice)));
  }, [currencyMode]);

  // Input handlers that parse according to active currency
  const handleCostPriceInput = (val: string) => {
    setCostPriceStr(val);
    const idr = parseInputToIdr(val);
    setCostPrice(idr);
  };

  const handleSellPriceInput = (val: string) => {
    setSellPriceStr(val);
    const idr = parseInputToIdr(val);
    setSellPrice(idr);
    if (autoSyncPrices) {
      setPosPrice(idr);
      setPwaPrice(idr);
      setPosPriceStr(val);
      setPwaPriceStr(val);
    }
  };

  const handlePosPriceInput = (val: string) => {
    setPosPriceStr(val);
    const idr = parseInputToIdr(val);
    setPosPrice(idr);
  };

  const handlePwaPriceInput = (val: string) => {
    setPwaPriceStr(val);
    const idr = parseInputToIdr(val);
    setPwaPrice(idr);
  };

  const handleCartonPriceInput = (val: string) => {
    setCartonPriceStr(val);
    const idr = parseInputToIdr(val);
    setCartonWholesalePrice(idr);
  };

  // Form fields: Visibility & Status
  const [isActive, setIsActive] = useState(true);
  const [isPosVisible, setIsPosVisible] = useState(true);
  const [isPwaVisible, setIsPwaVisible] = useState(true);

  // Variant toggle & list
  const [hasVariants, setHasVariants] = useState(false);
  const [variantsList, setVariantsList] = useState<ProductVariantItem[]>([
    {
      id: 'v_1',
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      name: language === 'id' ? 'Varian 1 (Regular)' : 'Variant 1 (Regular)',
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
    showFlash(
      language === 'id'
        ? `SKU Baru di-generate: ${generated}`
        : `New SKU generated: ${generated}`
    );
  };

  // Add Variant item
  const handleAddVariant = () => {
    const newIndex = variantsList.length + 1;
    const newVariant: ProductVariantItem = {
      id: 'v_' + Date.now(),
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      name: `${productName ? productName + ' ' : ''}${language === 'id' ? 'Varian' : 'Variant'} ${newIndex}`,
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
      sellPriceRange: hasVariants ? formatCurrency(sellPrice) : undefined,
      totalStock: hasVariants
        ? variantsList.reduce((acc, curr) => acc + curr.stock, 0)
        : stock,
      itemsPerCarton: itemsPerCarton,
      weightMl: weightMl,
      isActive: isActive,
      isPosVisible: isPosVisible,
      isPwaVisible: isPwaVisible,
      imageUrl: uploadedImage || undefined,
      variants: hasVariants
        ? variantsList.map((v) => ({
            ...v,
            category: category,
            brand: brand || productName,
            imageUrl: uploadedImage || undefined,
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
    setUploadedImage(null);
    setUploadedImageName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCostPrice(20000);
    setSellPrice(25000);
    setPosPrice(25000);
    setPwaPrice(25000);
    setStock(50);
    setCartonWholesalePrice(550000);
    setWeightMl(600);
    setHasVariants(false);
    setCostPriceStr(String(toDisplayValue(20000)));
    setSellPriceStr(String(toDisplayValue(25000)));
    setPosPriceStr(String(toDisplayValue(25000)));
    setPwaPriceStr(String(toDisplayValue(25000)));
    setCartonPriceStr(String(toDisplayValue(550000)));
    showFlash(
      language === 'en'
        ? 'Form has been reset!'
        : 'Form berhasil di-reset!'
    );
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Firestore save / update function
  const saveProductToFirestore = async (newGroup: ProductGroupItem) => {
    const isEdit = Boolean(initialProduct?.id);
    const prodId = initialProduct?.id || newGroup.id;

    const firestoreData: Record<string, any> = {
      storeId: 'store_001',
      name: productName.trim(),
      sku: sku.trim() || ('P' + Math.floor(100 + Math.random() * 900)),
      category: category,
      price: sellPrice,
      costPrice: costPrice,
      stock: stock,
      pricePerUnit: sellPrice,
      costPerUnit: costPrice,
      stockInUnits: stock,
      piecesPerCarton: itemsPerCarton,
      pricePerCarton: cartonWholesalePrice,
      minStockAlert: minStock,
      brand: brand || productName,
      imageUrl: uploadedImage || '',
      updatedAt: new Date().toISOString(),
    };

    try {
      if (isEdit && prodId) {
        // Edit existing product -> updateDoc
        await updateDoc(doc(db, 'stores/store_001/products', prodId), firestoreData);
        try {
          await updateDoc(doc(db, 'products', prodId), firestoreData);
        } catch (e) {}
      } else {
        // Create new product -> addDoc with createdAt: new Date()
        const payloadWithCreatedAt = {
          ...firestoreData,
          createdAt: new Date(),
        };
        const docRef = await addDoc(collection(db, 'stores/store_001/products'), payloadWithCreatedAt);
        newGroup.id = docRef.id;
        try {
          await setDoc(doc(db, 'products', docRef.id), {
            ...payloadWithCreatedAt,
            id: docRef.id,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Firestore write error in AddProductForm:', err);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      showFlash(
        language === 'en'
          ? 'Warning: Please enter the Product Name first!'
          : 'Peringatan: Silakan isi Nama Produk terlebih dahulu!'
      );
      return;
    }
    setIsSubmitting(true);
    const newGroup = buildProductObject();
    await saveProductToFirestore(newGroup);
    setIsSubmitting(false);
    onSubmit(newGroup);
  };

  // Save & Add Another Handler
  const handleSaveAndAnother = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      showFlash(
        language === 'en'
          ? 'Warning: Please enter the Product Name first!'
          : 'Peringatan: Silakan isi Nama Produk terlebih dahulu!'
      );
      return;
    }
    setIsSubmitting(true);
    const newGroup = buildProductObject();
    await saveProductToFirestore(newGroup);
    setIsSubmitting(false);
    if (onSaveAndAddAnother) {
      onSaveAndAddAnother(newGroup);
    } else {
      onSubmit(newGroup);
    }
    handleResetForm();
    showFlash(
      language === 'en'
        ? `Product "${newGroup.name}" saved! Ready to add another.`
        : `Produk "${newGroup.name}" tersimpan! Siap menambah produk baru.`
    );
  };

  // Preset visuals
  const imagePresets = [
    { label: '💧 Aqua Bottle', desc: language === 'id' ? 'Air Mineral 600ml / 1.5L' : 'Mineral Water 600ml / 1.5L' },
    { label: '📦 Aqua Box', desc: language === 'id' ? 'Karton 240ml Gelas' : 'Carton 240ml Cups' },
    { label: '🔵 Aqua Gallon', desc: language === 'id' ? 'Galon 19L Refill' : 'Gallon 19L Refill' },
    { label: '🍃 Teh Pucuk', desc: language === 'id' ? 'Teh Melati 350ml' : 'Jasmine Tea 350ml' },
    { label: '🥤 Coca-Cola', desc: language === 'id' ? 'Minuman Soda 390ml' : 'Soft Drink 390ml' },
    { label: '🍈 Gas Melon 3Kg', desc: language === 'id' ? 'LPG Subsidi Melon' : 'LPG 3Kg Cylinder' },
    { label: '☕ Good Day Coffee', desc: language === 'id' ? 'Kopi Botol & Sachet' : 'Coffee Bottle & Sachet' },
    { label: '🍜 Indomie Goreng', desc: language === 'id' ? 'Mie Instan Dus/Pcs' : 'Instant Noodles Box/Pcs' },
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
              {t('add_product', 'Add Product')}
            </h1>
          </div>
          <p
            className={`text-xs mt-1 ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            {t(
              'add_product_subtitle',
              'Fill out the form below to add a new item into the POS Machine catalog & Customer Online PWA.'
            )}
          </p>
        </div>

        {/* Action Controls: Theme Switcher & Back Button */}
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

          {/* Back Button */}
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
            <span>{t('back', 'Back')}</span>
          </button>
        </div>
      </div>

      {/* MAIN FORM CONTAINER - Styled according to reference image with cards */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CARD: PRODUCT PHOTOS & IMAGES */}
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
                {t('photo_and_image', 'Product Photos & Imagery')}
              </h2>
            </div>
            <span className="text-[11px] text-zinc-400">
              {t('photo_format_hint', 'Formats: JPG, PNG, WebP (Max 5MB)')}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6">
            {/* IMAGE BOX ON LEFT */}
            <div
              className={`relative w-44 h-44 sm:w-48 sm:h-48 shrink-0 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all group ${
                isDark
                  ? 'border-zinc-700 bg-zinc-950/70 hover:border-blue-500/60'
                  : 'border-slate-300 bg-slate-50 hover:border-blue-400'
              }`}
            >
              {uploadedImage ? (
                <>
                  <img
                    src={uploadedImage}
                    alt={language === 'id' ? 'Preview Produk' : 'Product Preview'}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg cursor-pointer transition"
                      title={t('change_image', 'Change Image')}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedImage(null);
                        setUploadedImageName('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg cursor-pointer transition"
                      title={t('delete_image', 'Delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:opacity-80 transition w-full h-full"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-2.5 transition ${
                      isDark
                        ? 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 group-hover:text-blue-400 group-hover:border-blue-500/50'
                        : 'bg-white border-slate-200 text-slate-400 group-hover:text-blue-500 group-hover:border-blue-400'
                    }`}
                  >
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? 'text-zinc-300' : 'text-slate-700'
                    }`}
                  >
                    {t('image_box', 'Image Box')}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    {t('click_to_pick', 'Click to select photo')}
                  </span>
                </div>
              )}
            </div>

            {/* UPLOAD BUTTON ON RIGHT */}
            <div className="flex-1 flex flex-col justify-center space-y-3">
              <div>
                <h3
                  className={`text-sm font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <span>{t('upload_product_photo', 'Upload Product Photo')}</span>
                  {uploadedImage && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                      <Check className="w-3 h-3" /> {t('uploaded_badge', 'Uploaded')}
                    </span>
                  )}
                </h3>
                <p
                  className={`text-xs mt-1 leading-relaxed ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}
                >
                  {t(
                    'upload_photo_desc',
                    'Upload high-resolution product imagery to display on the POS Cashier Terminal and Customer PWA storefront.'
                  )}
                </p>
                {uploadedImageName && (
                  <p className="text-[11px] text-zinc-400 mt-1.5 font-mono flex items-center gap-1.5">
                    <span className="text-zinc-500">File:</span>
                    <span className="text-blue-400 font-semibold truncate max-w-xs">
                      {uploadedImageName}
                    </span>
                  </p>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {uploadedImage
                      ? t('change_image', 'Change Image')
                      : t('upload_image_btn', 'Upload Image')}
                  </span>
                </button>

                {uploadedImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedImage(null);
                      setUploadedImageName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs border transition flex items-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-rose-400 hover:text-rose-300 border-zinc-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-rose-600 border-slate-200'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('delete_image', 'Delete')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 1: BASIC PRODUCT INFORMATION */}
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
                {t('basic_info', 'Basic Product Information')}
              </h2>
            </div>
            <span className="text-[11px] text-zinc-400">
              {t('part_1_of_4', 'Part 1 of 4 • Required (*)')}
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
                {t('product_name', 'Product Name')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={t(
                  'product_name_placeholder',
                  'Example: Aqua 600ml Bottle / Le Minerale Carton 24x600ml / Gas Cylinder 3Kg'
                )}
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
                  {t('barcode_sku', 'Barcode / SKU')}
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> {t('random_sku', 'Generate SKU')}
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
                {t('product_category', 'Product Category')}
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
                <option value="MINERAL">MINERAL ({language === 'id' ? 'Air Mineral' : 'Mineral Water'})</option>
                <option value="FLAVORED">FLAVORED ({language === 'id' ? 'Minuman Berperisa' : 'Flavored Drinks'})</option>
                <option value="COLA">COLA ({language === 'id' ? 'Minuman Soda' : 'Carbonated Soft Drinks'})</option>
                <option value="GAS">GAS ({language === 'id' ? 'LPG & Tabung' : 'LPG & Cylinders'})</option>
                <option value="COFFEE">COFFEE ({language === 'id' ? 'Kopi & Minuman Susu' : 'Coffee & Milk'})</option>
                <option value="SNACK">SNACK ({language === 'id' ? 'Makanan Ringan' : 'Light Snacks'})</option>
                <option value="DAIRY">DAIRY ({language === 'id' ? 'Susu & Olahan' : 'Dairy & Milk'})</option>
                <option value="INSTANT_FOOD">INSTANT FOOD ({language === 'id' ? 'Mie & Cepat Saji' : 'Instant Noodles'})</option>
                <option value="OTHER">{language === 'id' ? 'LAINNYA' : 'OTHER'}</option>
              </select>
            </div>

            {/* Brand / Merek */}
            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-zinc-300' : 'text-slate-700'
                }`}
              >
                {t('brand_label', 'Brand / Manufacturer')}
              </label>
              <input
                type="text"
                placeholder={t('brand_placeholder', 'Example: Danone, Mayora, Wings, Pertamina')}
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
                {t('selling_unit', 'Selling Unit')}
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
                <option value="Pcs">Pcs ({language === 'id' ? 'Satuan Unit' : 'Individual Units'})</option>
                <option value="Botol">{language === 'id' ? 'Botol' : 'Bottle'}</option>
                <option value="Dus / Karton">{language === 'id' ? 'Dus / Karton' : 'Box / Carton'}</option>
                <option value="Cup">{language === 'id' ? 'Cup / Gelas' : 'Cup / Glass'}</option>
                <option value="Pack">Pack</option>
                <option value="Galon">{language === 'id' ? 'Galon 19L' : 'Gallon 19L'}</option>
                <option value="Tabung">{language === 'id' ? 'Tabung Gas' : 'Gas Cylinder'}</option>
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
              {t('product_desc_optional', 'Description / Additional Notes (Optional)')}
            </label>
            <textarea
              rows={2}
              placeholder={t(
                'desc_placeholder',
                'Product details, serving notes, bottle return terms, etc...'
              )}
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

        {/* CARD 3: PRICING, TAX & PROFIT MARGIN */}
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
                {t('pricing_profit_margin', 'Sales Price, Capital & Profit Margin')}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-400">
              <Info className="w-3.5 h-3.5" />
              <span>{t('pos_pwa_auto_sync', 'POS & PWA auto-synchronized')}</span>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Modal / Purchase Price */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                {t('cost_price', 'Purchase Price / Cost')} ({currencySymbol})
              </label>
              <div className="relative">
                <span
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold ${
                    isDark ? 'text-zinc-500' : 'text-slate-400'
                  }`}
                >
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step={priceStep}
                  value={costPriceStr}
                  onChange={(e) => handleCostPriceInput(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border font-mono text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-700 text-zinc-100'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            {/* Jual / Standard Retail Price */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1.5 ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                {t('selling_price_standard', 'Standard Retail Price')} ({currencySymbol}){' '}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold ${
                    isDark ? 'text-zinc-500' : 'text-slate-400'
                  }`}
                >
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step={priceStep}
                  required
                  value={sellPriceStr}
                  onChange={(e) => handleSellPriceInput(e.target.value)}
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
                  {t('pos_price', 'POS Cashier Price')} ({currencySymbol})
                </label>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.2 rounded">
                  {t('auto_badge', 'Auto')}
                </span>
              </div>
              <div className="relative">
                <span
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold ${
                    isDark ? 'text-zinc-500' : 'text-slate-400'
                  }`}
                >
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step={priceStep}
                  value={posPriceStr}
                  onChange={(e) => handlePosPriceInput(e.target.value)}
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
                  {t('pwa_price', 'Online PWA Price')} ({currencySymbol})
                </label>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.2 rounded">
                  {t('auto_badge', 'Auto')}
                </span>
              </div>
              <div className="relative">
                <span
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold ${
                    isDark ? 'text-zinc-500' : 'text-slate-400'
                  }`}
                >
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step={priceStep}
                  value={pwaPriceStr}
                  onChange={(e) => handlePwaPriceInput(e.target.value)}
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
                  {t('wholesale_carton_price', 'Wholesale Box Price')} ({currencySymbol})
                </label>
                <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded">
                  {t('carton_badge', 'Box / Carton')}
                </span>
              </div>
              <div className="relative">
                <span
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold ${
                    isDark ? 'text-zinc-500' : 'text-slate-400'
                  }`}
                >
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step={cartonPriceStep}
                  value={cartonPriceStr}
                  onChange={(e) => handleCartonPriceInput(e.target.value)}
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
                  {t('profit_per_unit', 'Unit Profit')}:{' '}
                  {formatCurrency(profitPerUnit)}
                </span>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {t('net_profit_margin', 'Net Profit Margin')}:{' '}
                  <span className="font-black font-mono">{marginPercent}%</span> &bull;{' '}
                  {t('status', 'Status')}:{' '}
                  {Number(marginPercent) >= 20
                    ? t('margin_healthy', 'Healthy Margin')
                    : Number(marginPercent) >= 10
                    ? t('margin_medium', 'Moderate Margin')
                    : t('margin_thin', 'Thin Margin')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold">
                {t('tax_setting', 'Tax Setting')}:
              </span>
              <select
                value={taxMode}
                onChange={(e) => setTaxMode(e.target.value as any)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-white'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="none">{t('tax_none', 'Tax Exempt (No VAT)')}</option>
                <option value="ppn11">{t('tax_ppn11', 'VAT 11% (Auto Append)')}</option>
                <option value="inclusive">{t('tax_inclusive', 'Tax Inclusive')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* CARD 4: STOCK, CARTON CONVERSION & WAREHOUSE LOCATION */}
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
                {t('stock_management', 'Stock Management & Carton Conversion')}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">
                {t('manage_stock', 'Track Inventory')}:
              </span>
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
                {t('initial_stock', 'Initial Stock (Units / Pcs)')}
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
                {t('min_stock_critical', 'Minimum Threshold (Critical)')}
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
                {t('items_per_carton', 'Items per Carton / Box')}
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
                {t('shelf_location', 'Shelf / Storage Location')}
              </label>
              <input
                type="text"
                placeholder={t('shelf_placeholder', 'Shelf A-01 / Warehouse 2')}
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
                {t('weight_volume', 'Unit Weight / Volume (ml / gr)')}
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

        {/* CARD 5: PRODUCT VARIANTS (OPTIONAL) */}
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
                  {t('product_variants', 'Product Variants (Size, Flavor, Package)')}
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {t(
                    'product_variants_desc',
                    'Enable if product comes in multiple variations (e.g., 600ml, 1500ml, Regular, Cold).'
                  )}
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
                {hasVariants ? t('variants_active', 'Active') : t('variants_inactive', 'Inactive')}
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
                  {t('variant_list_title', 'Variant Options List')} ({variantsList.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('add_new_variant', '+ Add New Variant')}</span>
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
                      <th className="py-2.5 px-3">{t('variant_name_th', 'Variant Name')}</th>
                      <th className="py-2.5 px-3">{t('variant_sku_th', 'SKU')}</th>
                      <th className="py-2.5 px-3">
                        {t('variant_cost_th', 'Cost Price')} ({currencySymbol})
                      </th>
                      <th className="py-2.5 px-3">
                        {t('variant_sell_th', 'Retail Price')} ({currencySymbol})
                      </th>
                      <th className="py-2.5 px-3 text-center">{t('variant_stock_th', 'Stock')}</th>
                      <th className="py-2.5 px-3 text-right">{t('variant_action_th', 'Actions')}</th>
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
                            step={priceStep}
                            value={toDisplayValue(v.costPrice)}
                            onChange={(e) =>
                              handleUpdateVariantField(v.id, 'costPrice', parseInputToIdr(e.target.value))
                            }
                            className={`w-28 px-2 py-1.5 rounded-lg border font-mono text-xs ${
                              isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step={priceStep}
                            value={toDisplayValue(v.sellPrice)}
                            onChange={(e) =>
                              handleUpdateVariantField(v.id, 'sellPrice', parseInputToIdr(e.target.value))
                            }
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
                            title={t('delete_image', 'Delete')}
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

        {/* BOTTOM ACTION BAR: Reset, Cancel, Save & Add Another, Save Product */}
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
              <span>{t('reset_form', 'Reset Form')}</span>
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
              {t('cancel', 'Cancel')}
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
              {t('save_and_add_another', 'Save & Add Another')}
            </button>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t('save_product', 'Save Product')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
