import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, Clock, Eye, Sparkles } from 'lucide-react';

export default function OrderList({
  orders,
  selectedOrderId,
  onSelectOrder
}) {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'attention' | 'processing' | 'on-hold' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(order => {
    // Status filter
    if (filterStatus === 'attention' && !order.ruleEvaluation?.needsAttention) return false;
    if (filterStatus !== 'all' && filterStatus !== 'attention' && order.status !== filterStatus) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = order.orderNumber.toLowerCase().includes(q);
      const matchCustomer = order.customerName.toLowerCase().includes(q);
      const matchEmail = order.customerEmail?.toLowerCase().includes(q);
      if (!matchNumber && !matchCustomer && !matchEmail) return false;
    }

    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'processing':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">Processing</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>;
      case 'on-hold':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">On Hold</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Pending</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur">
      
      {/* Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Orders ({orders.length})
          </button>
          
          <button
            onClick={() => setFilterStatus('attention')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              filterStatus === 'attention'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-rose-300 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Needs Attention ({orders.filter(o => o.ruleEvaluation?.needsAttention).length})</span>
          </button>

          <button
            onClick={() => setFilterStatus('processing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              filterStatus === 'processing'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Processing ({orders.filter(o => o.status === 'processing').length})
          </button>

          <button
            onClick={() => setFilterStatus('on-hold')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              filterStatus === 'on-hold'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            On Hold ({orders.filter(o => o.status === 'on-hold').length})
          </button>

          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              filterStatus === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Completed ({orders.filter(o => o.status === 'completed').length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950/70 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Order</th>
              <th className="px-5 py-3.5">Customer</th>
              <th className="px-5 py-3.5">Age & SLA Status</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Total</th>
              <th className="px-5 py-3.5">SLA Flag & Policy Rule</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                  No orders match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const isSelected = selectedOrderId === order.id;
                const needsAttention = order.ruleEvaluation?.needsAttention;

                return (
                  <tr
                    key={order.id}
                    onClick={() => onSelectOrder(order)}
                    className={`group transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 ring-1 ring-inset ring-indigo-500/50'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Order Number */}
                    <td className="px-5 py-4 font-mono font-bold text-white whitespace-nowrap">
                      {order.orderNumber}
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-200">{order.customerName}</div>
                      <div className="text-[11px] text-slate-400">{order.customerEmail}</div>
                    </td>

                    {/* Age in Demo */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.ageDays === 0 ? 'Today (< 24h)' : `${order.ageDays} day${order.ageDays > 1 ? 's' : ''} ago`}</span>
                      </div>
                      {order.ageDays >= 2 && order.status === 'processing' && (
                        <div className="text-[10px] text-rose-400 font-medium">Exceeds 48h benchmark</div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>

                    {/* Total */}
                    <td className="px-5 py-4 font-bold text-slate-200 whitespace-nowrap">
                      {order.currencySymbol}{order.total?.toLocaleString()}
                    </td>

                    {/* Rule Flag */}
                    <td className="px-5 py-4">
                      {needsAttention ? (
                        <div className="flex items-start gap-1.5 text-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] font-medium leading-tight line-clamp-2">
                            {order.ruleEvaluation.triggerRule}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] font-medium">Within SLA</span>
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOrder(order);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          needsAttention
                            ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Inspect & AI</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
