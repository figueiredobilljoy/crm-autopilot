// Deterministic Rule Engine for ShopPilot AI
// Evaluates orders against fulfillment SLAs and operational criteria without hallucination.

export function evaluateOrderRules(order) {
  const { status, ageDays, total, paymentMethod } = order;

  // Rule 1: Processing beyond SLA threshold (> 2 days)
  if (status === 'processing' && ageDays >= 2) {
    return {
      needsAttention: true,
      severity: ageDays >= 4 ? 'high' : 'medium',
      category: 'Delayed Fulfillment',
      triggerRule: `Processing for ${ageDays} days (SLA threshold is 2 days)`,
      explanation: `Order ${order.orderNumber} has remained in 'processing' status for ${ageDays} days. Standard store policy requires dispatch within 48 hours. A customer check-in or warehouse expedite is recommended.`
    };
  }

  // Rule 2: On-hold orders (> 1 day)
  if (status === 'on-hold') {
    return {
      needsAttention: true,
      severity: 'medium',
      category: 'Awaiting Action',
      triggerRule: `Order on-hold for ${ageDays} day(s)`,
      explanation: `Order ${order.orderNumber} is marked 'on-hold' awaiting manual resolution (e.g., payment verification or address confirmation).`
    };
  }

  // Rule 3: Payment pending for 2+ days
  if (status === 'pending' && ageDays >= 2) {
    return {
      needsAttention: true,
      severity: 'medium',
      category: 'Payment Unresolved',
      triggerRule: `Payment pending for ${ageDays} days`,
      explanation: `Order ${order.orderNumber} has not completed checkout payment for ${ageDays} days. Customer may have encountered payment gateway issues.`
    };
  }

  // Rule 4: High value processing order needing tracking
  if (status === 'processing' && total >= 5000) {
    return {
      needsAttention: true,
      severity: 'low',
      category: 'High Value Order',
      triggerRule: `High-value order (₹${total}) in processing`,
      explanation: `Order ${order.orderNumber} is a high-value transaction. Recommended to ensure priority dispatch and proactive notification.`
    };
  }

  // Healthy orders
  if (status === 'completed') {
    return {
      needsAttention: false,
      severity: 'none',
      category: 'Fulfilled',
      triggerRule: 'Completed',
      explanation: `Order ${order.orderNumber} was completed successfully. Delivery has been recorded.`
    };
  }

  return {
    needsAttention: false,
    severity: 'none',
    category: 'Normal Processing',
    triggerRule: 'Within SLA',
    explanation: `Order ${order.orderNumber} is within normal fulfillment timelines.`
  };
}
