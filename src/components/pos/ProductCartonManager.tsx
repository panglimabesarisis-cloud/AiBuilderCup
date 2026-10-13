import React, { useState, useEffect, useRef } from 'react';
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
  Check,
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
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { DEMO_STORE_ID } from '../../services/dataSeeder';
import {
  productsToGroups,
  variantToProduct,
  extractVariantsFromGroups,
  ProductGroupItem,
  ProductVariantItem,
} from '../../services/productMapper';
import { Product, CustomerType } from '../../types';
import { AddProductForm } from './AddProductForm';
import { ProductBundlesModule } from './ProductBundlesModule';
import { DiscountPricingModule } from '../modules/DiscountPricingModule';
import { useLanguage } from '../../context/LanguageContext';

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

export type { ProductVariantItem, ProductGroupItem };

export const INITIAL_MASTER_PRODUCTS: ProductGroupItem[] = [
  {
    id: 'grp_ale_ale',
    name: 'Ale-Ale',
    category: 'FLAVORED',
    brand: 'Ale-Ale',
    hasVariants: true,
    sellPriceRange: 'Rp 20.000',
    totalStock: 73,
    variants: [
      { id: 'v_ale_1', sku: 'P001', name: 'Ale-Ale Orange Cup (24 Cups)', category: 'FLAVORED', brand: 'Ale-Ale', costPrice: 17500, sellPrice: 20000, posPrice: 20000, pwaPrice: 20000, stock: 15, itemsPerCarton: 24, weightMl: 200, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_ale_2', sku: 'P002', name: 'Ale-Ale Grape Cup (24 Cups)', category: 'FLAVORED', brand: 'Ale-Ale', costPrice: 17500, sellPrice: 20000, posPrice: 20000, pwaPrice: 20000, stock: 12, itemsPerCarton: 24, weightMl: 200, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_ale_3', sku: 'P003', name: 'Ale-Ale Apple Cup (24 Cups)', category: 'FLAVORED', brand: 'Ale-Ale', costPrice: 17500, sellPrice: 20000, posPrice: 20000, pwaPrice: 20000, stock: 10, itemsPerCarton: 24, weightMl: 200, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_ale_4', sku: 'P004', name: 'Ale-Ale Soursop Cup (24 Cups)', category: 'FLAVORED', brand: 'Ale-Ale', costPrice: 17500, sellPrice: 20000, posPrice: 20000, pwaPrice: 20000, stock: 8, itemsPerCarton: 24, weightMl: 200, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_ale_5', sku: 'P005', name: 'Ale-Ale Strawberry Cup (24 Cups)', category: 'FLAVORED', brand: 'Ale-Ale', costPrice: 17500, sellPrice: 20000, posPrice: 20000, pwaPrice: 20000, stock: 11, itemsPerCarton: 24, weightMl: 200, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_ale_6', sku: 'P006', name: 'Ale-Ale Tamarind Cup (24 Cups)', category: 'FLAVORED', brand: 'Ale-Ale', costPrice: 17500, sellPrice: 20000, posPrice: 20000, pwaPrice: 20000, stock: 9, itemsPerCarton: 24, weightMl: 200, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_ale_7', sku: 'P007', name: 'Ale-Ale Passion Fruit Cup (24 Cups)', category: 'FLAVORED', brand: 'Ale-Ale', costPrice: 17500, sellPrice: 20000, posPrice: 20000, pwaPrice: 20000, stock: 8, itemsPerCarton: 24, weightMl: 200, isActive: true, isPosVisible: true, isPwaVisible: true },
    ],
  },
  {
    id: 'grp_aqua_dus',
    name: 'Aqua Dus',
    category: 'MINERAL',
    brand: 'Aqua Dus',
    hasVariants: true,
    sellPriceRange: 'Rp 34.000 - Rp 52.500',
    totalStock: 296,
    variants: [
      { id: 'v_aqd_1', sku: 'P010', name: 'Aqua Carton 240ml Cup (48 Cups)', category: 'MINERAL', brand: 'Aqua Dus', costPrice: 28000, sellPrice: 34000, posPrice: 34000, pwaPrice: 34000, stock: 120, itemsPerCarton: 48, weightMl: 240, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_aqd_2', sku: 'P011', name: 'Aqua Carton 330ml Mini (24 Bottles)', category: 'MINERAL', brand: 'Aqua Dus', costPrice: 33000, sellPrice: 39500, posPrice: 39500, pwaPrice: 39500, stock: 65, itemsPerCarton: 24, weightMl: 330, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_aqd_3', sku: 'P012', name: 'Aqua Carton 600ml Medium (24 Bottles)', category: 'MINERAL', brand: 'Aqua Dus', costPrice: 42000, sellPrice: 48000, posPrice: 48000, pwaPrice: 48000, stock: 80, itemsPerCarton: 24, weightMl: 600, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_aqd_4', sku: 'P013', name: 'Aqua Carton 1500ml Large (12 Bottles)', category: 'MINERAL', brand: 'Aqua Dus', costPrice: 46000, sellPrice: 52500, posPrice: 52500, pwaPrice: 52500, stock: 31, itemsPerCarton: 12, weightMl: 1500, isActive: true, isPosVisible: true, isPwaVisible: true },
    ],
  },
  {
    id: 'grp_aqua_galon',
    name: 'Aqua Galon',
    category: 'MINERAL',
    brand: 'Aqua Galon',
    hasVariants: true,
    sellPriceRange: 'Rp 19.000 - Rp 75.000',
    totalStock: 183,
    variants: [
      { id: 'v_aqg_1', sku: 'P014', name: 'Aqua Gallon 19L Refill (Return Bottle)', category: 'MINERAL', brand: 'Aqua Galon', costPrice: 16500, sellPrice: 19000, posPrice: 19000, pwaPrice: 19000, stock: 140, itemsPerCarton: 1, weightMl: 19000, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_aqg_2', sku: 'P015', name: 'Aqua Gallon 19L New Bottle + Water', category: 'MINERAL', brand: 'Aqua Galon', costPrice: 48000, sellPrice: 56000, posPrice: 56000, pwaPrice: 56000, stock: 28, itemsPerCarton: 1, weightMl: 19000, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_aqg_3', sku: 'P016', name: 'Aqua Gallon 19L Disposable Refill', category: 'MINERAL', brand: 'Aqua Galon', costPrice: 62000, sellPrice: 75000, posPrice: 75000, pwaPrice: 75000, stock: 15, itemsPerCarton: 1, weightMl: 19000, isActive: true, isPosVisible: true, isPwaVisible: true },
    ],
  },
  {
    id: 'grp_aquaviva',
    name: 'Aquaviva',
    category: 'MINERAL',
    brand: 'Aquaviva',
    hasVariants: true,
    sellPriceRange: 'Rp 20.000 - Rp 26.000',
    totalStock: 99,
    variants: [
      { id: 'v_aqv_1', sku: 'P020', name: 'Aquaviva Cup 220ml Carton (48 Cups)', category: 'MINERAL', brand: 'Aquaviva', costPrice: 16500, sellPrice: 20000, posPrice: 20000, pwaPrice: 20000, stock: 45, itemsPerCarton: 48, weightMl: 220, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_aqv_2', sku: 'P021', name: 'Aquaviva Bottle 600ml Carton (24 Bottles)', category: 'MINERAL', brand: 'Aquaviva', costPrice: 21000, sellPrice: 24500, posPrice: 24500, pwaPrice: 24500, stock: 34, itemsPerCarton: 24, weightMl: 600, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_aqv_3', sku: 'P022', name: 'Aquaviva Bottle 1500ml Carton (12 Bottles)', category: 'MINERAL', brand: 'Aquaviva', costPrice: 22500, sellPrice: 26000, posPrice: 26000, pwaPrice: 26000, stock: 20, itemsPerCarton: 12, weightMl: 1500, isActive: true, isPosVisible: true, isPwaVisible: true },
    ],
  },
  {
    id: 'grp_aspen_mineral',
    name: 'Aspen Mineral',
    category: 'MINERAL',
    brand: 'Aspen Mineral',
    hasVariants: true,
    sellPriceRange: 'Rp 19.500 - Rp 23.000',
    totalStock: 2,
    variants: [
      { id: 'v_asp_1', sku: 'P025', name: 'Aspen Cup 240ml Carton (48 Cups)', category: 'MINERAL', brand: 'Aspen Mineral', costPrice: 16000, sellPrice: 19500, posPrice: 19500, pwaPrice: 19500, stock: 1, itemsPerCarton: 48, weightMl: 240, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_asp_2', sku: 'P026', name: 'Aspen Bottle 330ml Carton (24 Bottles)', category: 'MINERAL', brand: 'Aspen Mineral', costPrice: 17500, sellPrice: 21000, posPrice: 21000, pwaPrice: 21000, stock: 0, itemsPerCarton: 24, weightMl: 330, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_asp_3', sku: 'P027', name: 'Aspen Bottle 600ml Carton (24 Bottles)', category: 'MINERAL', brand: 'Aspen Mineral', costPrice: 18000, sellPrice: 22000, posPrice: 22000, pwaPrice: 22000, stock: 1, itemsPerCarton: 24, weightMl: 600, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_asp_4', sku: 'P028', name: 'Aspen Bottle 1500ml Carton (12 Bottles)', category: 'MINERAL', brand: 'Aspen Mineral', costPrice: 19000, sellPrice: 23000, posPrice: 23000, pwaPrice: 23000, stock: 0, itemsPerCarton: 12, weightMl: 1500, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_asp_5', sku: 'P029', name: 'Aspen Gallon 19L Refill', category: 'MINERAL', brand: 'Aspen Mineral', costPrice: 17000, sellPrice: 20000, posPrice: 20000, pwaPrice: 20000, stock: 0, itemsPerCarton: 1, weightMl: 19000, isActive: true, isPosVisible: true, isPwaVisible: true },
    ],
  },
  {
    id: 'grp_coca_mini',
    name: 'Coca Cola Mini 250ml',
    category: 'COLA',
    brand: 'Coca Cola',
    hasVariants: true,
    sellPriceRange: 'Rp 33.000',
    totalStock: 6,
    variants: [
      { id: 'v_ccm_1', sku: 'P035', name: 'Coca Cola Mini Can 250ml (12 Cans)', category: 'COLA', brand: 'Coca Cola', costPrice: 28500, sellPrice: 33000, posPrice: 33000, pwaPrice: 33000, stock: 3, itemsPerCarton: 12, weightMl: 250, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_ccm_2', sku: 'P036', name: 'Fanta Mini Can 250ml (12 Cans)', category: 'COLA', brand: 'Coca Cola', costPrice: 28500, sellPrice: 33000, posPrice: 33000, pwaPrice: 33000, stock: 2, itemsPerCarton: 12, weightMl: 250, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_ccm_3', sku: 'P037', name: 'Sprite Mini Can 250ml (12 Cans)', category: 'COLA', brand: 'Coca Cola', costPrice: 28500, sellPrice: 33000, posPrice: 33000, pwaPrice: 33000, stock: 1, itemsPerCarton: 12, weightMl: 250, isActive: true, isPosVisible: true, isPwaVisible: true },
    ],
  },
  {
    id: 'grp_coca_seru',
    name: 'Coca Cola Seru 390ml',
    sku: 'P040',
    category: 'COLA',
    brand: 'Coca Cola',
    hasVariants: false,
    costPrice: 26000,
    sellPrice: 30000,
    posPrice: 30000,
    pwaPrice: 30000,
    totalStock: 14,
    itemsPerCarton: 12,
    weightMl: 390,
    isActive: true,
    isPosVisible: true,
    isPwaVisible: true,
  },
  {
    id: 'grp_djinggo_esteler',
    name: 'Djinggo Es Teler Carton',
    sku: 'P050',
    category: 'FLAVORED',
    brand: 'Djinggo',
    hasVariants: false,
    costPrice: 17500,
    sellPrice: 20000,
    posPrice: 20000,
    pwaPrice: 20000,
    totalStock: 41,
    itemsPerCarton: 24,
    weightMl: 200,
    isActive: true,
    isPosVisible: true,
    isPwaVisible: true,
  },
  {
    id: 'grp_es_teler',
    name: 'Es Teler Cup Carton',
    sku: 'P046',
    category: 'FLAVORED',
    brand: 'Es Teler',
    hasVariants: false,
    costPrice: 18700,
    sellPrice: 20000,
    posPrice: 20000,
    pwaPrice: 20000,
    totalStock: 0,
    itemsPerCarton: 24,
    weightMl: 200,
    isActive: true,
    isPosVisible: true,
    isPwaVisible: true,
  },
  {
    id: 'grp_floridina',
    name: 'Floridina',
    category: 'FLAVORED',
    brand: 'Floridina',
    hasVariants: true,
    sellPriceRange: 'Rp 30.000',
    totalStock: 49,
    variants: [
      { id: 'v_flr_1', sku: 'P055', name: 'Floridina Orange Bottle 350ml Carton (12 Bottles)', category: 'FLAVORED', brand: 'Floridina', costPrice: 25000, sellPrice: 30000, posPrice: 30000, pwaPrice: 30000, stock: 27, itemsPerCarton: 12, weightMl: 350, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_flr_2', sku: 'P056', name: 'Floridina Coco Orange Bottle 350ml Carton (12 Bottles)', category: 'FLAVORED', brand: 'Floridina', costPrice: 25000, sellPrice: 30000, posPrice: 30000, pwaPrice: 30000, stock: 22, itemsPerCarton: 12, weightMl: 350, isActive: true, isPosVisible: true, isPwaVisible: true },
    ],
  },
  {
    id: 'grp_gas',
    name: 'LPG Gas Cylinders',
    category: 'GAS',
    brand: 'Pertamina',
    hasVariants: true,
    costPriceRange: 'Rp 16.000 - Rp 215.000',
    sellPriceRange: 'Rp 17.500 - Rp 240.000',
    totalStock: 46,
    variants: [
      { id: 'v_gas_1', sku: 'P060', name: 'Gas LPG 3 Kg Melon Refill', category: 'GAS', brand: 'Pertamina', costPrice: 16000, sellPrice: 17500, posPrice: 17500, pwaPrice: 17500, stock: 36, itemsPerCarton: 1, weightMl: 3000, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_gas_2', sku: 'P061', name: 'Gas Bright Gas 12 Kg Cylinder Refill', category: 'GAS', brand: 'Pertamina', costPrice: 215000, sellPrice: 240000, posPrice: 240000, pwaPrice: 240000, stock: 10, itemsPerCarton: 1, weightMl: 12000, isActive: true, isPosVisible: true, isPwaVisible: true },
    ],
  },
  {
    id: 'grp_golda',
    name: 'Golda Coffee Bottle Carton',
    sku: 'P031',
    category: 'COFFEE',
    brand: 'Golda Coffee',
    hasVariants: false,
    costPrice: 33579,
    sellPrice: 36000,
    posPrice: 36000,
    pwaPrice: 36000,
    totalStock: 24,
    itemsPerCarton: 12,
    weightMl: 200,
    isActive: true,
    isPosVisible: true,
    isPwaVisible: true,
  },
  {
    id: 'grp_good_day',
    name: 'Good Day Coffee',
    category: 'COFFEE',
    brand: 'Good Day',
    hasVariants: true,
    sellPriceRange: 'Rp 5.500 - Rp 120.000',
    totalStock: 0,
    variants: [
      { id: 'v_gdy_1', sku: 'P065', name: 'Good Day Cappuccino Strip (10 Sachets)', category: 'COFFEE', brand: 'Good Day', costPrice: 4500, sellPrice: 5500, posPrice: 5500, pwaPrice: 5500, stock: 0, itemsPerCarton: 10, weightMl: 25, isActive: true, isPosVisible: true, isPwaVisible: true },
      { id: 'v_gdy_2', sku: 'P066', name: 'Good Day Mocacinno Carton (24 Cans)', category: 'COFFEE', brand: 'Good Day', costPrice: 105000, sellPrice: 120000, posPrice: 120000, pwaPrice: 120000, stock: 0, itemsPerCarton: 24, weightMl: 250, isActive: true, isPosVisible: true, isPwaVisible: true },
    ],
  },
];

export interface ProductCartonManagerProps {
  initialSubTab?: ProductCartonTabType;
  initialViewMode?: 'table' | 'add_product';
}

export const ProductCartonManager: React.FC<ProductCartonManagerProps> = ({
  initialSubTab,
  initialViewMode,
}) => {
  const { language, t, currencyMode, formatCurrency } = useLanguage();
  const [activeTab, setActiveTab] = useState<ProductCartonTabType>(
    initialSubTab || 'list'
  );
  const [products, setProducts] = useState<ProductGroupItem[]>(() => productsToGroups([]));
  const hasCheckedSeedRef = useRef(false);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Single Source of Truth: Listen to Firestore 'products' collection
  useEffect(() => {
    let isMounted = true;
    const colRef = collection(db, 'products');

    const unsubscribe = onSnapshot(
      colRef,
      async (snapshot) => {
        if (!isMounted) return;

        const firestoreProducts = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Product[];

        // Seed sekali: varian master yang sku-nya belum ada di `products` ditambahkan (id=sku)
        // Produk POS yang ada jangan diubah.
        if (!hasCheckedSeedRef.current) {
          hasCheckedSeedRef.current = true;
          try {
            const metaRef = doc(db, 'meta', 'seed_master_products');
            const metaSnap = await getDoc(metaRef);

            if (!metaSnap.exists()) {
              const existingSkus = new Set(
                firestoreProducts
                  .map((p) => (p.sku || p.id || '').toUpperCase().trim())
                  .filter(Boolean)
              );

              const allMasterVariants = extractVariantsFromGroups(INITIAL_MASTER_PRODUCTS);
              const missingVariants = allMasterVariants.filter(
                (mv) => !existingSkus.has((mv.sku || mv.id || '').toUpperCase().trim())
              );

              if (missingVariants.length > 0) {
                const batch = writeBatch(db);
                const nowISO = new Date().toISOString();

                for (const variant of missingVariants) {
                  const targetId = variant.sku || variant.id;
                  const docRef = doc(colRef, targetId);
                  const newProduct = variantToProduct(variant, {
                    id: targetId,
                    storeId: DEMO_STORE_ID,
                    createdAt: nowISO,
                    updatedAt: nowISO,
                  });
                  batch.set(docRef, newProduct);
                }

                batch.set(metaRef, {
                  seededAt: nowISO,
                  count: missingVariants.length,
                  storeId: DEMO_STORE_ID,
                });

                await batch.commit();
                // onSnapshot will fire again with seeded documents
                return;
              } else {
                await setDoc(metaRef, {
                  seededAt: new Date().toISOString(),
                  count: 0,
                  storeId: DEMO_STORE_ID,
                });
              }
            }
          } catch (seedErr) {
            console.warn('[ProductCartonManager] Seed master products error:', seedErr);
          }
        }

        setProducts(productsToGroups(firestoreProducts));
      },
      (error) => {
        console.warn('[ProductCartonManager] Products snapshot error:', error);
        if (isMounted) {
          // Fallback to local master products so UI never crashes
          setProducts(INITIAL_MASTER_PRODUCTS);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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
  const [stockInRecords, setStockInRecords] = useState([
    { id: 'DO-202610-091', date: '09/10/2026 10:15', product: 'Aqua Carton 240ml Cup', qty: 50, supplier: 'PT Tirta Distribusi Jaya', status: 'Recorded' },
    { id: 'DO-202610-088', date: '08/10/2026 14:30', product: 'LPG Gas 3 Kg Melon', qty: 40, supplier: 'Agen Gas Pertamina Mitra', status: 'Recorded' },
  ]);

  const [stockOutRecords, setStockOutRecords] = useState([
    { id: 'OUT-202610-044', date: '09/10/2026 12:40', product: 'Aqua Gallon 19L Refill', qty: 12, dest: 'Store POS Sales', status: 'Dispensed' },
    { id: 'OUT-202610-041', date: '09/10/2026 09:15', product: 'Floridina Orange 350ml Carton', qty: 5, dest: 'PWA Client Wholesale', status: 'Dispensed' },
  ]);

  // Interactive Modals State
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProductGroupItem | null>(null);
  const [adjustingStockGroup, setAdjustingStockGroup] = useState<ProductGroupItem | null>(null);
  const [stockAdjustQty, setStockAdjustQty] = useState<number>(10);
  const [stockAdjustReason, setStockAdjustReason] = useState<string>('Penyesuaian Fisik Toko');

  // Package Modal State (Buat Paket Dus Baru)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [selectedPackageSku, setSelectedPackageSku] = useState<string>('');
  const [packagePiecesPerCarton, setPackagePiecesPerCarton] = useState<number>(24);
  const [packagePricePerCarton, setPackagePricePerCarton] = useState<number>(0);

  // Category Modal State (+ Tambah Kategori)
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryIcon, setNewCategoryIcon] = useState<string>('📦');
  const [customCategories, setCustomCategories] = useState<
    Array<{ key: string; name: string; icon: string; color: string; border: string }>
  >([]);

  // Listen to Firestore 'categories' collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const cats = snapshot.docs.map((d) => ({
        key: d.id,
        name: d.data().name || d.id,
        icon: d.data().icon || '📦',
        color: 'from-purple-600/20 to-indigo-600/20',
        border: 'border-purple-500/30',
      }));
      setCustomCategories(cats);
    });
    return () => unsub();
  }, []);

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
  const [simProductSku, setSimProductSku] = useState<string>('P031');
  const [simQty, setSimQty] = useState<number>(2);
  const [simUnitType, setSimUnitType] = useState<'carton' | 'unit'>('carton');
  const [simCustomerType, setSimCustomerType] = useState<string>('CUST-VIP');
  const [availableCustomerTypes, setAvailableCustomerTypes] = useState<CustomerType[]>([
    {
      id: 'TYPE-01',
      storeId: 'store_001',
      name: 'MEMBER VIP PWA',
      code: 'CUST-VIP',
      discountRate: 5,
      pointMultiplier: 2,
      status: 'active',
    },
    {
      id: 'TYPE-02',
      storeId: 'store_001',
      name: 'WHOLESALE / GROSIR',
      code: 'CUST-WHL',
      discountRate: 10,
      pointMultiplier: 1.5,
      status: 'active',
    },
    {
      id: 'TYPE-03',
      storeId: 'store_001',
      name: 'REGULER / UMUM',
      code: 'CUST-REG',
      discountRate: 0,
      pointMultiplier: 1,
      status: 'active',
    },
  ]);
  const [packageCategoryFilter, setPackageCategoryFilter] = useState<string>('ALL');

  // Real-time synchronization of customer_types for Harga Diskon simulator
  useEffect(() => {
    try {
      const typesColRef = collection(db, 'stores', 'store_001', 'customer_types');
      const unsub = onSnapshot(
        typesColRef,
        (snap) => {
          if (!snap.empty) {
            const typesList: CustomerType[] = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<CustomerType, 'id'>),
            }));
            setAvailableCustomerTypes(typesList);
          }
        },
        (err) => {
          console.warn('[ProductCartonManager] customer_types snapshot error:', err);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('[ProductCartonManager] listener setup error:', e);
    }
  }, []);

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
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    if (!editingGroup.name.trim()) {
      showToast('Nama produk wajib diisi!');
      return;
    }

    const costPrice = Number(editingGroup.costPrice) || 0;
    const posPrice = Number(editingGroup.posPrice ?? editingGroup.sellPrice) || 0;
    const pwaPrice = Number(editingGroup.pwaPrice ?? editingGroup.sellPrice) || 0;
    const sellPrice = posPrice;

    if (costPrice < 0 || posPrice < 0 || pwaPrice < 0 || sellPrice < 0) {
      showToast('Harga dan modal tidak boleh bernilai negatif (≥ 0)!');
      return;
    }

    try {
      if (editingGroup.hasVariants && editingGroup.variants && editingGroup.variants.length > 0) {
        for (const v of editingGroup.variants) {
          const docId = v.sku || v.id;
          await updateDoc(doc(db, 'products', docId), {
            name: editingGroup.name,
            category: editingGroup.category,
            brand: editingGroup.brand || '',
            costPerUnit: costPrice,
            pricePerUnit: posPrice,
            piecesPerCarton: Number(editingGroup.itemsPerCarton) || v.itemsPerCarton || 1,
            weightMl: Number(editingGroup.weightMl) || v.weightMl || 0,
            stockInUnits: Number(editingGroup.totalStock) || 0,
            isActive: editingGroup.isActive !== false,
            isPosVisible: editingGroup.isPosVisible !== false,
            isPwaVisible: editingGroup.isPwaVisible !== false,
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        const docId = editingGroup.sku || editingGroup.id.replace(/^grp_/, '');
        await updateDoc(doc(db, 'products', docId), {
          name: editingGroup.name,
          category: editingGroup.category,
          brand: editingGroup.brand || '',
          sku: editingGroup.sku || docId,
          costPerUnit: costPrice,
          pricePerUnit: posPrice,
          piecesPerCarton: Number(editingGroup.itemsPerCarton) || 1,
          weightMl: Number(editingGroup.weightMl) || 0,
          stockInUnits: Number(editingGroup.totalStock) || 0,
          isActive: editingGroup.isActive !== false,
          isPosVisible: editingGroup.isPosVisible !== false,
          isPwaVisible: editingGroup.isPwaVisible !== false,
          updatedAt: new Date().toISOString(),
        });
      }

      showToast(`Produk "${editingGroup.name}" berhasil diperbarui!`);
      setEditingGroup(null);
    } catch (err: any) {
      console.warn('Error updating product in Firestore:', err);
      showToast(`Gagal memperbarui produk: ${err.message || err}`);
    }
  };

  // Handle Save Stock Adjustment
  const handleSaveStockAdjustment = async (delta: number, reason?: string) => {
    if (!adjustingStockGroup) return;

    const newStock = adjustingStockGroup.totalStock + delta;
    if (newStock < 0) {
      showToast('Stok tidak boleh kurang dari 0!');
      return;
    }

    const adjustmentReason = reason || stockAdjustReason || 'Penyesuaian Fisik Toko';

    try {
      const targetDocId =
        adjustingStockGroup.hasVariants && adjustingStockGroup.variants && adjustingStockGroup.variants.length > 0
          ? (adjustingStockGroup.variants[0].sku || adjustingStockGroup.variants[0].id)
          : (adjustingStockGroup.sku || adjustingStockGroup.id.replace(/^grp_/, ''));

      // 1. updateDoc stockInUnits
      await updateDoc(doc(db, 'products', targetDocId), {
        stockInUnits: newStock,
        updatedAt: new Date().toISOString(),
      });

      // 2. Buat 1 dokumen stock_movements berfield sama dengan item stockCards di InventoryTrackingModule
      const movementRef = doc(collection(db, 'stock_movements'));
      await setDoc(movementRef, {
        id: `MUT-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB',
        productName: adjustingStockGroup.name,
        sku: adjustingStockGroup.sku || targetDocId,
        location: 'RiskCart Flagship Store',
        mutationType: delta >= 0 ? 'MASUK' : 'KELUAR',
        refDoc: `ADJ #STK-${Date.now().toString().slice(-4)}`,
        qtyChange: delta,
        runningBalance: newStock,
        actor: 'Admin / Kasir',
        notes: adjustmentReason,
        storeId: DEMO_STORE_ID,
        createdAt: new Date().toISOString(),
      });

      showToast(`Stok ${adjustingStockGroup.name} disesuaikan: ${delta >= 0 ? '+' : ''}${delta} unit!`);
      setAdjustingStockGroup(null);
    } catch (err: any) {
      console.warn('Error saving stock adjustment:', err);
      showToast(`Gagal menyesuaikan stok: ${err.message || err}`);
    }
  };

  // Handle Save Package (Buat Paket Dus Baru)
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackageSku) {
      showToast('Pilih produk terlebih dahulu!');
      return;
    }
    try {
      await updateDoc(doc(db, 'products', selectedPackageSku), {
        piecesPerCarton: Number(packagePiecesPerCarton) || 1,
        pricePerCarton: Number(packagePricePerCarton) || 0,
        updatedAt: new Date().toISOString(),
      });
      showToast('Paket dus berhasil diperbarui di Firestore!');
      setIsPackageModalOpen(false);
    } catch (err: any) {
      console.warn('Error updating package in Firestore:', err);
      showToast(`Gagal menyimpan paket: ${err.message || err}`);
    }
  };

  // Handle Save New Category (+ Tambah Kategori)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      showToast('Nama kategori wajib diisi!');
      return;
    }
    const catKey = newCategoryName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
    try {
      await setDoc(doc(db, 'categories', catKey), {
        name: newCategoryName.trim(),
        icon: newCategoryIcon || '📦',
        createdAt: new Date().toISOString(),
      });
      showToast(`Kategori "${newCategoryName}" berhasil ditambahkan!`);
      setNewCategoryName('');
      setIsAddCategoryModalOpen(false);
    } catch (err: any) {
      console.warn('Error saving category to Firestore:', err);
      showToast(`Gagal menambah kategori: ${err.message || err}`);
    }
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
  const handleDeleteProduct = async (groupId: string) => {
    if (confirm('Delete this product from catalog?')) {
      try {
        const targetGroup = products.find((p) => p.id === groupId);
        if (targetGroup && targetGroup.hasVariants && targetGroup.variants) {
          for (const v of targetGroup.variants) {
            await deleteDoc(doc(db, 'products', v.sku || v.id));
          }
        } else {
          const docId = targetGroup?.sku || groupId.replace(/^grp_/, '');
          await deleteDoc(doc(db, 'products', docId));
        }
        setActiveDropdownId(null);
        showToast('Product successfully removed from Firestore.');
      } catch (err: any) {
        console.warn('Error deleting product from Firestore:', err);
        showToast(`Gagal menghapus produk: ${err.message || err}`);
      }
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
    showToast('Product catalog synchronized with Firestore!');
  };

  const isDateRangeInvalid = Boolean(startDate && endDate && startDate > endDate);

  const checkDateMatch = (createdAt?: string): boolean => {
    if (!createdAt) return true; // tanpa createdAt selalu ikut
    if (isDateRangeInvalid) return true; // jika awal > akhir, jangan filter out
    const itemDate = createdAt.slice(0, 10);
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    return true;
  };

  // Filtering
  const filteredProducts = products
    .map((group) => {
      if (group.hasVariants && group.variants) {
        const matchingVariants = group.variants.filter((v) => {
          if (!checkDateMatch(v.createdAt || group.createdAt)) return false;

          if (!searchTerm) return true;
          const term = searchTerm.toLowerCase();
          return (
            v.name.toLowerCase().includes(term) ||
            v.sku.toLowerCase().includes(term) ||
            v.category.toLowerCase().includes(term) ||
            v.brand.toLowerCase().includes(term) ||
            group.name.toLowerCase().includes(term)
          );
        });

        return {
          ...group,
          variants: matchingVariants,
        };
      }
      return group;
    })
    .filter((p) => {
      if (p.hasVariants) {
        if (!p.variants || p.variants.length === 0) return false;
        if (activeTab === 'kritis') {
          const remainingStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
          return remainingStock <= 5;
        }
        return true;
      }

      // Standalone product
      if (!checkDateMatch(p.createdAt)) return false;

      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      if (activeTab === 'kritis') {
        return p.totalStock <= 5;
      }

      return true;
    });

  // Count total displayed products
  const totalCount = filteredProducts.reduce((acc, p) => acc + (p.hasVariants && p.variants ? p.variants.length : 1), 0);

  const isDark = tableTheme === 'dark';

  const handleSaveAddProductForm = async (newProduct: ProductGroupItem, addAnother = false) => {
    try {
      const nowISO = new Date().toISOString();
      if (newProduct.hasVariants && newProduct.variants && newProduct.variants.length > 0) {
        for (const v of newProduct.variants) {
          const sku = v.sku || v.id;
          const prod = variantToProduct(v, {
            id: sku,
            sku,
            brand: v.brand || newProduct.brand,
            category: v.category || newProduct.category,
            createdAt: nowISO,
            updatedAt: nowISO,
          });
          await setDoc(doc(db, 'products', sku), prod);
        }
      } else {
        const sku = newProduct.sku || newProduct.id.replace(/^grp_/, '');
        const prod = variantToProduct(
          { ...newProduct, stock: newProduct.totalStock },
          {
            id: sku,
            sku,
            createdAt: nowISO,
            updatedAt: nowISO,
          }
        );
        await setDoc(doc(db, 'products', sku), prod);
      }

      showToast(`Produk "${newProduct.name}" berhasil disimpan ke Firestore!`);
      if (!addAnother) {
        setViewMode('table');
      }
    } catch (err: any) {
      console.warn('Error saving product to Firestore:', err);
      showToast(`Gagal menyimpan produk: ${err.message || err}`);
    }
  };

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
          onSubmit={(newProduct) => handleSaveAddProductForm(newProduct, false)}
          onSaveAndAddAnother={(newProduct) => handleSaveAddProductForm(newProduct, true)}
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
            <span>{t('product_management', 'Halaman Produk')}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {language === 'en'
              ? 'Manage product catalog, carton/box packaging conversions, and pricing variants in real-time.'
              : 'Pusat kelola List Produk, Paket Produk (Dus/Karton), Kategori & Brand, serta Pengaturan Harga Diskon.'}
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
            <span>{t('add_product', 'Tambah Produk')}</span>
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
          {/* 1. Product List */}
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
            <span>Product List</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-white font-mono">
              {totalCount}
            </span>
          </button>

          {/* 2. Product Bundles (Paket Produk) */}
          <button
            onClick={() => setActiveTab('paket')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'paket'
                ? isDark
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-600 text-white shadow-xs'
                : isDark
                ? 'hover:text-white hover:bg-zinc-800/50'
                : 'hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Bundles</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-white font-mono">
              Paket Produk
            </span>
          </button>

          {/* 3. Categories & Brands */}
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
            <span>Categories &amp; Brands</span>
          </button>

          {/* 4. Discount Pricing */}
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
            <span>Discount Pricing</span>
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
            Inflow
          </button>
          <button
            onClick={() => setActiveTab('keluar')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'keluar' ? 'bg-zinc-800 text-white font-bold' : 'hover:text-white'
            }`}
          >
            Outflow
          </button>
          <button
            onClick={() => setActiveTab('opname')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'opname' ? 'bg-zinc-800 text-white font-bold' : 'hover:text-white'
            }`}
          >
            Audit
          </button>
          <button
            onClick={() => setActiveTab('pergerakan')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'pergerakan' ? 'bg-zinc-800 text-white font-bold' : 'hover:text-white'
            }`}
          >
            Movements
          </button>
          <button
            onClick={() => setActiveTab('kritis')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
              activeTab === 'kritis' ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800' : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Critical</span>
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
                ref={startDateInputRef}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-32 px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                  isDark
                    ? 'border-zinc-800 bg-zinc-950 text-zinc-200 [color-scheme:dark]'
                    : 'border-slate-200 bg-slate-50 text-slate-700 [color-scheme:light]'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  try {
                    startDateInputRef.current?.showPicker();
                  } catch {
                    startDateInputRef.current?.focus();
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-blue-400 cursor-pointer p-0.5"
                title="Pilih tanggal mulai"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            <span className="text-[11px] font-medium">To</span>
            <div className="relative">
              <input
                ref={endDateInputRef}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-32 px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                  isDark
                    ? 'border-zinc-800 bg-zinc-950 text-zinc-200 [color-scheme:dark]'
                    : 'border-slate-200 bg-slate-50 text-slate-700 [color-scheme:light]'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  try {
                    endDateInputRef.current?.showPicker();
                  } catch {
                    endDateInputRef.current?.focus();
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-blue-400 cursor-pointer p-0.5"
                title="Pilih tanggal akhir"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tombol Reset */}
          <button
            type="button"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            disabled={!startDate && !endDate}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
                : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Reset filter tanggal"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          {/* N Products Counter */}
          <div
            className={`px-3 py-1.5 rounded-lg border font-bold text-xs ${
              isDark
                ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            {totalCount} products
          </div>

          {/* Pesan kecil bila awal > akhir */}
          {isDateRangeInvalid && (
            <span className="text-[11px] text-rose-400 font-medium">
              Tanggal awal tidak boleh lebih besar dari tanggal akhir
            </span>
          )}
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
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroup(group.id);
                              }}
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
                          ? formatCurrency(group.costPrice)
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
                          ? formatCurrency(group.sellPrice)
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
                                const v = group.variants?.[0];
                                setEditingGroup({
                                  ...group,
                                  sku: group.sku || v?.sku || `SKU-${group.id.toUpperCase()}`,
                                  costPrice: group.costPrice ?? v?.costPrice ?? 20000,
                                  sellPrice: group.sellPrice ?? v?.sellPrice ?? 25000,
                                  posPrice: group.posPrice ?? v?.posPrice ?? group.sellPrice ?? 25000,
                                  pwaPrice: group.pwaPrice ?? v?.pwaPrice ?? 25000,
                                  itemsPerCarton: group.itemsPerCarton ?? v?.itemsPerCarton ?? 24,
                                  weightMl: group.weightMl ?? v?.weightMl ?? 600,
                                  isActive: group.isActive !== false,
                                  isPosVisible: group.isPosVisible !== false,
                                  isPwaVisible: group.isPwaVisible !== false,
                                });
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
                            {formatCurrency(v.costPrice)}
                          </td>

                          {/* Selling Price */}
                          <td
                            className={`py-2.5 px-3 font-mono text-[11px] font-medium ${
                              isDark ? 'text-zinc-200' : 'text-slate-800'
                            }`}
                          >
                            {formatCurrency(v.sellPrice)}
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
                              onClick={() => {
                                const v = group.variants?.[0];
                                setEditingGroup({
                                  ...group,
                                  sku: group.sku || v?.sku || `SKU-${group.id.toUpperCase()}`,
                                  costPrice: group.costPrice ?? v?.costPrice ?? 20000,
                                  sellPrice: group.sellPrice ?? v?.sellPrice ?? 25000,
                                  posPrice: group.posPrice ?? v?.posPrice ?? group.sellPrice ?? 25000,
                                  pwaPrice: group.pwaPrice ?? v?.pwaPrice ?? 25000,
                                  itemsPerCarton: group.itemsPerCarton ?? v?.itemsPerCarton ?? 24,
                                  weightMl: group.weightMl ?? v?.weightMl ?? 600,
                                  isActive: group.isActive !== false,
                                  isPosVisible: group.isPosVisible !== false,
                                  isPwaVisible: group.isPwaVisible !== false,
                                });
                              }}
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
      {/* 2. TAB: PAKET PRODUK (Product Bundles Directory & Add Bundle View)        */}
      {/* ========================================================================= */}
      {activeTab === 'paket' && (
        <div className="space-y-4 animate-in fade-in">
          <ProductBundlesModule currencyMode={currencyMode} />
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
                onClick={() => setIsAddCategoryModalOpen(true)}
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
                ...customCategories,
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
      {/* ========================================================================= */}
      {/* 4. TAB: HARGA DISKON (Discount Pricing Directory & Add Form)              */}
      {/* ========================================================================= */}
      {activeTab === 'harga_diskon' && (
        <div className="space-y-6 animate-in fade-in">
          <DiscountPricingModule currencyMode={currencyMode} />
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

      {/* ========================================================================= */}
      {/* MODAL: UBAH PAKET & EDIT DETAIL PRODUK                                    */}
      {/* ========================================================================= */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl space-y-4 my-8 text-xs ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between border-b pb-3 ${
                isDark ? 'border-zinc-800' : 'border-slate-100'
              }`}
            >
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  <span>Ubah Paket &amp; Detail Produk</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Perubahan harga dus, isi satuan, modal HPP, dan stok otomatis tersinkronisasi ke POS Terminal Kasir dan PWA Pelanggan.
                </p>
              </div>
              <button
                onClick={() => setEditingGroup(null)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-4">
              {/* Row 1: Nama Produk & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Nama Produk / Paket *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingGroup.name}
                    onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border font-semibold transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'border-zinc-700 bg-zinc-950 text-zinc-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    SKU Produk
                  </label>
                  <input
                    type="text"
                    value={editingGroup.sku || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup, sku: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border font-mono transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'border-zinc-700 bg-zinc-950 text-zinc-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Row 2: Kategori & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Kategori Produk
                  </label>
                  <select
                    value={editingGroup.category}
                    onChange={(e) => setEditingGroup({ ...editingGroup, category: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'border-zinc-700 bg-zinc-950 text-zinc-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  >
                    <option value="MINERAL">MINERAL (Air Mineral & Galon)</option>
                    <option value="FLAVORED">FLAVORED (Minuman Berperisa & Teh)</option>
                    <option value="COLA">COLA (Minuman Soda & Kola)</option>
                    <option value="GAS">GAS (LPG 3Kg & Melon)</option>
                    <option value="COFFEE">COFFEE (Kopi Ready-to-drink)</option>
                    <option value="SNACK">SNACK (Makanan Ringan)</option>
                    <option value="DAIRY">DAIRY (Susu & Olahan Susu)</option>
                    <option value="INSTANT_FOOD">INSTANT FOOD (Mie Instan)</option>
                    <option value="OTHER">OTHER (Kategori Lainnya)</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Merek / Brand
                  </label>
                  <input
                    type="text"
                    value={editingGroup.brand || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup, brand: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'border-zinc-700 bg-zinc-950 text-zinc-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Row 3: Konfigurasi Paket Dus */}
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                <div className="font-bold text-amber-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-amber-400" />
                    Konfigurasi Dus / Karton &amp; Grosir
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Otomatis hitung diskon grosir &amp; hemat pembeli
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">
                      Isi Satuan (Pcs/Dus)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingGroup.itemsPerCarton || 24}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          itemsPerCarton: Math.max(1, Number(e.target.value)),
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">
                      Berat Satuan (ml/gr)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingGroup.weightMl || 600}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          weightMl: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">
                      Berat per Dus
                    </label>
                    <div className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 font-mono font-bold">
                      {(
                        ((editingGroup.weightMl || 600) * (editingGroup.itemsPerCarton || 24)) /
                        1000
                      ).toFixed(1)}{' '}
                      kg
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">
                      Stok Dus Gudang
                    </label>
                    <div className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-emerald-400 font-mono font-bold">
                      {Math.floor(editingGroup.totalStock / (editingGroup.itemsPerCarton || 24))} Dus
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Harga & Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Modal HPP Satuan (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingGroup.costPrice || 0}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, costPrice: Number(e.target.value) })
                    }
                    className={`w-full px-3 py-2 rounded-lg border font-mono transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'border-zinc-700 bg-zinc-950 text-zinc-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    {language === 'en' ? 'Box Cost: ' : 'Modal Dus: '}
                    {formatCurrency(
                      (editingGroup.costPrice || 0) * (editingGroup.itemsPerCarton || 24)
                    )}
                  </span>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    {currencyMode === 'USD'
                      ? 'Standard Retail Price ($) *'
                      : 'Harga Jual Eceran Satuan (Rp) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingGroup.posPrice || editingGroup.sellPrice || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditingGroup({ ...editingGroup, posPrice: val, sellPrice: val });
                    }}
                    className={`w-full px-3 py-2 rounded-lg border font-mono font-bold text-amber-400 transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'border-zinc-700 bg-zinc-950' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    {language === 'en' ? 'Box Retail Value: ' : 'Nilai Eceran Satuan Dus: '}
                    {formatCurrency(
                      (editingGroup.posPrice || editingGroup.sellPrice || 0) *
                      (editingGroup.itemsPerCarton || 24)
                    )}
                  </span>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    {currencyMode === 'USD'
                      ? 'PWA Member / Wholesale Price ($)'
                      : 'Harga Member PWA / Grosir (Rp)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingGroup.pwaPrice || editingGroup.sellPrice || 0}
                    onChange={(e) =>
                      setEditingGroup({ ...editingGroup, pwaPrice: Number(e.target.value) })
                    }
                    className={`w-full px-3 py-2 rounded-lg border font-mono transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'border-zinc-700 bg-zinc-950 text-zinc-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  />
                  <span className="text-[10px] text-emerald-400 mt-0.5 block">
                    {language === 'en' ? 'Box Wholesale Price (~10% Off): ' : 'Harga Grosir Dus (~10% Off): '}
                    {formatCurrency(
                      Math.round(
                        (((editingGroup.posPrice || editingGroup.sellPrice || 0) *
                          (editingGroup.itemsPerCarton || 24) *
                          0.9) /
                          1000)
                      ) * 1000
                    )}
                  </span>
                </div>
              </div>

              {/* Row 5: Total Stok Fisik & Channel Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Total Stok Fisik (Pcs) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingGroup.totalStock}
                    onChange={(e) =>
                      setEditingGroup({
                        ...editingGroup,
                        totalStock: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className={`w-full px-3 py-2 rounded-lg border font-mono font-bold transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'border-zinc-700 bg-zinc-950 text-zinc-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Ketersediaan Channel
                  </label>
                  <div className="flex items-center gap-4 py-2">
                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={editingGroup.isActive !== false}
                        onChange={(e) =>
                          setEditingGroup({ ...editingGroup, isActive: e.target.checked })
                        }
                        className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-400"
                      />
                      <span>Status Aktif</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={editingGroup.isPosVisible !== false}
                        onChange={(e) =>
                          setEditingGroup({ ...editingGroup, isPosVisible: e.target.checked })
                        }
                        className="rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Tampil di POS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={editingGroup.isPwaVisible !== false}
                        onChange={(e) =>
                          setEditingGroup({ ...editingGroup, isPwaVisible: e.target.checked })
                        }
                        className="rounded border-zinc-700 bg-zinc-950 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Tampil di PWA</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className={`flex items-center justify-between pt-4 border-t ${
                  isDark ? 'border-zinc-800' : 'border-slate-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus produk "${editingGroup.name}" dari sistem?`)) {
                      handleDeleteProduct(editingGroup.id);
                      setEditingGroup(null);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 font-semibold text-xs border border-rose-500/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Produk</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingGroup(null)}
                    className={`px-4 py-2 rounded-xl font-semibold cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Simpan Perubahan Paket</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STOCK ADJUSTMENT (PENYESUAIAN STOK FISIK)                          */}
      {/* ========================================================================= */}
      {adjustingStockGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 text-xs ${
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
                  <Package className="w-5 h-5 text-blue-500" />
                  <span>Penyesuaian Stok Fisik</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {adjustingStockGroup.name}
                </p>
              </div>
              <button
                onClick={() => setAdjustingStockGroup(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Stok Sistem Saat Ini:</span>
                <span className="font-mono font-bold text-base text-emerald-400">
                  {adjustingStockGroup.totalStock} pcs
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Alasan Penyesuaian Stok *
                </label>
                <input
                  type="text"
                  value={stockAdjustReason}
                  onChange={(e) => setStockAdjustReason(e.target.value)}
                  placeholder="Contoh: Stok Opname Fisik, Barang Rusak, Koreksi Kasir"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
                  Pilih Cepat Penyesuaian (+/−)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[-10, -5, 5, 10].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => {
                        handleSaveStockAdjustment(delta, stockAdjustReason);
                      }}
                      className={`py-2 rounded-xl font-mono font-bold cursor-pointer transition ${
                        delta > 0
                          ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30'
                          : 'bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30'
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Atau Masukkan Perubahan Jumlah (Delta)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={stockAdjustQty}
                    onChange={(e) => setStockAdjustQty(Number(e.target.value))}
                    placeholder="Contoh: 15 atau -5"
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveStockAdjustment(stockAdjustQty, stockAdjustReason);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BUAT PAKET DUS BARU                                                */}
      {/* ========================================================================= */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 text-xs ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-500" />
                  <span>Buat Paket Dus Baru</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Atur rasio isi per karton dan harga jual grosir paket produk.
                </p>
              </div>
              <button
                onClick={() => setIsPackageModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Pilih Produk *
                </label>
                <select
                  required
                  value={selectedPackageSku}
                  onChange={(e) => {
                    const sku = e.target.value;
                    setSelectedPackageSku(sku);
                    const found = products.find(
                      (p) => p.sku === sku || p.id === sku || (p.variants && p.variants.some((v) => v.sku === sku))
                    );
                    if (found) {
                      const v = found.variants?.find((item) => item.sku === sku);
                      setPackagePiecesPerCarton(v?.itemsPerCarton || found.itemsPerCarton || 24);
                      setPackagePricePerCarton(found.sellPrice ? found.sellPrice * (found.itemsPerCarton || 24) : 0);
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg border font-semibold transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isDark ? 'border-zinc-700 bg-zinc-950 text-zinc-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  <option value="">-- Pilih Produk dari Katalog --</option>
                  {products.flatMap((p) =>
                    p.hasVariants && p.variants
                      ? p.variants.map((v) => (
                          <option key={v.sku} value={v.sku}>
                            [{v.sku}] {v.name}
                          </option>
                        ))
                      : [
                          <option key={p.sku || p.id} value={p.sku || p.id}>
                            [{p.sku || p.id}] {p.name}
                          </option>,
                        ]
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Isi Satuan per Dus (Pieces) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={packagePiecesPerCarton}
                    onChange={(e) => setPackagePiecesPerCarton(Math.max(1, Number(e.target.value)))}
                    className={`w-full px-3 py-2 rounded-lg border font-mono font-bold transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'border-zinc-700 bg-zinc-950 text-zinc-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">Contoh: 12, 24, 40 pcs/dus</span>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Harga Jual per Dus / Karton (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={packagePricePerCarton}
                    onChange={(e) => setPackagePricePerCarton(Math.max(0, Number(e.target.value)))}
                    className={`w-full px-3 py-2 rounded-lg border font-mono font-bold text-amber-400 transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDark ? 'border-zinc-700 bg-zinc-950' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">Harga grosir 1 dus utuh</span>
                </div>
              </div>

              <div className={`flex items-center justify-end gap-2 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-semibold cursor-pointer ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Simpan Paket Dus</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH KATEGORI PRODUK                                             */}
      {/* ========================================================================= */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 text-xs ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-400" />
                  <span>Tambah Kategori Produk</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Tambahkan kategori baru yang otomatis tersimpan ke Firestore `categories`.
                </p>
              </div>
              <button
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Frozen Food, Roti & Kue, Rokok"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border font-semibold transition focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    isDark ? 'border-zinc-700 bg-zinc-950 text-zinc-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Ikon Emoji
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    className={`w-16 text-center text-xl px-2 py-1.5 rounded-lg border transition ${
                      isDark ? 'border-zinc-700 bg-zinc-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {['🧊', '🥐', '🍫', '🍹', '🧴', '🧼', '📦', '🥫', '🍚', '🍞'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewCategoryIcon(emoji)}
                        className={`w-8 h-8 rounded-lg border text-sm flex items-center justify-center transition cursor-pointer ${
                          newCategoryIcon === emoji
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-zinc-800 hover:bg-zinc-800'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`flex items-center justify-end gap-2 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-semibold cursor-pointer ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Simpan Kategori</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD STOCK IN (INBOUND SUPPLY)                                   */}
      {/* ========================================================================= */}
      {isStockInModalOpen && (
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
                  <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                  <span>Penerimaan Barang Masuk (Stock In)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Catat pengiriman dus dari distributor dan tambah stok gudang secara otomatis.
                </p>
              </div>
              <button
                onClick={() => setIsStockInModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordStockIn} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Pilih Produk Masuk *
                </label>
                <select
                  value={stockInForm.productName}
                  onChange={(e) => setStockInForm({ ...stockInForm, productName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} (Stok: {p.totalStock} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Jumlah Karton / Dus Masuk *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockInForm.qty}
                    onChange={(e) => setStockInForm({ ...stockInForm, qty: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Pemasok / Distributor *
                  </label>
                  <input
                    type="text"
                    required
                    value={stockInForm.supplier}
                    onChange={(e) => setStockInForm({ ...stockInForm, supplier: e.target.value })}
                    placeholder="e.g. PT Tirta Distribusi Jaya"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsStockInModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Simpan Barang Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD STOCK OUT (OUTBOUND DISPATCH)                               */}
      {/* ========================================================================= */}
      {isStockOutModalOpen && (
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
                  <ArrowUpRight className="w-5 h-5 text-amber-400" />
                  <span>Pengeluaran Stok (Stock Out)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Catat pengeluaran stok untuk kasir POS, order grosir, atau retur barang.
                </p>
              </div>
              <button
                onClick={() => setIsStockOutModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordStockOut} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Pilih Produk Dikeluarkan *
                </label>
                <select
                  value={stockOutForm.productName}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, productName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} (Stok: {p.totalStock} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Jumlah Unit / Dus Keluar *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockOutForm.qty}
                    onChange={(e) => setStockOutForm({ ...stockOutForm, qty: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Tujuan Pengeluaran *
                  </label>
                  <select
                    value={stockOutForm.dest}
                    onChange={(e) => setStockOutForm({ ...stockOutForm, dest: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white"
                  >
                    <option value="Store POS Sales">Store POS Sales</option>
                    <option value="PWA Client Wholesale">PWA Client Wholesale</option>
                    <option value="Transfer Antar Gudang">Transfer Antar Gudang</option>
                    <option value="Barang Rusak / Kadaluarsa">Barang Rusak / Kadaluarsa</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsStockOutModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
