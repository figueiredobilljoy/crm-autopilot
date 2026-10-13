// AI Investigation Service for ShopPilot AI
// Integrates with Groq / Google Gemini / OpenAI when configured, or uses a deterministic template fallback.

const investigationCache = new Map();

export async function investigateOrder(order, customer, ruleEvaluation, config = {}) {
  // Check cache first to avoid unnecessary spending/calls
  const cacheKey = `order_${order.id}_${order.status}_${order.ageDays}`;
  if (investigationCache.has(cacheKey) && !config.forceRefresh) {
    return {
      ...investigationCache.get(cacheKey),
      cached: true
    };
  }

  const apiKey = config.apiKey || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  const provider = config.provider || (process.env.GROQ_API_KEY ? 'groq' : process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'template');

  // If live provider is requested and key exists, attempt LLM call
  if (apiKey && (provider === 'groq' || provider === 'gemini' || provider === 'openai')) {
    try {
      let result;
      if (provider === 'groq') {
        result = await callGroqAPI(apiKey, order, customer, ruleEvaluation);
      } else if (provider === 'gemini') {
        result = await callGeminiAPI(apiKey, order, customer, ruleEvaluation);
      } else {
        result = await callOpenAIAPI(apiKey, order, customer, ruleEvaluation);
      }

      if (result) {
        investigationCache.set(cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn(`[ShopPilot AI] LLM call failed (${provider}): ${err.message}. Switching to deterministic fallback template.`);
      // Fall through to deterministic template fallback
    }
  }

  // Deterministic Fallback Template (Zero API cost, instant, 100% reliable)
  const fallbackResult = generateDeterministicFallback(order, customer, ruleEvaluation);
  investigationCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}

function generateDeterministicFallback(order, customer, ruleEvaluation) {
  const customerFirstName = customer?.name?.split(' ')[0] || order.customerName.split(' ')[0] || 'Customer';
  const itemListStr = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

  let reason = '';
  let summary = '';
  let recommendedNextStep = '';
  let emailSubject = '';
  let emailBody = '';

  if (order.status === 'processing' && order.ageDays >= 2) {
    reason = `Order ${order.orderNumber} has stayed in 'processing' status for ${order.ageDays} days, exceeding the 48-hour fulfillment benchmark.`;
    summary = `Customer ${customer?.name || order.customerName} placed order ${order.orderNumber} (${order.currencySymbol}${order.total}) ${order.ageDays} days ago for items: ${itemListStr}. Internal note shows packing slip generated, but tracking ID has not been assigned by the fulfillment center.`;
    recommendedNextStep = `Send a proactive delay acknowledgment to the customer and escalate to fulfillment dispatch with priority tag.`;
    emailSubject = `Update regarding your order ${order.orderNumber} - ShopPilot Care`;
    emailBody = `Dear ${customerFirstName},

Thank you for your recent purchase with us! We are reaching out regarding your order ${order.orderNumber} (${itemListStr}).

Our team is currently preparing your package for dispatch. While we aim to fulfill orders within 48 hours, your order has experienced a slight delay in final quality check and packaging.

Rest assured, our warehouse team has expedited your shipment. As soon as your package is dispatched with our courier partner, you will receive an updated tracking link.

If you have any urgent queries or changes to your delivery address, simply reply to this email. We sincerely appreciate your patience and support!

Warm regards,
Customer Support Team
ShopPilot Store`;
  } else if (order.status === 'on-hold') {
    reason = `Order ${order.orderNumber} is 'on-hold' due to pending payment verification (${order.paymentMethod}).`;
    summary = `Order ${order.orderNumber} (${order.currencySymbol}${order.total}) from ${customer?.name || order.customerName} is waiting for payment confirmation. ${order.internalNotes}`;
    recommendedNextStep = `Request payment transaction confirmation reference from customer to reconcile bank deposit.`;
    emailSubject = `Action required: Confirming payment for order ${order.orderNumber}`;
    emailBody = `Dear ${customerFirstName},

Thank you for placing order ${order.orderNumber} with us!

Your order is currently on hold while we verify the payment via ${order.paymentMethod}. If you have already completed the transfer, please reply with your transaction reference or receipt so our accounts team can promptly release your package for shipping.

Items reserved:
${order.items.map(i => `• ${i.name} (Qty: ${i.quantity})`).join('\n')}

Thank you for shopping with us!

Warm regards,
ShopPilot Support`;
  } else if (order.status === 'pending') {
    reason = `Payment checkout incomplete for ${order.ageDays} days.`;
    summary = `Customer initiated checkout for order ${order.orderNumber} (${order.currencySymbol}${order.total}) ${order.ageDays} days ago, but the payment gateway transaction was not completed.`;
    recommendedNextStep = `Send friendly recovery reminder with secure checkout link before reserved inventory expires.`;
    emailSubject = `Complete your order ${order.orderNumber} at ShopPilot`;
    emailBody = `Hi ${customerFirstName},

We noticed you started checkout for order ${order.orderNumber} (${itemListStr}), but the transaction was not finalized.

We have temporarily reserved your items. If you would like to complete your purchase, you can proceed easily with your preferred payment method.

Need help or encountered an issue during checkout? Just reply to this email and we will be happy to assist you.

Best regards,
ShopPilot Support`;
  } else {
    reason = `Order status is '${order.status}' (${ruleEvaluation.triggerRule}).`;
    summary = `Order ${order.orderNumber} for ${order.customerName} has total value of ${order.currencySymbol}${order.total}. Status is currently ${order.status}.`;
    recommendedNextStep = `No urgent intervention required. Normal monitoring.`;
    emailSubject = `Your order ${order.orderNumber} status update`;
    emailBody = `Hi ${customerFirstName},

Thank you for shopping with us! Your order ${order.orderNumber} is currently ${order.status}.

We will keep you informed of any updates regarding your delivery.

Warm regards,
ShopPilot Support Team`;
  }

  return {
    reason,
    summary,
    recommended_next_step: recommendedNextStep,
    email_subject: emailSubject,
    email_body: emailBody,
    requires_human_review: true,
    provider: 'Deterministic Fallback Engine',
    model: 'Rule-Guided Template (Zero Credit Cost)',
    is_fallback: true,
    investigated_at: new Date().toISOString()
  };
}

async function callGroqAPI(apiKey, order, customer, ruleEvaluation) {
  const prompt = `Review this WooCommerce order using ONLY the supplied data. Do NOT invent shipping, tracking, warehouse, carrier, refund, or delivery facts. Explain why it may need attention, recommend a safe next step, and draft a polite merchant-to-customer email.

Order Data:
- Order Number: ${order.orderNumber}
- Customer: ${order.customerName} (${customer?.email || order.customerEmail})
- Status: ${order.status}
- Age: ${order.ageDays} days
- Total: ${order.currencySymbol}${order.total}
- Payment: ${order.paymentMethod}
- Shipping Method: ${order.shippingMethod}
- Fulfillment Stage: ${order.fulfillmentStage || 'Not supplied'}
- Warehouse: ${order.warehouse || 'Not supplied'}
- Tracking Status: ${order.trackingStatus || 'Not supplied'}
- Inventory Status: ${order.inventoryStatus || 'Not supplied'}
- Priority: ${order.priority || 'Normal'}
- Customer Sentiment: ${order.customerSentiment || 'Neutral'}
- Refund Risk: ${order.refundRisk || 'Low'}
- Open Support Tickets: ${order.supportTickets || 0}
- Existing Next Best Action: ${order.nextBestAction || 'None supplied'}
- Items: ${order.items.map(i => `${i.quantity}x ${i.name} (${i.sku})`).join(', ')}
- Notes: ${order.internalNotes || 'None supplied'}
- Rule Alert: ${ruleEvaluation.explanation}

Return only valid JSON with these exact keys:
{
  "reason": "Brief 1-2 sentence explanation of why this order was flagged",
  "summary": "Concise summary based strictly on supplied facts",
  "recommended_next_step": "Actionable next step for the merchant store team",
  "email_subject": "Professional email subject line for customer",
  "email_body": "Polite, empathetic email draft addressed to the customer",
  "requires_human_review": true
}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: 'You are ShopPilot AI, a careful WooCommerce CRM copilot. Use only supplied facts. Return strict JSON. Never claim an email was sent.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_completion_tokens: 1200
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No candidate response from Groq API');

  const parsed = JSON.parse(content);
  return {
    ...parsed,
    requires_human_review: true,
    provider: 'Groq',
    model: data.model || process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
    is_fallback: false,
    investigated_at: new Date().toISOString()
  };
}

async function callGeminiAPI(apiKey, order, customer, ruleEvaluation) {
  const prompt = `You are ShopPilot AI, an intelligent CRM assistant for WooCommerce merchants.
Review this order using ONLY the supplied data. Do NOT invent fake delivery tracking numbers, shipping carriers, or unsupplied facts.
Explain why it may need attention, recommend a safe next step, and draft a polite, professional merchant-to-customer email.

Order Data:
- Order Number: ${order.orderNumber}
- Customer: ${order.customerName} (${customer?.email || order.customerEmail})
- Status: ${order.status}
- Age: ${order.ageDays} days
- Total: ${order.currencySymbol}${order.total}
- Payment: ${order.paymentMethod}
- Fulfillment Stage: ${order.fulfillmentStage || 'Not supplied'}
- Inventory Status: ${order.inventoryStatus || 'Not supplied'}
- Customer Sentiment: ${order.customerSentiment || 'Neutral'}
- Refund Risk: ${order.refundRisk || 'Low'}
- Items: ${JSON.stringify(order.items)}
- Notes: ${order.internalNotes}
- Rule Alert: ${ruleEvaluation.explanation}

You MUST return STRICT JSON adhering to this exact schema (no markdown fences, just pure JSON):
{
  "reason": "Brief 1-2 sentence explanation of why this order was flagged",
  "summary": "Concise summary of the situation based strictly on facts",
  "recommended_next_step": "Actionable next step for the merchant store team",
  "email_subject": "Professional email subject line for customer",
  "email_body": "Polite, empathetic email draft addressed to the customer",
  "requires_human_review": true
}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No candidate response from Gemini API');

  const parsed = JSON.parse(text);
  return {
    ...parsed,
    requires_human_review: true,
    provider: 'Google Gemini',
    model: 'gemini-1.5-flash',
    is_fallback: false,
    investigated_at: new Date().toISOString()
  };
}

async function callOpenAIAPI(apiKey, order, customer, ruleEvaluation) {
  const prompt = `Review this WooCommerce order using ONLY the supplied data. Do NOT invent shipping or delivery facts. Explain why it may need attention, recommend a safe next step, and draft a polite email.

Order Data:
- Order Number: ${order.orderNumber}
- Customer: ${order.customerName}
- Status: ${order.status} (${order.ageDays} days old)
- Fulfillment Stage: ${order.fulfillmentStage || 'Not supplied'}
- Inventory Status: ${order.inventoryStatus || 'Not supplied'}
- Customer Sentiment: ${order.customerSentiment || 'Neutral'}
- Refund Risk: ${order.refundRisk || 'Low'}
- Items: ${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
- Total: ${order.currencySymbol}${order.total}
- Rule Flag: ${ruleEvaluation.explanation}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are ShopPilot AI CRM assistant. Respond in JSON with keys: reason, summary, recommended_next_step, email_subject, email_body, requires_human_review.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content);

  return {
    ...parsed,
    requires_human_review: true,
    provider: 'OpenAI',
    model: 'gpt-4o-mini',
    is_fallback: false,
    investigated_at: new Date().toISOString()
  };
}
