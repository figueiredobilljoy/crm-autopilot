import React, { useState } from 'react';
import { X, Activity, ShieldCheck, Sparkles, AlertTriangle, RefreshCw, CheckCircle, Clock } from 'lucide-react';

export default function ActivityLogModal({
  activities,
  onClose
}) {
  const [filter, setFilter] = useState('all');

  const filteredActivities = activities.filter(act => {
    if (filter === 'all') return true;
    if (filter === 'approval' && act.type === 'approval') return true;
    if (filter === 'ai' && act.type === 'ai_investigation') return true;
    if (filter === 'flag' && act.type === 'system_flag') return true;
    return false;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'approval':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'ai_investigation':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      case 'system_flag':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'woocommerce_sync':
        return <RefreshCw className="w-4 h-4 text-sky-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Activity & Audit Trail</h2>
              <p className="text-xs text-slate-400">
                Log of automated SLA checks, AI investigations, and operator approvals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/20 flex gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition ${
              filter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Events ({activities.length})
          </button>
          <button
            onClick={() => setFilter('approval')}
            className={`px-3 py-1 rounded-lg transition ${
              filter === 'approval' ? 'bg-emerald-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Approvals ({activities.filter(a => a.type === 'approval').length})
          </button>
          <button
            onClick={() => setFilter('ai')}
            className={`px-3 py-1 rounded-lg transition ${
              filter === 'ai' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            AI Investigations ({activities.filter(a => a.type === 'ai_investigation').length})
          </button>
          <button
            onClick={() => setFilter('flag')}
            className={`px-3 py-1 rounded-lg transition ${
              filter === 'flag' ? 'bg-rose-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            SLA Flags ({activities.filter(a => a.type === 'system_flag').length})
          </button>
        </div>

        {/* Timeline list */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-800/60 space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No activity logs match the selected filter.
            </div>
          ) : (
            filteredActivities.map(act => (
              <div key={act.id} className="pt-4 first:pt-0 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 mt-0.5 shrink-0">
                  {getIcon(act.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{act.title}</span>
                      {act.orderNumber && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                          {act.orderNumber}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTime(act.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {act.description}
                  </p>

                  {act.draftContent && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300">
                      <div className="font-semibold text-slate-200">Subject: {act.draftContent.subject}</div>
                      <div className="text-slate-400 mt-1 line-clamp-2">{act.draftContent.body}</div>
                    </div>
                  )}

                  <div className="mt-1.5 text-[10px] text-slate-500">
                    Recorded by: <span className="text-slate-400 font-medium">{act.operator}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
