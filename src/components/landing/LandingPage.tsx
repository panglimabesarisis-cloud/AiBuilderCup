import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Boxes,
  Smartphone,
  Store,
  Gauge,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Lock,
  Layers,
  Flame,
} from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-950/40 via-zinc-900/80 to-zinc-900 border border-blue-500/20 p-8 sm:p-14 text-center shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Competition Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          AI Builder Cup 2026 Official Submission
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
          Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">Anti-Fraud POS</span> &amp; Client PWA
        </h1>

        <p className="mt-5 text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          RiskCart empowers modern retailers with real-time transaction intelligence, high-precision GPS geofencing, automatic carton-to-unit stock conversions, and preventive AI anomaly detection.
        </p>

        {/* Action Button Strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('transactions')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-lg shadow-blue-600/30"
          >
            <Store className="w-4 h-4" />
            Launch POS Admin Terminal
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('client_pwa')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm border border-zinc-700 transition"
          >
            <Smartphone className="w-4 h-4 text-purple-400" />
            Open Client PWA (Mobile)
          </button>

          <PWAInstallButton />
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-zinc-400 font-medium">
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Zero False-Positive Shield
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Sub-500m Geofence Telemetry
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Dus/Carton Wholesale Logic
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Multi-Tenant SaaS Ready
          </div>
        </div>
      </div>

      {/* 3 Core Architecture Pillars */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Integrated Retail Defense Architecture
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2">
            Built from the ground up with Firestore persistence, edge telemetry, and Gemini 3.8 Flash intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: POS Admin & Anti-Fraud */}
          <div
            onClick={() => onNavigate('transactions')}
            className="group cursor-pointer bg-zinc-900/90 border border-zinc-800 hover:border-blue-500/50 rounded-2xl p-6 transition shadow-xl space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
              Real-Time POS Cashier Hub
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Reactive live transaction feed listening to Firestore snapshots. Instant visual fraud badges, cashier approval gates, and forensic trace inspection.
            </p>
            <span className="text-xs font-semibold text-blue-400 flex items-center gap-1">
              Explore Live Feed <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 2: Financial Asset Dashboard & Gauge */}
          <div
            onClick={() => onNavigate('assets')}
            className="group cursor-pointer bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-6 transition shadow-xl space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
              <Gauge className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition">
              Financial Asset Gauge &amp; Inventory
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dynamic SVG financial risk gauge meter calculating Value at Risk (VAR), liquid inventory capital, gross margins, and wholesale carton allocation.
            </p>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              View Asset Valuation <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 3: Client PWA & Typo-Tolerant AI */}
          <div
            onClick={() => onNavigate('client_pwa')}
            className="group cursor-pointer bg-zinc-900/90 border border-zinc-800 hover:border-purple-500/50 rounded-2xl p-6 transition shadow-xl space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition">
              Client PWA Marketplace &amp; NLP
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Mobile web marketplace with conversational AI ordering resistant to typos &amp; slang, high-precision GPS geofencing, and Firebase Phone OTP.
            </p>
            <span className="text-xs font-semibold text-purple-400 flex items-center gap-1">
              Open Client App <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Feature Highlight Matrix */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          Engineered for Competition Excellence
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
            <div className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Boxes className="w-4 h-4" />
              Carton-to-Unit Math
            </div>
            <p className="text-zinc-400 leading-relaxed">
              1-click &quot;Unpack Dus&quot; action breaks wholesale packages into retail units without inventory accounting errors.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
            <div className="text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4" />
              Mock GPS Interceptor
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Detects 0.00m hardware precision anomalies and emulator coordinate jumps before transactions are authorized.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
            <div className="text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              AI Restock Advisor
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Forecasts stockout velocity and recommends purchase orders grouped strictly in whole carton multiples.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
            <div className="text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              Multi-Tenant Architecture
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Every single collection has storeId embedded and validated by hardened Firestore ABAC security rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
