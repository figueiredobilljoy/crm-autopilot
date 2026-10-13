import React from 'react';
import { ShoppingBag, AlertCircle, Users, IndianRupee, ArrowUpRight } from 'lucide-react';

export default function StatsCards({ orders, customers }) {
  const totalOrders = orders.length;
  const attentionOrders = orders.filter(o => o.ruleEvaluation?.needsAttention);
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const openTickets = orders.reduce((sum, o) => sum + (o.supportTickets || 0), 0);
  const avgNps = customers.length
    ? Math.round(customers.reduce((sum, c) => sum + (c.npsScore || 0), 0) / customers.length)
    : 0;
  const currencySymbol = orders[0]?.currencySymbol || '₹';

  const stats = [
    {
      title: 'Total Orders',
      value: totalOrders,
      subtitle: `${orders.filter(o => o.status === 'completed').length} fulfilled orders`,
      icon: ShoppingBag,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    },
    {
      title: 'Needs Attention',
      value: attentionOrders.length,
      subtitle: `${attentionOrders.filter(o => o.priority === 'High' || o.ruleEvaluation?.severity === 'high').length} high priority workflows`,
      icon: AlertCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      alert: attentionOrders.length > 0
    },
    {
      title: 'Active Customers',
      value: customers.length,
      subtitle: `Avg NPS ${avgNps}/10 across accounts`,
      icon: Users,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'Total Order Volume',
      value: `${currencySymbol}${totalRevenue.toLocaleString()}`,
      subtitle: `${openTickets} open support tickets tracked`,
      icon: IndianRupee,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`p-5 rounded-xl bg-slate-900/60 border ${stat.borderColor} backdrop-blur relative overflow-hidden transition-all hover:bg-slate-900/90`}
          >
            {stat.alert && (
              <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {stat.title}
              </span>
              <div className={`p-2 rounded-xl ${stat.bgColor} ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-white">
                {stat.value}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {stat.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}


