import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Percent,
  DollarSign,
  Clock,
  Layers,
  ChevronRight,
  MoreVertical,
  Edit2,
  Power,
  Sparkles,
  Users,
  Award,
  Wallet,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { DEMO_STORE_ID } from '../../services/dataSeeder';
import { DiscountPriceRule, CustomerType, Product } from '../../types';

interface DiscountPricingModuleProps {
  onBackToDirectory?: () => void;
  currencyMode?: 'IDR' | 'USD';
}

const DEFAULT_CUSTOMER_TYPES = [
  { id: 'TYPE-03', name: 'UMUM', code: 'CUST-REG', discountRate: 0, pointMultiplier: 1 },
  { id: 'TYPE-01', name: 'MEMBER', code: 'CUST-VIP', discountRate: 5, pointMultiplier: 2 },
  { id: 'TYPE-VIP', name: 'VIP', code: 'CUST-VIP', discountRate: 7, pointMultiplier: 2.5 },
  { id: 'TYPE-02', name: 'WHOLESALE', code: 'CUST-WHL', discountRate: 10, pointMultiplier: 1.5 },
  { id: 'TYPE-04', name: 'RESELLER', code: 'CUST-RES', discountRate: 7, pointMultiplier: 1.2 },
];

export const DiscountPricingModule: React.FC<DiscountPricingModuleProps> = ({
  currencyMode = 'IDR',
}) => {
  // Navigation view: 'directory' | 'add_form'
  const [view, setView] = useState<'directory' | 'add_form'>('directory');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Firestore rules state
  const [rules, setRules] = useState<DiscountPriceRule[]>([]);
  const [loadingRules, setLoadingRules] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Products from Firestore 'stores/store_001/products'
  const [productsList, setProductsList] = useState<Product[]>([]);
  // Customer types from Firestore 'stores/store_001/customer_types'
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);

  // Directory filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [createdFromDate, setCreatedFromDate] = useState<string>('');
  const [createdToDate, setCreatedToDate] = useState<string>('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Form states for Add / Edit
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productSearchInput, setProductSearchInput] = useState<string>('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState<boolean>(false);
  const [selectedCustomerTypeId, setSelectedCustomerTypeId] = useState<string>('TYPE-01');
  const [normalPrice, setNormalPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [discountPriceInput, setDiscountPriceInput] = useState<string>('');
  const [minQtyInput, setMinQtyInput] = useState<string>('1');
  const [pointPercentInput, setPointPercentInput] = useState<string>('10');
  const [ruleStatus, setRuleStatus] = useState<'active' | 'inactive'>('active');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Currency Formatter
  const formatMoney = (val: number) => {
    if (currencyMode === 'USD') {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
      if (!target.closest('.product-combobox-container')) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 1. Listen to Firestore discount_prices in real time
  useEffect(() => {
    setLoadingRules(true);
    const storeDiscountPricesCol = collection(db, `stores/${DEMO_STORE_ID}/discount_prices`);
    const unsubscribe = onSnapshot(
      storeDiscountPricesCol,
      (snapshot) => {
        const loaded: DiscountPriceRule[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          loaded.push({
            id: d.id,
            storeId: data.storeId || DEMO_STORE_ID,
            productId: data.productId || '',
            productName: data.productName || 'Unknown Product',
            productSku: data.productSku || '',
            customerTypeId: data.customerTypeId || '',
            customerTypeName: data.customerTypeName || 'UMUM',
            customerTypeCode: data.customerTypeCode || '',
            normalPrice: Number(data.normalPrice || 0),
            costPrice: Number(data.costPrice || 0),
            discountPrice: Number(data.discountPrice || 0),
            minQty: Number(data.minQty || 1),
            marginProfit: Number(data.marginProfit || 0),
            pointPercent: Number(data.pointPercent || 0),
            pointsReward: Number(data.pointsReward || 0),
            status: data.status === 'inactive' ? 'inactive' : 'active',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          });
        });

        // Sort by newest
        loaded.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });

        setRules(loaded);
        setLoadingRules(false);
      },
      (err) => {
        console.warn('Firestore discount_prices listener notice:', err);
        setLoadingRules(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Listen to Products from 'stores/store_001/products'
  useEffect(() => {
    const productsCol = collection(db, `stores/${DEMO_STORE_ID}/products`);
    const unsub = onSnapshot(
      productsCol,
      (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const prodObj: Product = {
            id: docSnap.id,
            storeId: data.storeId || DEMO_STORE_ID,
            name: data.name || 'Unnamed Product',
            sku: data.sku || docSnap.id.slice(0, 7).toUpperCase(),
            category: data.category || 'General',
            barcode: data.barcode || '',
            piecesPerCarton: Number(data.piecesPerCarton || 1),
            stockInUnits: Number(data.stockInUnits ?? data.stock ?? 0),
            costPerUnit: Number(data.costPerUnit ?? data.costPrice ?? 0),
            pricePerUnit: Number(data.pricePerUnit ?? data.price ?? 0),
            pricePerCarton: Number(data.pricePerCarton ?? data.price ?? 0),
            minStockAlert: Number(data.minStockAlert || 5),
            imageUrl: data.imageUrl,
            brand: data.brand,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          };
          list.push(prodObj);
        });
        setProductsList(list);
      },
      (err) => console.warn('Products sync notice:', err)
    );

    return () => unsub();
  }, []);

  // 3. Listen to Customer Types from 'stores/store_001/customer_types'
  useEffect(() => {
    const custTypesCol = collection(db, `stores/${DEMO_STORE_ID}/customer_types`);
    const unsub = onSnapshot(
      custTypesCol,
      (snapshot) => {
        const list: CustomerType[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            storeId: data.storeId || DEMO_STORE_ID,
            name: data.name || 'CUSTOMER TIER',
            code: data.code || 'CUST',
            discountRate: Number(data.discountRate || 0),
            pointMultiplier: Number(data.pointMultiplier || 1),
            status: data.status || 'active',
            description: data.description,
          });
        });

        if (list.length > 0) {
          setCustomerTypes(list);
        } else {
          setCustomerTypes(DEFAULT_CUSTOMER_TYPES as CustomerType[]);
        }
      },
      (err) => {
        console.warn('Customer types listener notice:', err);
        setCustomerTypes(DEFAULT_CUSTOMER_TYPES as CustomerType[]);
      }
    );

    return () => unsub();
  }, []);

  // Manual Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Discount prices synchronized with Firestore', 'info');
    }, 600);
  };

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      // Search product name or customer type
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.productName.toLowerCase().includes(q);
        const matchType = r.customerTypeName.toLowerCase().includes(q);
        const matchSku = (r.productSku || '').toLowerCase().includes(q);
        if (!matchName && !matchType && !matchSku) return false;
      }

      // Date range filtering
      if (createdFromDate) {
        if (!r.createdAt) return false;
        const itemDate = new Date(r.createdAt).toISOString().split('T')[0];
        if (itemDate < createdFromDate) return false;
      }
      if (createdToDate) {
        if (!r.createdAt) return false;
        const itemDate = new Date(r.createdAt).toISOString().split('T')[0];
        if (itemDate > createdToDate) return false;
      }

      return true;
    });
  }, [rules, searchQuery, createdFromDate, createdToDate]);

  // Product Selection handler
  const handleSelectProduct = (prod: Product) => {
    setSelectedProductId(prod.id || '');
    setProductSearchInput(prod.name);
    setIsProductDropdownOpen(false);

    // Auto set normal price and cost price
    const retail = Number(prod.pricePerUnit || 0);
    const cost = Number(prod.costPerUnit || 0);
    setNormalPrice(retail);
    setCostPrice(cost);

    // Suggest discount price if not set
    if (!discountPriceInput) {
      const suggested = Math.round(retail * 0.9);
      setDiscountPriceInput(suggested.toString());
    }

    if (formErrors.product) {
      setFormErrors((prev) => ({ ...prev, product: '' }));
    }
  };

  // Calculated Metrics for the Form
  const discountPriceNum = parseFloat(discountPriceInput) || 0;
  const minQtyNum = parseInt(minQtyInput, 10) || 1;
  const pointPercentNum = parseFloat(pointPercentInput) || 0;

  const marginProfitPerUnit = discountPriceNum - costPrice;
  const calculatedPointsReward = useMemo(() => {
    if (marginProfitPerUnit <= 0 || pointPercentNum <= 0) return 0;
    // Formula: Margin * (PointPercent / 100), rounded to 1 decimal
    const pts = marginProfitPerUnit * (pointPercentNum / 100);
    return Math.round(pts);
  }, [marginProfitPerUnit, pointPercentNum]);

  // Reset Add/Edit Form
  const resetForm = () => {
    setSelectedProductId('');
    setProductSearchInput('');
    setIsProductDropdownOpen(false);
    setSelectedCustomerTypeId(customerTypes[0]?.id || 'TYPE-01');
    setNormalPrice(0);
    setCostPrice(0);
    setDiscountPriceInput('');
    setMinQtyInput('1');
    setPointPercentInput('10');
    setRuleStatus('active');
    setFormErrors({});
    setEditingRuleId(null);
  };

  // Open Form for Add
  const handleOpenAddForm = () => {
    resetForm();
    if (productsList.length > 0) {
      handleSelectProduct(productsList[0]);
    }
    setView('add_form');
  };

  // Open Form for Edit
  const handleOpenEditForm = (rule: DiscountPriceRule) => {
    setEditingRuleId(rule.id || null);
    setSelectedProductId(rule.productId);
    setProductSearchInput(rule.productName);
    setSelectedCustomerTypeId(rule.customerTypeId || customerTypes[0]?.id || 'TYPE-01');
    setNormalPrice(rule.normalPrice);
    setCostPrice(rule.costPrice);
    setDiscountPriceInput(rule.discountPrice.toString());
    setMinQtyInput(rule.minQty.toString());
    setPointPercentInput(rule.pointPercent.toString());
    setRuleStatus(rule.status);
    setFormErrors({});
    setView('add_form');
    setActiveMenuId(null);
  };

  // Toggle Status
  const handleToggleStatus = async (rule: DiscountPriceRule) => {
    if (!rule.id) return;
    try {
      const nextStatus = rule.status === 'active' ? 'inactive' : 'active';
      const ref = doc(db, `stores/${DEMO_STORE_ID}/discount_prices`, rule.id);
      await updateDoc(ref, {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      showToast(`Discount pricing rule marked as ${nextStatus}`, 'success');
    } catch (err: any) {
      console.error('Toggle status error:', err);
      showToast('Failed to update rule status: ' + err.message, 'error');
    }
    setActiveMenuId(null);
  };

  // Delete Rule
  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this discount pricing rule?')) {
      return;
    }
    try {
      const ref = doc(db, `stores/${DEMO_STORE_ID}/discount_prices`, ruleId);
      await deleteDoc(ref);
      showToast('Discount price rule deleted', 'success');
    } catch (err: any) {
      console.error('Delete rule error:', err);
      showToast('Failed to delete rule: ' + err.message, 'error');
    }
    setActiveMenuId(null);
  };

  // Submit Form (Add or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!selectedProductId) {
      errors.product = 'Please select a product from the list.';
    }
    if (!discountPriceNum || discountPriceNum <= 0) {
      errors.discountPrice = 'Discount price must be greater than 0.';
    }
    if (minQtyNum < 1) {
      errors.minQty = 'Minimum quantity must be at least 1.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const matchedProd = productsList.find((p) => p.id === selectedProductId);
      const matchedType = customerTypes.find((t) => t.id === selectedCustomerTypeId) || {
        id: selectedCustomerTypeId,
        name: 'UMUM',
        code: 'CUST-REG',
      };

      const ruleData = {
        storeId: DEMO_STORE_ID,
        productId: selectedProductId,
        productName: matchedProd?.name || productSearchInput,
        productSku: matchedProd?.sku || '',
        customerTypeId: matchedType.id || selectedCustomerTypeId,
        customerTypeName: matchedType.name,
        customerTypeCode: matchedType.code || '',
        normalPrice: normalPrice,
        costPrice: costPrice,
        discountPrice: discountPriceNum,
        minQty: minQtyNum,
        marginProfit: marginProfitPerUnit,
        pointPercent: pointPercentNum,
        pointsReward: calculatedPointsReward,
        status: ruleStatus,
        updatedAt: serverTimestamp(),
      };

      if (editingRuleId) {
        // Update existing document
        const ref = doc(db, `stores/${DEMO_STORE_ID}/discount_prices`, editingRuleId);
        await updateDoc(ref, ruleData);
        showToast('Discount pricing rule updated successfully!', 'success');
      } else {
        // Create new document
        const colRef = collection(db, `stores/${DEMO_STORE_ID}/discount_prices`);
        await addDoc(colRef, {
          ...ruleData,
          createdAt: serverTimestamp(),
        });
        showToast('Discount pricing rule created and synced to Firestore!', 'success');
      }

      resetForm();
      setView('directory');
    } catch (err: any) {
      console.error('Save discount price error:', err);
      showToast('Error saving discount price: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered product suggestions for combobox
  const filteredProducts = useMemo(() => {
    if (!productSearchInput.trim()) return productsList.slice(0, 15);
    const q = productSearchInput.toLowerCase();
    return productsList
      .filter((p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)))
      .slice(0, 15);
  }, [productsList, productSearchInput]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold ${
              toastType === 'success'
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200 shadow-emerald-950/50'
                : toastType === 'error'
                ? 'bg-rose-950/90 border-rose-800 text-rose-200 shadow-rose-950/50'
                : 'bg-blue-950/90 border-blue-800 text-blue-200 shadow-blue-950/50'
            }`}
          >
            {toastType === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastType === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toastType === 'info' && <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: DIRECTORY (LIST OF DISCOUNT PRICES) */}
      {/* ========================================================================= */}
      {view === 'directory' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-md">
                  ADMIN / PRODUCT MANAGEMENT &gt; DISCOUNT PRICING
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Tag className="w-5 h-5 text-blue-400" />
                <span>Discount Pricing (Harga Diskon)</span>
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl">
                Special prices per product for specific customer types and minimum quantities, with automatic profit-based points.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                title="Refresh Discount Pricing list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleOpenAddForm}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Discount Price</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#0f172a]/80 border border-slate-800/80 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search Product */}
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search product name, SKU, or customer tier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Created From */}
              <div className="md:col-span-3 flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 shrink-0">From:</span>
                <input
                  type="date"
                  value={createdFromDate}
                  onChange={(e) => setCreatedFromDate(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-800 focus:border-blue-500 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none transition [color-scheme:dark]"
                />
              </div>

              {/* Created To */}
              <div className="md:col-span-3 flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 shrink-0">To:</span>
                <input
                  type="date"
                  value={createdToDate}
                  onChange={(e) => setCreatedToDate(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-800 focus:border-blue-500 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none transition [color-scheme:dark]"
                />
                {(createdFromDate || createdToDate) && (
                  <button
                    onClick={() => {
                      setCreatedFromDate('');
                      setCreatedToDate('');
                    }}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    title="Reset date filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content: Table or Empty State */}
          {loadingRules ? (
            <div className="p-12 text-center rounded-2xl bg-[#0f172a] border border-slate-800">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-semibold">Loading discount pricing matrix from Firestore...</p>
            </div>
          ) : filteredRules.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-950/40 border border-blue-900/60 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                <Wallet className="w-8 h-8 text-blue-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No discount prices yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {searchQuery || createdFromDate || createdToDate
                    ? 'No discount pricing rules matched your filter criteria. Try resetting search or dates.'
                    : 'Add your first discount pricing rule using the + Add Discount Price button.'}
                </p>
              </div>
              <button
                onClick={handleOpenAddForm}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Discount Price</span>
              </button>
            </div>
          ) : (
            /* Populated Table State */
            <div className="rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#0a0f1d] border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider whitespace-nowrap font-bold">
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-3">Customer Type</th>
                      <th className="py-3 px-3 text-center">Min Qty</th>
                      <th className="py-3 px-3 text-right">Normal Price</th>
                      <th className="py-3 px-3 text-right">Discount Price</th>
                      <th className="py-3 px-3 text-right">Margin / Unit</th>
                      <th className="py-3 px-3 text-center">Points (% of Profit)</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredRules.map((r) => {
                      const isProfitPositive = r.marginProfit > 0;
                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-slate-800/30 transition-colors group whitespace-nowrap"
                        >
                          {/* Product Name */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-white group-hover:text-blue-300 transition-colors">
                              {r.productName}
                            </div>
                            {r.productSku && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                SKU: {r.productSku}
                              </div>
                            )}
                          </td>

                          {/* Customer Type Badge */}
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border ${
                                r.customerTypeName.includes('VIP')
                                  ? 'bg-purple-950/60 border-purple-800 text-purple-300'
                                  : r.customerTypeName.includes('WHOLESALE') || r.customerTypeName.includes('GROSIR')
                                  ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                                  : r.customerTypeName.includes('MEMBER')
                                  ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                            >
                              {r.customerTypeName}
                            </span>
                          </td>

                          {/* Min Qty */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-white">
                            &ge; {r.minQty}
                          </td>

                          {/* Normal Price */}
                          <td className="py-3 px-3 text-right font-mono text-slate-400 line-through">
                            {formatMoney(r.normalPrice)}
                          </td>

                          {/* Discount Price */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                            {formatMoney(r.discountPrice)}
                          </td>

                          {/* Margin / Profit */}
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            <span className={isProfitPositive ? 'text-cyan-400' : 'text-rose-400'}>
                              {formatMoney(r.marginProfit)}
                            </span>
                          </td>

                          {/* Points */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-950/40 border border-blue-800/60 text-blue-300 text-[10px] font-bold">
                              <Award className="w-3 h-3 text-blue-400" />
                              <span>{r.pointPercent}%</span>
                              <span className="text-slate-400">({r.pointsReward} pts)</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                r.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  r.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                                }`}
                              />
                              <span className="capitalize">{r.status}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center relative action-menu-container">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditForm(r)}
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                                title="Edit Discount Price"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRule(r.id!)}
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-rose-950/60 hover:border-rose-800 text-slate-400 hover:text-rose-300 transition"
                                title="Delete Rule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Count */}
              <div className="p-3 border-t border-slate-800 bg-[#0a0f1d] flex items-center justify-between text-[11px] text-slate-400 px-4">
                <span>
                  Showing <strong className="text-white">{filteredRules.length}</strong> rule{filteredRules.length === 1 ? '' : 's'}
                </span>
                <span className="font-mono text-[10px] text-slate-500">Firestore: stores/store_001/discount_prices</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ADD / EDIT DISCOUNT PRICE FORM */}
      {/* ========================================================================= */}
      {view === 'add_form' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Form Header */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-lg">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-400" />
                <span>{editingRuleId ? 'Edit Discount Price' : 'Add Discount Price'}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure special pricing tier rules. Profit margin and loyalty points calculate in real-time.
              </p>
            </div>

            <button
              onClick={() => {
                resetForm();
                setView('directory');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back (Kembali)</span>
            </button>
          </div>

          {/* Form Container */}
          <form
            onSubmit={handleSubmitForm}
            className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-6"
          >
            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Col 1: Product Name Combobox */}
              <div className="space-y-1.5 relative product-combobox-container">
                <label className="block text-xs font-bold text-slate-300">
                  Product Name * <span className="text-rose-400">(Nama Produk *)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search or pick product..."
                    value={productSearchInput}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    onChange={(e) => {
                      setProductSearchInput(e.target.value);
                      setIsProductDropdownOpen(true);
                    }}
                    className={`w-full bg-[#0a0f1d] border ${
                      formErrors.product ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
                    } rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition`}
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {formErrors.product && (
                  <p className="text-[10px] text-rose-400">{formErrors.product}</p>
                )}

                {/* Combobox Dropdown */}
                {isProductDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-[#0a0f1d] border border-slate-800 rounded-xl shadow-2xl z-30 divide-y divide-slate-800/60 custom-scrollbar">
                    {filteredProducts.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">No products found</div>
                    ) : (
                      filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className="p-2.5 hover:bg-blue-950/40 cursor-pointer transition-colors flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-500">
                              SKU: {p.sku} &bull; Stock: {p.stockInUnits}
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-blue-400 font-bold block">{formatMoney(p.pricePerUnit)}</span>
                            <span className="text-[10px] text-slate-500">
                              Modal: {formatMoney(p.costPerUnit)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Col 2: Customer Type Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Customer Type <span className="text-slate-500">(Tipe Pelanggan)</span>
                </label>
                <select
                  value={selectedCustomerTypeId}
                  onChange={(e) => setSelectedCustomerTypeId(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition [color-scheme:dark]"
                >
                  {customerTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) &mdash; Diskon Dasar {t.discountRate}%
                    </option>
                  ))}
                </select>
              </div>

              {/* Col 1: Normal Price (Auto Read-only) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400">
                  Normal Price (Auto) <span className="text-slate-500">(Harga Normal Otomatis)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={formatMoney(normalPrice)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono font-bold cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 uppercase font-mono">
                    Retail
                  </span>
                </div>
              </div>

              {/* Col 2: Discount Price Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Discount Price * <span className="text-emerald-400">(Harga Diskon Khusus *)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g. 22000"
                  value={discountPriceInput}
                  onChange={(e) => {
                    setDiscountPriceInput(e.target.value);
                    if (formErrors.discountPrice) {
                      setFormErrors((prev) => ({ ...prev, discountPrice: '' }));
                    }
                  }}
                  className={`w-full bg-[#0a0f1d] border ${
                    formErrors.discountPrice ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
                  } rounded-xl px-3 py-2 text-xs text-white font-mono font-bold placeholder-slate-500 focus:outline-none transition`}
                />
                {formErrors.discountPrice && (
                  <p className="text-[10px] text-rose-400">{formErrors.discountPrice}</p>
                )}
              </div>

              {/* Col 1: Minimum Qty Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Minimum Qty <span className="text-slate-500">(Minimal Pembelian)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={minQtyInput}
                  onChange={(e) => {
                    setMinQtyInput(e.target.value);
                    if (formErrors.minQty) {
                      setFormErrors((prev) => ({ ...prev, minQty: '' }));
                    }
                  }}
                  className="w-full bg-[#0a0f1d] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none transition"
                />
              </div>

              {/* Col 2: Profit Margin (Auto Read-only) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400">
                  Profit Margin (Auto) <span className="text-slate-500">(Keuntungan / Margin per Unit)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={formatMoney(marginProfitPerUnit)}
                    className={`w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold cursor-not-allowed ${
                      marginProfitPerUnit >= 0 ? 'text-cyan-400' : 'text-rose-400'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                    Modal: {formatMoney(costPrice)}
                  </span>
                </div>
              </div>

              {/* Col 1: Point Percent Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Points Allocation (%) <span className="text-slate-500">(% Poin dari Keuntungan)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={pointPercentInput}
                    onChange={(e) => setPointPercentInput(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                    %
                  </span>
                </div>
              </div>

              {/* Col 2: Points Reward (Auto Calculated) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400">
                  Points Reward (Auto) <span className="text-slate-500">(Poin per Transaksi Satuan)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={`${calculatedPointsReward} Points`}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-blue-400 font-mono font-bold cursor-not-allowed"
                  />
                  <Award className="w-3.5 h-3.5 text-blue-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-300">
                  Rule Status <span className="text-slate-500">(Status Aktif)</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={ruleStatus === 'active'}
                      onChange={() => setRuleStatus('active')}
                      className="text-blue-600 focus:ring-0"
                    />
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Active (Berlaku di Kasir)
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer ml-4">
                    <input
                      type="radio"
                      name="status"
                      checked={ruleStatus === 'inactive'}
                      onChange={() => setRuleStatus('inactive')}
                      className="text-blue-600 focus:ring-0"
                    />
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      Inactive (Nonaktif)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Financial Rule Summary Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/30 border border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Rule Simulation Summary</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Customer tier receives {formatMoney(normalPrice - discountPriceNum)} discount per unit at min {minQtyNum} units.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Profit/Unit</span>
                  <span className={`font-bold ${marginProfitPerUnit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatMoney(marginProfitPerUnit)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Points</span>
                  <span className="font-bold text-blue-400">+{calculatedPointsReward} pts</span>
                </div>
              </div>
            </div>

            {/* Actions: Save / Cancel */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setView('directory');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                Cancel (Batal)
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingRuleId ? 'Update Rule' : 'Save Discount Price'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
