import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Transaction, TransactionStatus } from '../../types';
import { DEMO_STORE_ID } from '../../services/dataSeeder';
import { deductStockForOrder } from '../../services/stockService';
import { formatIDR } from '../../lib/money';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  DollarSign,
  Smartphone,
  Store as StoreIcon,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  PlusCircle,
  Radio,
  MapPin,
  Flame,
} from 'lucide-react';

export const TransactionDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'flagged' | 'pending' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [newTxAlert, setNewTxAlert] = useState<string | null>(null);

  // Real-time Firestore subscription to transactions collection
  useEffect(() => {
    setLoading(true);
    const path = 'transactions';
    const txQuery = query(collection(db, path), orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      txQuery,
      (snapshot) => {
        const docs: Transaction[] = [];
        snapshot.forEach((docSnapshot) => {
          docs.push({
            id: docSnapshot.id,
            ...(docSnapshot.data() as Omit<Transaction, 'id'>),
          });
        });

        // Flash banner if a new document just arrived
        if (!loading && docs.length > transactions.length && docs.length > 0) {
          const newest = docs[0];
          setNewTxAlert(`New Transaction: #${newest.id.slice(-6)} (${formatIDR(newest.totalAmount)})`);
          setTimeout(() => setNewTxAlert(null), 4000);
        }

        setTransactions(docs);
        setLoading(false);
      },
      (error) => {
        // Critical skill constraint: always include this callback
        handleFirestoreError(error, OperationType.GET, path);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter =
      activeFilter === 'all'
        ? true
        : activeFilter === 'flagged'
        ? tx.status === 'flagged_fraud' || tx.fraudScore >= 70
        : activeFilter === 'pending'
        ? tx.status === 'pending_approval'
        : tx.status === 'completed';

    const matchesSearch =
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.customerPhone && tx.customerPhone.includes(searchTerm)) ||
      (tx.fraudFlags && tx.fraudFlags.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase())));

    return matchesFilter && matchesSearch;
  });

  // Calculate live KPI metrics
  const totalVolume = transactions
    .filter((tx) => tx.status === 'completed')
    .reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);
  const flaggedCount = transactions.filter(
    (tx) => tx.status === 'flagged_fraud' || tx.fraudScore >= 70
  ).length;
  const pendingCount = transactions.filter((tx) => tx.status === 'pending_approval').length;
  const fraudRate = transactions.length > 0 ? ((flaggedCount / transactions.length) * 100).toFixed(1) : '0';

  // Approve a transaction
  const handleApprove = async (txId: string) => {
    try {
      const target = transactions.find((t) => t.id === txId);
      if (target && target.status !== 'completed') {
        let lines = (target.items || []).map((it) => ({ productId: it.productId, units: Number(it.unitsDeducted) || 0 }));
        if (lines.length === 0) {
          const snap = await getDocs(collection(db, 'transactions', txId, 'items'));
          lines = snap.docs.map((d) => ({ productId: d.data().productId, units: Number(d.data().unitsDeducted) || 0 }));
        }
        await deductStockForOrder(txId, lines); // atomik; gagal bila stok kurang
      }
      const txRef = doc(db, 'transactions', txId);
      await updateDoc(txRef, {
        status: 'completed' as TransactionStatus,
        reviewedBy: 'Store Manager',
        reviewedAt: new Date().toISOString(),
      });
      if (selectedTx && selectedTx.id === txId) {
        setSelectedTx({ ...selectedTx, status: 'completed' });
      }
    } catch (error) {
      if (error instanceof Error && /^Stok|^Produk|^Transaksi/.test(error.message)) {
        window.alert(error.message);
        return;
      }
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${txId}`);
    }
  };

  // Reject a transaction
  const handleReject = async (txId: string) => {
    try {
      const txRef = doc(db, 'transactions', txId);
      await updateDoc(txRef, {
        status: 'rejected' as TransactionStatus,
        reviewedBy: 'Store Manager',
        reviewedAt: new Date().toISOString(),
      });
      if (selectedTx && selectedTx.id === txId) {
        setSelectedTx({ ...selectedTx, status: 'rejected' });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${txId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner alert on real-time arrival */}
      {newTxAlert && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-pulse">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 animate-ping text-emerald-400" />
            <span className="font-semibold text-sm">{newTxAlert}</span>
          </div>
          <span className="text-xs text-emerald-300">Live Firestore Snapshot</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Live Transactions</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-Time Feed
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time anti-fraud monitoring, GPS geofence tracking, and automated carton conversion audit.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-zinc-400 text-sm">
            <span>Completed Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{formatIDR(totalVolume)}</div>
          <div className="text-xs text-zinc-500 mt-1">Verified sales across POS & PWA</div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-zinc-400 text-sm">
            <span>Total Transactions</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{transactions.length}</div>
          <div className="text-xs text-zinc-500 mt-1">Real-time synchronized records</div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-zinc-400 text-sm">
            <span>Fraud Flag Rate</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">{fraudRate}%</div>
          <div className="text-xs text-zinc-500 mt-1">{flaggedCount} high-risk interventions</div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-zinc-400 text-sm">
            <span>Pending Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{pendingCount}</div>
          <div className="text-xs text-zinc-500 mt-1">Awaiting cashier / manager sign-off</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeFilter === 'all'
                ? 'bg-zinc-700 text-white'
                : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setActiveFilter('flagged')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'flagged'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Flagged Fraud ({flaggedCount})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Pending Approval ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeFilter === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Completed
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by ID, customer, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
            <RefreshCw className="w-6 h-6 animate-spin mb-2" />
            <p className="text-sm">Connecting to Firestore real-time stream...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No transactions matched your current filters.</p>
            <p className="text-xs text-zinc-600 mt-1">Try switching filters or simulating a new transaction.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950/60 text-xs uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Transaction / Channel</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Customer & Telemetry</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Fraud Risk Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredTransactions.map((tx) => {
                  const isHighFraud = tx.fraudScore >= 70 || tx.status === 'flagged_fraud';
                  const isPending = tx.status === 'pending_approval';

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-zinc-800/40 transition ${
                        isHighFraud ? 'bg-rose-950/10' : isPending ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* ID and Channel */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-white text-xs">
                          #{tx.id.slice(-8)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {tx.channel === 'pos' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <StoreIcon className="w-3 h-3" />
                              POS Terminal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              <Smartphone className="w-3 h-3" />
                              Client PWA
                            </span>
                          )}
                          <span className="text-[11px] uppercase font-mono text-zinc-500">
                            {tx.paymentMethod}
                          </span>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-xs text-zinc-400">
                        <div>
                          {new Date(tx.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Customer & Telemetry */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-white text-xs">{tx.customerName}</div>
                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          {tx.distanceToStoreMeters !== undefined && (
                            <span
                              className={`flex items-center gap-1 ${
                                tx.distanceToStoreMeters > 500
                                  ? 'text-rose-400 font-medium'
                                  : 'text-zinc-400'
                              }`}
                            >
                              <MapPin className="w-3 h-3" />
                              {tx.distanceToStoreMeters > 1000
                                ? `${(tx.distanceToStoreMeters / 1000).toFixed(1)} km`
                                : `${tx.distanceToStoreMeters} m`}
                            </span>
                          )}
                          {tx.customerPhone && (
                            <span className="text-zinc-500 font-mono">{tx.customerPhone}</span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white text-sm">
                          {formatIDR(tx.totalAmount || 0)}
                        </div>
                        {tx.totalCost !== undefined && (
                          <div className="text-[11px] text-zinc-500">
                            Margin: +{formatIDR((tx.totalAmount || 0) - (tx.totalCost || 0))}
                          </div>
                        )}
                      </td>

                      {/* Fraud Score */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono flex items-center gap-1 ${
                              tx.fraudScore >= 75
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : tx.fraudScore >= 45
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {tx.fraudScore >= 75 ? (
                              <ShieldAlert className="w-3 h-3 text-rose-400" />
                            ) : tx.fraudScore >= 45 ? (
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                            ) : (
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            )}
                            {tx.fraudScore}/100
                          </div>
                        </div>

                        {/* Top Flag */}
                        {tx.fraudFlags && tx.fraudFlags.length > 0 && (
                          <div className="text-[10px] text-zinc-500 mt-1 truncate max-w-[150px]">
                            {tx.fraudFlags[0]}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            tx.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : tx.status === 'flagged_fraud'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : tx.status === 'pending_approval'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-zinc-700/40 text-zinc-400'
                          }`}
                        >
                          {tx.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                            title="Inspect AI Fraud Report"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {(tx.status === 'pending_approval' || tx.status === 'flagged_fraud') && (
                            <>
                              <button
                                onClick={() => handleApprove(tx.id)}
                                className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 transition"
                                title="Approve Transaction"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleReject(tx.id)}
                                className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 transition"
                                title="Reject Transaction"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Forensic AI Fraud Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-zinc-500">Transaction Investigation</span>
                <h3 className="text-lg font-bold text-white mt-0.5">#{selectedTx.id}</h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700"
              >
                ✕
              </button>
            </div>

            {/* Score & Risk Level */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-400">Risk Assessment Score</div>
                <div className="text-2xl font-black mt-1 text-white">
                  {selectedTx.fraudScore}
                  <span className="text-sm font-normal text-zinc-500"> / 100</span>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedTx.fraudScore >= 75
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : selectedTx.fraudScore >= 45
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {selectedTx.riskLevel} Risk
              </div>
            </div>

            {/* AI Forensic Rationale */}
            <div>
              <div className="text-xs font-semibold uppercase text-zinc-400 mb-1">
                Gemini Preventive AI Explanation
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                {selectedTx.aiExplanation || 'No AI explanation generated.'}
              </div>
            </div>

            {/* Triggered Flags */}
            <div>
              <div className="text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Triggered Heuristic Flags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedTx.fraudFlags && selectedTx.fraudFlags.length > 0 ? (
                  selectedTx.fraudFlags.map((flag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700"
                    >
                      {flag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500">No flags triggered.</span>
                )}
              </div>
            </div>

            {/* GPS Telemetry Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <div>
                <span className="text-zinc-500 block">Distance to Storefront</span>
                <span
                  className={`font-semibold ${
                    (selectedTx.distanceToStoreMeters || 0) > 500
                      ? 'text-rose-400'
                      : 'text-zinc-200'
                  }`}
                >
                  {selectedTx.distanceToStoreMeters !== undefined
                    ? `${selectedTx.distanceToStoreMeters} meters`
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">GPS Sensor Accuracy</span>
                <span className="font-semibold text-zinc-200">
                  {selectedTx.gpsAccuracy !== undefined ? `±${selectedTx.gpsAccuracy}m` : 'POS Stationary'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Mock GPS Spoofing</span>
                <span
                  className={`font-semibold ${
                    selectedTx.isMockGpsSuspected ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {selectedTx.isMockGpsSuspected ? 'Suspected / Flagged' : 'Normal Hardware'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Current Status</span>
                <span className="font-semibold text-zinc-200 capitalize">
                  {selectedTx.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Actions in Modal */}
            <div className="pt-2 flex items-center justify-end gap-2">
              {selectedTx.status !== 'completed' && (
                <button
                  onClick={() => handleApprove(selectedTx.id)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                >
                  Approve Transaction
                </button>
              )}
              {selectedTx.status !== 'rejected' && (
                <button
                  onClick={() => handleReject(selectedTx.id)}
                  className="px-4 py-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition"
                >
                  Reject & Freeze
                </button>
              )}
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
