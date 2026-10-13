import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  User,
  Package,
  MapPin,
  Clock,
  ShieldCheck,
  X,
  CreditCard,
  MessageSquare,
  Truck,
  Tags,
  Gauge,
  CalendarClock
} from 'lucide-react';
import { generateInvestigation } from '../aiService.js';

export default function OrderDetailPanel({
  order,
  customer,
  onClose,
  onRecordActivity
}) {
  const [investigating, setInvestigating] = useState(false);
  const [investigation, setInvestigation] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset state when selected order changes
  useEffect(() => {
    setInvestigation(null);
    setEmailSubject('');
    setEmailBody('');
    setIsApproved(false);
    setCopied(false);
  }, [order?.id]);

  if (!order) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[420px] shadow-lg">
        <Package className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Order Selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Select an order from the list on the left to inspect its SLA status, view customer context, and trigger AI-assisted follow-ups.
        </p>
      </div>
    );
  }

  const handleInvestigate = async () => {
    setInvestigating(true);
    try {
      const response = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });

      if (!response.ok) {
        throw new Error(`Investigation API failed with ${response.status}`);
      }

      const data = await response.json();
      const inv = data.investigation;
      setInvestigation(inv);
      setEmailSubject(inv.email_subject || '');
      setEmailBody(inv.email_body || '');

      if (onRecordActivity) {
        onRecordActivity({
          type: 'ai_investigation',
          orderNumber: order.orderNumber,
          title: `AI investigation run for ${order.orderNumber}`,
          description: `Generated diagnosis and customer draft via ${inv.provider} (${inv.model}).`,
          operator: 'ShopPilot AI Engine'
        });
      }
    } catch (err) {
      console.warn('Live investigation failed. Using client fallback.', err);
      const inv = generateInvestigation(order, customer, order.ruleEvaluation);
      setInvestigation(inv);
      setEmailSubject(inv.email_subject || '');
      setEmailBody(inv.email_body || '');
    } finally {
      setInvestigating(false);
    }
  };

  const handleApprove = () => {
    if (onRecordActivity) {
      onRecordActivity({
        type: 'approval',
        orderNumber: order.orderNumber,
        title: `Draft approved for ${order.orderNumber}`,
        description: `Subject: "${emailSubject}" approved for customer ${order.customerName}. Safe mode: stored locally.`,
        draftContent: { subject: emailSubject, body: emailBody },
        operator: 'Operator (Human Approval)'
      });
    }
    setIsApproved(true);
  };

  const handleCopy = () => {
    const fullText = `Subject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard?.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const needsAttention = order.ruleEvaluation?.needsAttention;
  const formatDateTime = (isoString) => {
    if (!isoString) return 'Not set';
    try {
      return new Date(isoString).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur flex flex-col shadow-2xl">
      
      {/* Panel Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-mono">{order.orderNumber}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed {order.ageDays === 0 ? 'Today' : `${order.ageDays} days ago`} • Total: {order.currencySymbol}{order.total?.toLocaleString()}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-210px)]">
        <div className={`p-4 rounded-xl border ${
          needsAttention
            ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
        }`}>
          <div className="flex items-start gap-3">
            {needsAttention ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  needsAttention ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {needsAttention ? 'SLA Alert Triggered' : 'Healthy Order'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 font-mono border border-slate-700">
                  {order.ruleEvaluation?.category || 'SLA Policy'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {order.ruleEvaluation?.explanation}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2.5">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Customer Context</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-bold text-white text-sm">{order.customerName}</div>
              <div className="text-slate-400">{order.customerEmail}</div>
              {customer?.city && (
                <div className="flex items-center gap-1 text-slate-400 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{customer.city}</span>
                </div>
              )}
              {customer && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400">
                  <span>Total Orders: <strong className="text-white">{customer.totalOrders}</strong></span>
                  <span>Spend: <strong className="text-white">₹{customer.totalSpent?.toLocaleString()}</strong></span>
                </div>
              )}
              {customer && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-slate-900/70 border border-slate-800 px-2 py-1.5">
                    <span className="block text-slate-500">Tier</span>
                    <strong className="text-indigo-300">{customer.loyaltyTier || 'Standard'}</strong>
                  </div>
                  <div className="rounded-xl bg-slate-900/70 border border-slate-800 px-2 py-1.5">
                    <span className="block text-slate-500">Channel</span>
                    <strong className="text-slate-200">{customer.preferredChannel || 'Email'}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2.5">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <span>Payment & Shipping</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div>
                <span className="text-slate-400">Payment: </span>
                <span className="font-medium text-slate-200">{order.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-400">Shipping: </span>
                <span className="font-medium text-slate-200">{order.shippingMethod}</span>
              </div>
              {order.internalNotes && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-amber-300/90 italic">
                  Note: "{order.internalNotes}"
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3">
              <Truck className="w-4 h-4 text-indigo-400" />
              <span>Fulfillment Signals</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-2">
                <span className="block text-slate-500">Stage</span>
                <strong className="text-slate-200">{order.fulfillmentStage || 'Not available'}</strong>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-2">
                <span className="block text-slate-500">Warehouse</span>
                <strong className="text-slate-200">{order.warehouse || 'Unassigned'}</strong>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-2">
                <span className="block text-slate-500">Tracking</span>
                <strong className="text-slate-200">{order.trackingId || order.trackingStatus || 'Pending'}</strong>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-2">
                <span className="block text-slate-500">Inventory</span>
                <strong className="text-slate-200">{order.inventoryStatus || 'Unknown'}</strong>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3">
              <Gauge className="w-4 h-4 text-indigo-400" />
              <span>Decision Context</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-2">
                <span className="block text-slate-500">Priority</span>
                <strong className={order.priority === 'High' ? 'text-rose-300' : 'text-slate-200'}>{order.priority || 'Normal'}</strong>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-2">
                <span className="block text-slate-500">Refund Risk</span>
                <strong className={order.refundRisk === 'High' ? 'text-rose-300' : 'text-slate-200'}>{order.refundRisk || 'Low'}</strong>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-2">
                <span className="block text-slate-500">Sentiment</span>
                <strong className="text-slate-200">{order.customerSentiment || 'Neutral'}</strong>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-2">
                <span className="block text-slate-500">Tickets</span>
                <strong className="text-slate-200">{order.supportTickets || 0} open</strong>
              </div>
            </div>
            {order.nextBestAction && (
              <p className="mt-3 rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-2.5 text-[11px] leading-relaxed text-indigo-200">
                {order.nextBestAction}
              </p>
            )}
          </div>
        </div>

        {(order.tags?.length > 0 || order.timeline?.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {order.tags?.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2.5">
                  <Tags className="w-4 h-4 text-indigo-400" />
                  <span>Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {order.tags.map(tag => (
                    <span key={tag} className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {order.timeline?.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2.5">
                  <CalendarClock className="w-4 h-4 text-indigo-400" />
                  <span>Recent Timeline</span>
                </div>
                <div className="space-y-2">
                  {order.timeline.slice(-3).map(event => (
                    <div key={`${event.label}-${event.at}`} className="flex items-start gap-2 text-[11px]">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                      <div>
                        <div className="font-semibold text-slate-200">{event.label}</div>
                        <div className="text-slate-500">{formatDateTime(event.at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2.5">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" />
              <span>Order Items ({order.items?.length || 0})</span>
            </div>
            <span className="text-slate-400 font-bold">Total: {order.currencySymbol}{order.total?.toLocaleString()}</span>
          </div>
          <div className="divide-y divide-slate-800/80">
            {order.items?.map(item => (
              <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-slate-200">{item.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">SKU: {item.sku} • Qty: {item.quantity}</div>
                </div>
                <div className="font-semibold text-slate-300">
                  {order.currencySymbol}{(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-slate-950/80 p-5 shadow-inner">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Action Center</h3>
                <p className="text-[11px] text-slate-400">Root-cause summary and customer-ready draft</p>
              </div>
            </div>

            {!investigation && (
              <button
                onClick={handleInvestigate}
                disabled={investigating}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {investigating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Investigate Order</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Investigation Result */}
          {investigation && (
            <div className="space-y-4">
              
              {/* Badge & Model Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-b border-indigo-500/20 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-indigo-300">Engine:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    {investigation.provider}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Human review required</span>
                </div>
              </div>

              {/* Diagnosis & Summary */}
              <div className="space-y-2.5">
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Diagnosis
                  </h4>
                  <p className="text-xs text-slate-200 bg-slate-950/70 p-3 rounded-xl border border-slate-800 leading-relaxed">
                    {investigation.reason}
                  </p>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Situation Summary
                  </h4>
                  <p className="text-xs text-slate-200 bg-slate-950/70 p-3 rounded-xl border border-slate-800 leading-relaxed">
                    {investigation.summary}
                  </p>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Recommended Next Step
                  </h4>
                  <p className="text-xs text-indigo-300 bg-indigo-950/50 p-3 rounded-xl border border-indigo-500/30 font-medium leading-relaxed">
                    {investigation.recommended_next_step}
                  </p>
                </div>
              </div>

              {/* Customer Email Draft (Editable) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <h4 className="text-xs font-bold text-white">Customer Email Draft (Editable)</h4>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy Draft'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      disabled={isApproved}
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Body</label>
                    <textarea
                      rows={6}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      disabled={isApproved}
                      className="w-full mt-1 p-3 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
                    />
                  </div>
                </div>

                {/* Approval & Action Bar */}
                <div className="mt-4 pt-4 border-t border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Approving saves the draft locally. No email is sent automatically.</span>
                  </div>

                  {isApproved ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Approved for Follow-up</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleApprove}
                      className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Follow-up Draft</span>
                    </button>
                  )}
                </div>

              </div>

            </div>
          )}

          {!investigation && !investigating && (
            <p className="text-xs text-slate-400 leading-relaxed">
              Click <strong className="text-slate-200">Investigate Order</strong> to generate a concise status summary, root-cause diagnosis, and editable customer email draft.
            </p>
          )}

        </div>

      </div>

    </div>
  );
}


