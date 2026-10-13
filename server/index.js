import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { demoOrders, demoCustomers, initialActivityLog } from './demoData.js';
import { evaluateOrderRules } from './rules.js';
import { investigateOrder } from './aiService.js';
import { testWooCommerceConnection, fetchWooCommerceOrders } from './woocommerceService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(distPath));

// In-memory runtime state for hackathon demo
let currentDataMode = 'demo'; // 'demo' | 'live'
let orders = [...demoOrders];
let customers = [...demoCustomers];
let activityLog = [...initialActivityLog];

let activeSettings = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  wcStoreUrl: process.env.WC_STORE_URL || '',
  wcConsumerKey: process.env.WC_CONSUMER_KEY || '',
  wcConsumerSecret: process.env.WC_CONSUMER_SECRET || '',
  aiProvider: process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'template'
};

// --- API Endpoints ---

// System status and configuration health
app.get('/api/status', (req, res) => {
  const hasLiveAiKey = !!(activeSettings.geminiApiKey || activeSettings.openaiApiKey);
  res.json({
    status: 'online',
    app: 'ShopPilot AI',
    dataMode: currentDataMode,
    aiProvider: hasLiveAiKey ? activeSettings.aiProvider : 'template',
    hasCustomAiKey: hasLiveAiKey,
    wcConnected: currentDataMode === 'live',
    timestamp: new Date().toISOString()
  });
});

// Orders list with evaluated deterministic attention rules
app.get('/api/orders', (req, res) => {
  const enrichedOrders = orders.map(order => {
    const ruleEvaluation = evaluateOrderRules(order);
    const customer = customers.find(c => c.id === order.customerId);
    return {
      ...order,
      customerName: customer ? customer.name : order.customerName,
      customerEmail: customer ? customer.email : order.customerEmail,
      ruleEvaluation
    };
  });

  res.json({
    dataMode: currentDataMode,
    count: enrichedOrders.length,
    orders: enrichedOrders
  });
});

// Single order details
app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => String(o.id) === String(req.params.id));
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const ruleEvaluation = evaluateOrderRules(order);
  const customer = customers.find(c => c.id === order.customerId);
  const customerOrders = orders.filter(o => o.customerId === order.customerId);

  res.json({
    ...order,
    ruleEvaluation,
    customer: customer ? { ...customer, orderHistory: customerOrders.map(o => ({ id: o.id, orderNumber: o.orderNumber, status: o.status, total: o.total, createdAt: o.createdAt })) } : null
  });
});

// Customers list
app.get('/api/customers', (req, res) => {
  const enrichedCustomers = customers.map(cust => {
    const custOrders = orders.filter(o => o.customerId === cust.id);
    return {
      ...cust,
      ordersCount: custOrders.length,
      orders: custOrders
    };
  });

  res.json({
    customers: enrichedCustomers
  });
});

// AI Investigation endpoint
app.post('/api/investigate', async (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => String(o.id) === String(orderId));

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const customer = customers.find(c => c.id === order.customerId);
  const ruleEvaluation = evaluateOrderRules(order);

  try {
    const investigation = await investigateOrder(order, customer, ruleEvaluation, {
      apiKey: activeSettings.geminiApiKey || activeSettings.openaiApiKey,
      provider: activeSettings.aiProvider
    });

    // Automatically record to activity log
    const logEntry = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'ai_investigation',
      orderNumber: order.orderNumber,
      title: `AI investigation run for ${order.orderNumber}`,
      description: `Generated diagnosis and customer draft via ${investigation.provider} (${investigation.model}).`,
      operator: 'ShopPilot AI Engine'
    };
    activityLog.unshift(logEntry);

    res.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      investigation
    });
  } catch (err) {
    res.status(500).json({
      error: 'Investigation failed',
      message: err.message
    });
  }
});

// Activity log
app.get('/api/activity', (req, res) => {
  res.json({
    activities: activityLog
  });
});

// Record user approval or operator action
app.post('/api/activity', (req, res) => {
  const { type, orderNumber, title, description, draftContent } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newActivity = {
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: type || 'approval',
    orderNumber: orderNumber || 'General',
    title,
    description: description || '',
    draftContent: draftContent || null,
    operator: 'Operator (Human Approval)'
  };

  activityLog.unshift(newActivity);
  res.status(201).json(newActivity);
});

// Reset demo data
app.post('/api/reset-demo', (req, res) => {
  orders = [...demoOrders];
  customers = [...demoCustomers];
  currentDataMode = 'demo';
  
  const resetLog = {
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'system',
    orderNumber: 'System',
    title: 'Demo dataset reloaded',
    description: 'Reset order and customer state back to the original demo records.',
    operator: 'System'
  };
  activityLog.unshift(resetLog);

  res.json({ success: true, message: 'Demo dataset reloaded', dataMode: currentDataMode });
});

// Settings & credentials update
app.post('/api/settings', (req, res) => {
  const { geminiApiKey, openaiApiKey, aiProvider, wcStoreUrl, wcConsumerKey, wcConsumerSecret } = req.body;

  if (geminiApiKey !== undefined) activeSettings.geminiApiKey = geminiApiKey.trim();
  if (openaiApiKey !== undefined) activeSettings.openaiApiKey = openaiApiKey.trim();
  if (aiProvider !== undefined) activeSettings.aiProvider = aiProvider;
  if (wcStoreUrl !== undefined) activeSettings.wcStoreUrl = wcStoreUrl.trim();
  if (wcConsumerKey !== undefined) activeSettings.wcConsumerKey = wcConsumerKey.trim();
  if (wcConsumerSecret !== undefined) activeSettings.wcConsumerSecret = wcConsumerSecret.trim();

  res.json({
    success: true,
    settings: {
      hasGeminiKey: !!activeSettings.geminiApiKey,
      hasOpenaiKey: !!activeSettings.openaiApiKey,
      aiProvider: activeSettings.aiProvider,
      wcStoreUrl: activeSettings.wcStoreUrl,
      hasWcKey: !!activeSettings.wcConsumerKey
    }
  });
});

// WooCommerce Read-Only test connection
app.post('/api/woocommerce/test', async (req, res) => {
  const { storeUrl, consumerKey, consumerSecret } = req.body;
  const url = storeUrl || activeSettings.wcStoreUrl;
  const key = consumerKey || activeSettings.wcConsumerKey;
  const secret = consumerSecret || activeSettings.wcConsumerSecret;

  const result = await testWooCommerceConnection({
    storeUrl: url,
    consumerKey: key,
    consumerSecret: secret
  });

  res.json(result);
});

// Switch to Live WooCommerce Mode (Read-only fetch)
app.post('/api/woocommerce/sync', async (req, res) => {
  const { storeUrl, consumerKey, consumerSecret } = req.body;
  const url = storeUrl || activeSettings.wcStoreUrl;
  const key = consumerKey || activeSettings.wcConsumerKey;
  const secret = consumerSecret || activeSettings.wcConsumerSecret;

  try {
    const liveOrders = await fetchWooCommerceOrders({
      storeUrl: url,
      consumerKey: key,
      consumerSecret: secret
    }, 10);

    orders = liveOrders;
    currentDataMode = 'live';

    activityLog.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'woocommerce_sync',
      orderNumber: 'Sync',
      title: 'Synced orders from live WooCommerce store',
      description: `Loaded ${liveOrders.length} orders in read-only mode from ${url}.`,
      operator: 'WooCommerce Connector'
    });

    res.json({
      success: true,
      dataMode: 'live',
      count: liveOrders.length,
      orders: liveOrders
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Fallback route for SPA client
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[ShopPilot AI] Server running on http://localhost:${PORT}`);
  console.log(`[ShopPilot AI] Initial mode: ${currentDataMode.toUpperCase()}`);
});
