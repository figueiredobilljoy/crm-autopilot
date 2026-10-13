// Client-side AI Investigation Engine
// Generates structured investigation and editable customer email draft with zero API costs.

export function generateInvestigation(order, customer, ruleEvaluation) {
  const customerFirstName = customer?.name?.split(' ')[0] || order.customerName.split(' ')[0] || 'Customer';
  const itemListStr = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

  let reason = '';
  let summary = '';
  let recommendedNextStep = '';
  let emailSubject = '';
  let emailBody = '';

  if (order.status === 'processing' && order.ageDays >= 2) {
    reason = `Order ${order.orderNumber} has stayed in 'processing' status for ${order.ageDays} days, exceeding the 48-hour fulfillment benchmark.`;
    summary = `Customer ${customer?.name || order.customerName} placed order ${order.orderNumber} (${order.currencySymbol}${order.total}) ${order.ageDays} days ago for: ${itemListStr}. Packing slip was generated, but carrier tracking has not been assigned by fulfillment.`;
    recommendedNextStep = `Send a proactive delay acknowledgment to ${customerFirstName} and escalate dispatch with warehouse priority tag.`;
    emailSubject = `Update regarding your order ${order.orderNumber} - ShopPilot Care`;
    emailBody = `Dear ${customerFirstName},

Thank you for your recent purchase with us! We are reaching out regarding your order ${order.orderNumber} (${itemListStr}).

Our team is currently preparing your package for dispatch. While we aim to fulfill orders within 48 hours, your order has experienced a slight delay during final packaging and quality inspection.

Rest assured, our warehouse team has expedited your shipment. As soon as your package is dispatched with our courier partner, you will receive an updated tracking link.

If you have any questions or require changes to your delivery address, simply reply to this email. We sincerely appreciate your patience and support!

Warm regards,
Customer Support Team
ShopPilot Store`;
  } else if (order.status === 'on-hold') {
    reason = `Order ${order.orderNumber} is 'on-hold' due to pending payment verification (${order.paymentMethod}).`;
    summary = `Order ${order.orderNumber} (${order.currencySymbol}${order.total}) from ${customer?.name || order.customerName} is waiting for payment confirmation. ${order.internalNotes}`;
    recommendedNextStep = `Request bank transfer reference from ${customerFirstName} to reconcile account deposit and release items.`;
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
    provider: 'ShopPilot AI Engine',
    model: 'Deterministic SLA Copilot (Demo Mode)',
    is_fallback: true,
    investigated_at: new Date().toISOString()
  };
}
