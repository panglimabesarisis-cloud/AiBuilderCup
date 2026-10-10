import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { FraudLog } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Radio,
  MapPin,
  Cpu,
  Boxes,
  Zap,
  CheckCircle2,
  RefreshCw,
  Play,
} from 'lucide-react';

export const AntiFraudInspector: React.FC = () => {
  const [fraudLogs, setFraudLogs] = useState<FraudLog[]>([]);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);

  // Sandbox simulation parameters
  const [sandboxChannel, setSandboxChannel] = useState<'pwa_client' | 'pos'>('pwa_client');
  const [sandboxAmount, setSandboxAmount] = useState<number>(180);
  const [sandboxCartons, setSandboxCartons] = useState<number>(8);
  const [sandboxDistance, setSandboxDistance] = useState<number>(4500); // meters
  const [sandboxAccuracy, setSandboxAccuracy] = useState<number>(0); // 0 = mock GPS
  const [sandboxVelocity, setSandboxVelocity] = useState<number>(3);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'fraud_logs'),
      (snapshot) => {
        const logs: FraudLog[] = [];
        snapshot.forEach((docSnap) => {
          logs.push({ id: docSnap.id, ...(docSnap.data() as Omit<FraudLog, 'id'>) });
        });
        setFraudLogs(logs);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'fraud_logs')
    );

    return () => unsub();
  }, []);

  const handleRunAiAudit = async () => {
    setIsAuditing(true);
    try {
      const payload = {
        channel: sandboxChannel,
        totalAmount: sandboxAmount,
        items: [
          {
            productName: 'Indomie Mi Goreng Special',
            packageType: 'carton',
            quantityOrdered: sandboxCartons,
            unitPrice: 20.0,
          },
        ],
        customerPhone: '+6281987654321',
        customerLatitude: -6.2088 + (sandboxDistance / 111000), // approximate lat offset
        customerLongitude: 106.8456,
        gpsAccuracy: sandboxAccuracy,
        storeLatitude: -6.2088,
        storeLongitude: 106.8456,
        geofenceRadiusMeters: 500,
        velocityCount: sandboxVelocity,
        sandbox: true, // hanya berlaku jika server memakai ALLOW_FRAUD_SANDBOX=true
      };

      const res = await fetch('/api/ai/anti-fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setAuditResult(data);
    } catch (error) {
      console.error('Audit failed:', error);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleResolveLog = async (logId: string) => {
    try {
      await updateDoc(doc(db, 'fraud_logs', logId), {
        resolved: true,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `fraud_logs/${logId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Preventive AI Anti-Fraud Shield
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            Gemini 3.8 Flash Engine
          </span>
        </div>
        <p className="text-sm text-zinc-400 mt-1">
          Multi-layered threat interception evaluating Geofence telemetry, Mock GPS signatures, carton inventory velocity, and repetitive burst heuristics.
        </p>
      </div>

      {/* 4 Shield Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            Geofence Guard
          </div>
          <div className="text-lg font-bold text-white">500m Precision Perimeter</div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Strict geodesic haversine verification blocks remote out-of-region orders masquerading as local customers.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Radio className="w-4 h-4" />
            Mock GPS Telemetry
          </div>
          <div className="text-lg font-bold text-white">Sensor Signature Audit</div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Flags synthetic 0.00m accuracy reports, fixed emulator coords, and teleportation coordinate jumps.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Boxes className="w-4 h-4" />
            Carton Drain Filter
          </div>
          <div className="text-lg font-bold text-white">Bulk Wholesaling Shield</div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Detects suspicious wholesale bulk carton purchases designed to rapidly drain scarce retail inventory.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            Velocity Burst Monitor
          </div>
          <div className="text-lg font-bold text-white">Scalper Bot Breaker</div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Intercepts automated rapid-fire order requests from identical phone tokens or card fingerprints.
          </p>
        </div>
      </div>

      {/* Interactive AI Anti-Fraud Sandbox */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              Live AI Forensic Simulation Sandbox
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tweak checkout parameters and watch Gemini AI evaluate the threat payload in real time.
            </p>
          </div>

          <button
            onClick={handleRunAiAudit}
            disabled={isAuditing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg shadow-rose-600/20"
          >
            {isAuditing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing with Gemini...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Run AI Forensic Audit
              </>
            )}
          </button>
        </div>

        {/* Sandbox Sliders / Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Channel & Cartons */}
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-zinc-400 mb-1">Checkout Channel</label>
              <select
                value={sandboxChannel}
                onChange={(e) => setSandboxChannel(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
              >
                <option value="pwa_client">Client PWA (Remote Mobile Web)</option>
                <option value="pos">In-Person POS Cashier Terminal</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-zinc-400">Bulk Dus / Cartons Ordered:</span>
                <span className="font-mono text-white font-bold">{sandboxCartons} Cartons</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={sandboxCartons}
                onChange={(e) => {
                  const c = Number(e.target.value);
                  setSandboxCartons(c);
                  setSandboxAmount(c * 20);
                }}
                className="w-full accent-blue-500"
              />
              <span className="text-[10px] text-zinc-500">
                Total Transaction Value: ${sandboxAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* GPS Distance & Accuracy */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-zinc-400">Distance to Store (Geofence: 500m):</span>
                <span
                  className={`font-mono font-bold ${
                    sandboxDistance > 500 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {sandboxDistance > 1000 ? `${(sandboxDistance / 1000).toFixed(1)} km` : `${sandboxDistance} m`}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="25000"
                step="50"
                value={sandboxDistance}
                onChange={(e) => setSandboxDistance(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
              <span className="text-[10px] text-zinc-500">
                {sandboxDistance > 500 ? 'Breaches 500m Geofence Boundary!' : 'Inside Safe Retail Geofence'}
              </span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-zinc-400">Reported GPS Accuracy:</span>
                <span className="font-mono text-white font-bold">
                  {sandboxAccuracy === 0 ? '0m (Mock GPS Provider!)' : `±${sandboxAccuracy}m`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={sandboxAccuracy}
                onChange={(e) => setSandboxAccuracy(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          {/* Velocity Burst */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-zinc-400">Order Velocity within 10 Mins:</span>
                <span
                  className={`font-mono font-bold ${
                    sandboxVelocity >= 3 ? 'text-rose-400' : 'text-zinc-300'
                  }`}
                >
                  {sandboxVelocity} Orders
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={sandboxVelocity}
                onChange={(e) => setSandboxVelocity(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <span className="text-[10px] text-zinc-500">
                {sandboxVelocity >= 3 ? 'Triggers scalper bot velocity warning' : 'Normal human shopping speed'}
              </span>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] text-zinc-400">
              <span className="text-white font-semibold block mb-0.5">Quick Presets:</span>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSandboxDistance(15);
                    setSandboxAccuracy(10);
                    setSandboxCartons(1);
                    setSandboxAmount(25);
                    setSandboxVelocity(1);
                  }}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Clean Walk-in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSandboxDistance(12000);
                    setSandboxAccuracy(0);
                    setSandboxCartons(15);
                    setSandboxAmount(300);
                    setSandboxVelocity(5);
                  }}
                  className="px-2 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800"
                >
                  Spoofed Bot
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Evaluation Result Card */}
        {auditResult && (
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1.5 rounded-xl font-black font-mono text-xl ${
                    auditResult.fraudScore >= 75
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : auditResult.fraudScore >= 45
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  Score: {auditResult.fraudScore} / 100
                </div>

                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Risk Verdict: {auditResult.riskLevel}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Decision: <strong>{auditResult.recommendation.toUpperCase()}</strong>
                  </div>
                </div>
              </div>

              {/* Triggered Flags */}
              <div className="flex flex-wrap gap-1.5">
                {auditResult.fraudFlags?.map((f: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-rose-300 border border-rose-500/30"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-850 text-xs text-zinc-300 leading-relaxed">
              <strong className="text-white block mb-1">Gemini AI Forensic Rationale:</strong>
              {auditResult.aiExplanation}
            </div>
          </div>
        )}
      </div>

      {/* Historical Intercepted Fraud Logs */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          Recent Intercepted Threat Audit Trail
        </h2>

        {fraudLogs.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No active threat logs currently recorded. All systems running clean.
          </div>
        ) : (
          <div className="space-y-3">
            {fraudLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        log.riskLevel === 'critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {log.riskLevel}
                    </span>
                    <span className="font-mono text-xs font-semibold text-white">
                      #{log.anomalyType}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 font-medium">{log.summary}</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed max-w-3xl">
                    {log.aiDetails}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {log.resolved ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Resolved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleResolveLog(log.id)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
