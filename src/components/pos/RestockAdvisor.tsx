import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Product, Transaction, RestockRecommendation } from '../../types';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Boxes,
  TrendingDown,
  RefreshCw,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  PackageCheck,
  DollarSign,
} from 'lucide-react';

export const RestockAdvisor: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recommendations, setRecommendations] = useState<RestockRecommendation[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [restockedSuccess, setRestockedSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubP = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        const prods: Product[] = [];
        snap.forEach((d) => prods.push({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
        setProducts(prods);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'products')
    );

    const unsubT = onSnapshot(
      collection(db, 'transactions'),
      (snap) => {
        const txs: Transaction[] = [];
        snap.forEach((d) => txs.push({ id: d.id, ...(d.data() as Omit<Transaction, 'id'>) }));
        setTransactions(txs);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'transactions')
    );

    return () => {
      unsubP();
      unsubT();
    };
  }, []);

  // Fetch or Refresh AI Restock Recommendations
  const fetchAiRestockPlan = async () => {
    if (products.length === 0) return;
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/restock-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            currentStockUnits: p.stockInUnits,
            piecesPerCarton: p.piecesPerCarton,
            costPerUnit: p.costPerUnit,
            minStockAlert: p.minStockAlert,
          })),
          recentTransactions: transactions.slice(0, 10),
        }),
      });

      const data = await res.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
        setExecutiveSummary(data.executiveSummary || '');
      }
    } catch (error) {
      console.error('Error fetching restock recommendations:', error);
    } finally {
      setLoadingAi(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (products.length > 0 && recommendations.length === 0) {
      fetchAiRestockPlan();
    }
  }, [products]);

  // Execute 1-Click Purchase Order for a recommended item
  const handleApplyRestock = async (rec: RestockRecommendation) => {
    try {
      const prod = products.find((p) => p.id === rec.productId);
      if (!prod) return;

      const unitsToAdd = rec.suggestedCartons * (prod.piecesPerCarton || 1);
      const newStock = prod.stockInUnits + unitsToAdd;

      const prodRef = doc(db, 'products', prod.id);
      await updateDoc(prodRef, {
        stockInUnits: newStock,
        updatedAt: new Date().toISOString(),
      });

      // Remove from active recommendations list
      setRecommendations((prev) => prev.filter((r) => r.productId !== rec.productId));

      // Trigger festive celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}

      setRestockedSuccess(
        `Restocked +${rec.suggestedCartons} Cartons (${unitsToAdd} units) for ${prod.name}! New Balance: ${newStock} units.`
      );
      setTimeout(() => setRestockedSuccess(null), 4500);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${rec.productId}`);
    }
  };

  const totalRestockBudget = recommendations.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
  const totalCartonsNeeded = recommendations.reduce((sum, r) => sum + (r.suggestedCartons || 0), 0);

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {restockedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{restockedSuccess}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">AI Restock Advisor</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Smart Packaging Optimizer
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Intelligent inventory forecasting calculating stockout runout dates and wholesale whole-carton replenishment.
          </p>
        </div>

        <button
          onClick={fetchAiRestockPlan}
          disabled={loadingAi}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
          Recalculate AI Forecast
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
          <div className="text-xs text-zinc-400 font-medium">Restock Capital Required</div>
          <div className="text-2xl font-black text-white mt-1">${totalRestockBudget.toFixed(2)}</div>
          <div className="text-xs text-zinc-500 mt-1">Projected wholesale PO amount</div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
          <div className="text-xs text-zinc-400 font-medium">Total Bulk Cartons</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{totalCartonsNeeded} Whole Cartons</div>
          <div className="text-xs text-zinc-500 mt-1">Packaged to avoid broken lots</div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
          <div className="text-xs text-zinc-400 font-medium">Critical Action Items</div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {recommendations.filter((r) => r.urgency === 'urgent').length} Items
          </div>
          <div className="text-xs text-zinc-500 mt-1">Approaching imminent stockout</div>
        </div>
      </div>

      {/* Executive Summary Card */}
      {executiveSummary && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/30 to-purple-950/20 border border-blue-800/40 text-xs text-zinc-300 leading-relaxed flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">Gemini Executive Forecast:</strong>
            {executiveSummary}
          </div>
        </div>
      )}

      {/* Recommendations Cards List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Boxes className="w-5 h-5 text-zinc-400" />
          Recommended Purchase Orders by Carton Multiplier
        </h2>

        {recommendations.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 bg-zinc-900/60 rounded-2xl border border-zinc-800">
            <PackageCheck className="w-10 h-10 mx-auto mb-2 text-emerald-400 opacity-60" />
            <p className="text-sm font-semibold text-zinc-300">Inventory Levels Fully Optimized</p>
            <p className="text-xs text-zinc-500 mt-1">
              All product lines maintain adequate safety stock buffers based on current runout velocity.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => {
              const prod = products.find((p) => p.id === rec.productId);
              const isUrgent = rec.urgency === 'urgent';

              return (
                <div
                  key={rec.productId}
                  className={`p-5 rounded-2xl bg-zinc-900/90 border transition flex flex-col justify-between shadow-xl ${
                    isUrgent ? 'border-amber-500/40 bg-amber-950/5' : 'border-zinc-800'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isUrgent
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {rec.urgency} Restock
                        </span>
                        <h3 className="text-base font-bold text-white">{rec.productName}</h3>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                          Current Stock
                        </span>
                        <span className="text-sm font-bold text-white font-mono">
                          {rec.currentStockUnits} units
                        </span>
                      </div>
                    </div>

                    {/* Carton Box Recommendation */}
                    <div className="mt-4 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-zinc-500">
                          Recommended Order
                        </div>
                        <div className="text-xl font-black text-blue-400 mt-0.5">
                          +{rec.suggestedCartons} Cartons
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          (= {rec.suggestedCartons * rec.piecesPerCarton} loose units)
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase font-semibold text-zinc-500">
                          Estimated Cost
                        </div>
                        <div className="text-lg font-bold text-white mt-0.5 font-mono">
                          ${(rec.estimatedCost || 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          at wholesale COGS
                        </div>
                      </div>
                    </div>

                    {/* AI Rationale */}
                    <p className="mt-3 text-xs text-zinc-400 leading-relaxed italic bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                      &quot;{rec.aiRationale}&quot;
                    </p>
                  </div>

                  {/* 1-Click Order Button */}
                  <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">
                      Multiplier: 1 Dus = {rec.piecesPerCarton} Pcs
                    </span>

                    <button
                      onClick={() => handleApplyRestock(rec)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/20"
                    >
                      <PackageCheck className="w-4 h-4" />
                      Approve Restock PO
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
