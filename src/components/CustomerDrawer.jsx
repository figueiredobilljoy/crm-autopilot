import React from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, ShoppingBag, ExternalLink } from 'lucide-react';

export default function CustomerDrawer({
  customer,
  onClose,
  onSelectOrder
}) {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col shadow-2xl">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-indigo-500/30 flex items-center justify-center">
              {customer.avatar ? (
                <img src={customer.avatar} alt={customer.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{customer.name}</h2>
              <span className="text-xs text-indigo-400 font-mono">{customer.id}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          <div className="space-y-2.5 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Contact & Location
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.city && (
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{customer.city}</span>
              </div>
            )}
            {customer.customerSince && (
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Customer since {customer.customerSince}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 text-center">
              <div className="text-xs text-slate-400">Total Orders</div>
              <div className="text-xl font-bold text-white mt-1">{customer.totalOrders}</div>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 text-center">
              <div className="text-xs text-slate-400">Lifetime Spend</div>
              <div className="text-xl font-bold text-white mt-1">₹{customer.totalSpent?.toLocaleString()}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Order History</span>
            </h3>

            {(!customer.orders || customer.orders.length === 0) ? (
              <p className="text-xs text-slate-500">No previous orders recorded.</p>
            ) : (
              <div className="space-y-2">
                {customer.orders.map(o => (
                  <div
                    key={o.id}
                    onClick={() => {
                      onSelectOrder(o);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:bg-slate-800/40 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-white text-xs">{o.orderNumber}</div>
                      <div className="text-[11px] text-slate-400">{o.status} • {o.currencySymbol || '₹'}{o.total?.toLocaleString()}</div>
                    </div>
                    <span className="text-indigo-400 text-xs flex items-center gap-1">
                      View <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

