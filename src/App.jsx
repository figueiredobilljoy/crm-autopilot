import React, { useState, useMemo } from 'react';
import Header from './components/Header.jsx';
import StatsCards from './components/StatsCards.jsx';
import OrderList from './components/OrderList.jsx';
import OrderDetailPanel from './components/OrderDetailPanel.jsx';
import CustomerDrawer from './components/CustomerDrawer.jsx';
import ActivityLogModal from './components/ActivityLogModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import AgenticChatbot from './components/AgenticChatbot.jsx';
import { demoOrders, demoCustomers, initialActivityLog } from './demoData.js';
import { evaluateOrderRules } from './rules.js';
import { ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Enriched initial orders with deterministic SLA rules.
  const initialEnrichedOrders = useMemo(() => {
    return demoOrders.map(order => ({
      ...order,
      ruleEvaluation: evaluateOrderRules(order)
    }));
  }, []);

  const [orders, setOrders] = useState(initialEnrichedOrders);
  const [customers, setCustomers] = useState(demoCustomers);
  const [activities, setActivities] = useState(initialActivityLog);
  
  const [selectedOrderId, setSelectedOrderId] = useState('1042');
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];
  const selectedCustomer = customers.find(c => c.id === selectedOrder?.customerId);
  
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);

  const handleRecordActivity = (activityPayload) => {
    const newEntry = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: activityPayload.type || 'approval',
      orderNumber: activityPayload.orderNumber || selectedOrder?.orderNumber || 'General',
      title: activityPayload.title || 'Action taken',
      description: activityPayload.description || '',
      draftContent: activityPayload.draftContent || null,
      operator: activityPayload.operator || 'Operator (Human Approval)'
    };
    setActivities(prev => [newEntry, ...prev]);
  };

  const handleResetDemo = () => {
    setOrders(demoOrders.map(o => ({ ...o, ruleEvaluation: evaluateOrderRules(o) })));
    setCustomers(demoCustomers);
    setSelectedOrderId('1042');
    setActivities(prev => [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'system',
        orderNumber: 'System',
        title: 'Sample dataset reset',
        description: 'Reloaded initial sample orders and SLA criteria.',
        operator: 'System'
      },
      ...prev
    ]);
  };

  const totalNeedingAttention = orders.filter(o => o.ruleEvaluation?.needsAttention).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        status={{ dataMode: 'sample', aiProvider: 'Deterministic', hasCustomAiKey: false }}
        isLiveStore={false}
        totalNeedingAttention={totalNeedingAttention}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenActivity={() => setIsActivityOpen(true)}
        onResetDemo={handleResetDemo}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-white">Safe operations enabled:</strong>{' '}
              <span>Order insights, draft generation, and activity logging run without sending customer emails automatically.</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium shrink-0">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> SLA Sentinel Active
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" /> AI Copilot Ready
            </span>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <StatsCards orders={orders} customers={customers} />

        {/* 2-Column Workstation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Orders List & Filters (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <OrderList
              orders={orders}
              selectedOrderId={selectedOrderId}
              onSelectOrder={(order) => {
                setSelectedOrderId(order.id);
              }}
            />
          </div>

          {/* Right Column: Order Detail & AI Hub (5 Cols) */}
          <div className="lg:col-span-5 sticky top-24">
            <OrderDetailPanel
              order={selectedOrder}
              customer={selectedCustomer}
              onClose={() => setSelectedOrderId(null)}
              onRecordActivity={handleRecordActivity}
            />
          </div>

        </div>

      </main>

      {/* Customer Context Drawer */}
      {isCustomerDrawerOpen && (
        <CustomerDrawer
          customer={selectedCustomer}
          onClose={() => setIsCustomerDrawerOpen(false)}
          onSelectOrder={(order) => {
            setSelectedOrderId(order.id);
          }}
        />
      )}

      {/* Activity Log Modal */}
      {isActivityOpen && (
        <ActivityLogModal
          activities={activities}
          onClose={() => setIsActivityOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          status={{ dataMode: 'sample', aiProvider: 'template' }}
          onClose={() => setIsSettingsOpen(false)}
          onSettingsSaved={() => {}}
          onSyncWooCommerce={() => {}}
          onResetDemo={handleResetDemo}
        />
      )}

      {/* Agentic CRM Chatbot */}
      <AgenticChatbot
        orders={orders}
        customers={customers}
        activities={activities}
        selectedOrder={selectedOrder}
        onSelectOrder={(order) => setSelectedOrderId(order.id)}
        onRecordActivity={handleRecordActivity}
        onOpenActivity={() => setIsActivityOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        ShopPilot AI - WooCommerce CRM Copilot & SLA Sentinel
      </footer>

    </div>
  );
}


