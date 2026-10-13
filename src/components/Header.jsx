import React from 'react';
import { Bot, ShieldCheck, Activity, Settings, RefreshCw, AlertTriangle, Store } from 'lucide-react';

export default function Header({
  status,
  onOpenSettings,
  onOpenActivity,
  onResetDemo,
  isLiveStore,
  totalNeedingAttention
}) {
  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                ShopPilot <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">AI CRM</span>
              </h1>
              {isLiveStore ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE STORE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  SAMPLE DATA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              AI-assisted CRM & SLA Sentinel for WooCommerce merchants
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {totalNeedingAttention > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{totalNeedingAttention} orders need review</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Engine:</span>
            <span className="font-semibold text-slate-200">
              {status?.hasCustomAiKey ? status.aiProvider.toUpperCase() : 'Deterministic'}
            </span>
          </div>

          <button
            onClick={onOpenActivity}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
            title="View audit & activity log"
          >
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span>Activity Log</span>
          </button>

          {!isLiveStore && (
            <button
              onClick={onResetDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              title="Reset sample orders"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Data</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>

      </div>
    </header>
  );
}


