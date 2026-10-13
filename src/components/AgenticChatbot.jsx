import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Minimize2,
  Sparkles,
  AlertTriangle,
  FileText,
  Settings,
  Activity,
  ChevronUp,
  CheckCircle2
} from 'lucide-react';
import { generateInvestigation } from '../aiService.js';

const starterPrompts = [
  'Review alerts',
  'Investigate selected',
  'Draft customer update',
  'Open activity log'
];

function formatMoney(order) {
  return `${order.currencySymbol || ''}${order.total?.toLocaleString?.() || order.total}`;
}

function findOrderFromText(text, orders) {
  const normalized = text.toLowerCase();
  return orders.find(order => {
    const bareNumber = String(order.orderNumber || '').replace('#', '').toLowerCase();
    return normalized.includes(String(order.id).toLowerCase())
      || normalized.includes(String(order.orderNumber).toLowerCase())
      || normalized.includes(`#${bareNumber}`)
      || normalized.includes(`order ${bareNumber}`);
  });
}

function findCustomerFromText(text, customers) {
  const normalized = text.toLowerCase();
  return customers.find(customer => {
    const name = customer.name.toLowerCase();
    const firstName = name.split(' ')[0];
    return normalized.includes(name) || normalized.includes(firstName) || normalized.includes(customer.email.toLowerCase());
  });
}

function makeAssistantMessage(content, tool = null) {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: 'assistant',
    content,
    tool,
    timestamp: new Date().toISOString()
  };
}

function makeUserMessage(content) {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: 'user',
    content,
    timestamp: new Date().toISOString()
  };
}

export default function AgenticChatbot({
  orders,
  customers,
  activities,
  selectedOrder,
  onSelectOrder,
  onRecordActivity,
  onOpenActivity,
  onOpenSettings
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    makeAssistantMessage('I am watching the CRM queue. Ask me to review alerts, investigate an order, draft a customer update, or open the audit trail.')
  ]);
  const listRef = useRef(null);

  const context = useMemo(() => {
    const attentionOrders = orders.filter(order => order.ruleEvaluation?.needsAttention);
    const highSeverity = attentionOrders.filter(order => order.ruleEvaluation?.severity === 'high');
    const latestActivity = activities[0];

    return {
      attentionOrders,
      highSeverity,
      latestActivity
    };
  }, [orders, activities]);

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const summarizeOrder = (order) => {
    const customer = customers.find(c => c.id === order.customerId);
    const attentionLine = order.ruleEvaluation?.needsAttention
      ? `${order.ruleEvaluation.category}: ${order.ruleEvaluation.triggerRule}`
      : `No active SLA flag: ${order.ruleEvaluation?.triggerRule || 'Within SLA'}`;

    return `${order.orderNumber} is ${order.status}, ${order.ageDays === 0 ? 'placed today' : `${order.ageDays} days old`}, worth ${formatMoney(order)} for ${customer?.name || order.customerName}. ${attentionLine}. Fulfillment: ${order.fulfillmentStage || 'not set'}. Priority: ${order.priority || 'Normal'}. Refund risk: ${order.refundRisk || 'Low'}. Next action: ${order.nextBestAction || 'normal monitoring'}`;
  };

  const runInvestigation = async (order, intent = 'investigation') => {
    const customer = customers.find(c => c.id === order.customerId);
    let investigation;

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
      investigation = data.investigation;
    } catch (err) {
      console.warn('Chatbot investigation fell back to local template.', err);
      investigation = generateInvestigation(order, customer, order.ruleEvaluation);
    }

    onSelectOrder?.(order);
    onRecordActivity?.({
      type: 'ai_investigation',
      orderNumber: order.orderNumber,
      title: `Chatbot ${intent} for ${order.orderNumber}`,
      description: `Agentic chatbot generated a diagnosis and draft via ${investigation.provider}.`,
      operator: 'ShopPilot Agentic Chatbot'
    });

    return `I inspected ${order.orderNumber}. ${investigation.reason}\n\nNext step: ${investigation.recommended_next_step}\n\nDraft subject: ${investigation.email_subject}\n\n${investigation.email_body}`;
  };

  const buildResponse = async (rawText) => {
    const text = rawText.trim();
    const lower = text.toLowerCase();
    const orderFromText = findOrderFromText(lower, orders);
    const customerFromText = findCustomerFromText(lower, customers);
    const activeOrder = orderFromText || selectedOrder;

    if (!text) return null;

    if (lower.includes('activity') || lower.includes('audit') || lower.includes('log')) {
      onOpenActivity?.();
      return makeAssistantMessage('Opening the activity and audit trail now.', 'open_activity_log');
    }

    if (lower.includes('setting') || lower.includes('connect') || lower.includes('credential')) {
      onOpenSettings?.();
      return makeAssistantMessage('Opening connection and AI settings now.', 'open_settings');
    }

    if (lower.includes('attention') || lower.includes('alert') || lower.includes('risk') || lower.includes('review alerts')) {
      if (!context.attentionOrders.length) {
        return makeAssistantMessage('The queue is clean right now. No order is breaching the active SLA rules.', 'review_alerts');
      }

      const ranked = [...context.attentionOrders].sort((a, b) => {
        const severityRank = { high: 3, medium: 2, low: 1, none: 0 };
        return (severityRank[b.ruleEvaluation?.severity] || 0) - (severityRank[a.ruleEvaluation?.severity] || 0);
      });

      const lines = ranked.map((order, index) => {
        const marker = index === 0 ? 'Top priority' : `Priority ${index + 1}`;
        return `${marker}: ${order.orderNumber} for ${order.customerName} - ${order.ruleEvaluation.category}, ${order.ruleEvaluation.triggerRule}.`;
      });

      onSelectOrder?.(ranked[0]);
      return makeAssistantMessage(`${lines.join('\n')}\n\nI selected ${ranked[0].orderNumber} so the detail panel is ready for review.`, 'review_alerts');
    }

    if (lower.includes('vip') || lower.includes('high value') || lower.includes('priority')) {
      const priorityOrders = orders
        .filter(order => order.priority === 'High' || order.tags?.includes('vip') || order.total >= 5000)
        .sort((a, b) => (b.total || 0) - (a.total || 0));

      if (!priorityOrders.length) {
        return makeAssistantMessage('No VIP or high-value priority orders are active right now.', 'priority_scan');
      }

      onSelectOrder?.(priorityOrders[0]);
      return makeAssistantMessage(priorityOrders.map(order => `${order.orderNumber}: ${order.customerName}, ${formatMoney(order)}, ${order.fulfillmentStage}. Next: ${order.nextBestAction}`).join('\n'), 'priority_scan');
    }

    if (lower.includes('ticket') || lower.includes('support')) {
      const ticketOrders = orders.filter(order => order.supportTickets > 0);
      if (!ticketOrders.length) {
        return makeAssistantMessage('No open support tickets are attached to the current orders.', 'support_scan');
      }

      onSelectOrder?.(ticketOrders[0]);
      return makeAssistantMessage(ticketOrders.map(order => `${order.orderNumber}: ${order.supportTickets} ticket${order.supportTickets === 1 ? '' : 's'}, sentiment ${order.customerSentiment}, refund risk ${order.refundRisk}.`).join('\n'), 'support_scan');
    }

    if (lower.includes('investigate') || lower.includes('draft') || lower.includes('follow-up') || lower.includes('follow up')) {
      if (!activeOrder) {
        return makeAssistantMessage('Select or mention an order first, then I can investigate it and prepare a safe draft.', 'needs_order');
      }

      const intent = lower.includes('draft') ? 'draft' : 'investigation';
      const investigationText = await runInvestigation(activeOrder, intent);
      return makeAssistantMessage(investigationText, intent === 'draft' ? 'draft_follow_up' : 'investigate_order');
    }

    if (orderFromText) {
      onSelectOrder?.(orderFromText);
      return makeAssistantMessage(`${summarizeOrder(orderFromText)}\n\nI selected it in the workspace.`, 'select_order');
    }

    if (customerFromText) {
      const customerOrders = orders.filter(order => order.customerId === customerFromText.id);
      const flagged = customerOrders.filter(order => order.ruleEvaluation?.needsAttention);
      const orderLine = customerOrders.map(order => `${order.orderNumber} (${order.status}, ${formatMoney(order)})`).join(', ');
      if (flagged[0]) onSelectOrder?.(flagged[0]);

      return makeAssistantMessage(`${customerFromText.name} is ${customerFromText.loyaltyTier || 'Standard'} tier, prefers ${customerFromText.preferredChannel || 'Email'}, and has NPS ${customerFromText.npsScore || 'n/a'}/10. Orders: ${orderLine}. ${flagged.length ? `${flagged.length} need review; I selected ${flagged[0].orderNumber}.` : 'No active SLA flags for this customer.'}`, 'customer_lookup');
    }

    if (lower.includes('next') || lower.includes('priority') || lower.includes('recommend')) {
      if (context.highSeverity[0]) {
        const order = context.highSeverity[0];
        onSelectOrder?.(order);
        return makeAssistantMessage(`Start with ${order.orderNumber}. It is high severity because ${order.ruleEvaluation.explanation} After that, review the remaining medium-priority holds and pending payments.`, 'next_best_action');
      }

      if (context.attentionOrders[0]) {
        const order = context.attentionOrders[0];
        onSelectOrder?.(order);
        return makeAssistantMessage(`Start with ${order.orderNumber}. ${order.ruleEvaluation.explanation}`, 'next_best_action');
      }

      return makeAssistantMessage('No urgent intervention is queued. A good next move is checking the latest activity log before syncing or connecting a live store.', 'next_best_action');
    }

    if (lower.includes('approve') || lower.includes('send email') || lower.includes('send the email')) {
      return makeAssistantMessage('I can prepare and record drafts, but final approval stays in the order panel. Safe mode keeps real email dispatch out of the chatbot.', 'safe_approval_guardrail');
    }

    const activeSummary = activeOrder ? `Selected order: ${summarizeOrder(activeOrder)}` : 'No order is currently selected.';
    return makeAssistantMessage(`${activeSummary}\n\nTry asking for alerts, a specific order number, an investigation, or a customer name.`, 'general_context');
  };

  const sendMessage = async (text = input) => {
    const clean = text.trim();
    if (!clean) return;

    const userMessage = makeUserMessage(clean);
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsOpen(true);

    const response = await buildResponse(clean);
    if (response) {
      setMessages(prev => [...prev, response]);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-2xl border border-indigo-400/40 bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-indigo-950/50 transition hover:bg-indigo-500"
        title="Open agentic chatbot"
      >
        <Bot className="h-5 w-5" />
        <span>Agent Chat</span>
        {context.attentionOrders.length > 0 && (
          <span className="ml-1 rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">
            {context.attentionOrders.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <section className="fixed bottom-5 right-5 z-40 flex h-[620px] max-h-[calc(100vh-2rem)] w-[390px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/70">
      <header className="border-b border-slate-800 bg-slate-950/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-300">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Agentic CRM Chat</h2>
              <p className="text-[11px] text-slate-400">
                {context.attentionOrders.length} active alert{context.attentionOrders.length === 1 ? '' : 's'} • {orders.length} orders
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title="Minimize chat"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMessages([makeAssistantMessage('Chat reset. I am still connected to the current CRM workspace.')])}
              className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title="Clear chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {starterPrompts.map(prompt => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/70 px-2.5 py-2 text-[11px] font-semibold text-slate-200 transition hover:border-indigo-500/50 hover:bg-slate-800"
            >
              {prompt === 'Review alerts' && <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />}
              {prompt === 'Investigate selected' && <Sparkles className="h-3.5 w-3.5 text-indigo-400" />}
              {prompt === 'Draft customer update' && <FileText className="h-3.5 w-3.5 text-emerald-400" />}
              {prompt === 'Open activity log' && <Activity className="h-3.5 w-3.5 text-sky-400" />}
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] whitespace-pre-wrap rounded-xl px-3.5 py-3 text-xs leading-relaxed ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-800 bg-slate-950/80 text-slate-200'
              }`}
            >
              {message.tool && message.role === 'assistant' && (
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase text-indigo-300">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{message.tool.replaceAll('_', ' ')}</span>
                </div>
              )}
              {message.content}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
        className="border-t border-slate-800 bg-slate-950/70 p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            rows={2}
            placeholder="Ask about orders, customers, drafts..."
            className="max-h-24 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-45"
            title="Send message"
          >
            {input.trim() ? <Send className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
          <span>Tools: select, investigate, draft, log, settings</span>
          <button type="button" onClick={onOpenSettings} className="inline-flex items-center gap-1 text-slate-400 hover:text-white">
            <Settings className="h-3 w-3" />
            <span>Settings</span>
          </button>
        </div>
      </form>
    </section>
  );
}


