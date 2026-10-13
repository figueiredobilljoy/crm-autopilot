// WooCommerce REST API Service for ShopPilot AI (Read-Only Mode)
// Strictly read-only: does not modify orders, update status, or dispatch emails.

export async function testWooCommerceConnection({ storeUrl, consumerKey, consumerSecret }) {
  if (!storeUrl || !consumerKey || !consumerSecret) {
    return {
      success: false,
      message: 'Store URL, Consumer Key, and Consumer Secret are required.'
    };
  }

  try {
    const cleanUrl = storeUrl.replace(/\/+$/, '');
    const authHeader = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    // Test endpoint with 1 order to verify read credentials
    const endpoint = `${cleanUrl}/wp-json/wc/v3/orders?per_page=1`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'ShopPilot-AI-CRM/0.1.0'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        status: response.status,
        message: `WooCommerce responded with HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Successfully connected to WooCommerce store in Read-Only mode.',
      orderCountTested: Array.isArray(data) ? data.length : 0
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to reach WooCommerce store: ${err.message}`
    };
  }
}

export async function fetchWooCommerceOrders({ storeUrl, consumerKey, consumerSecret }, perPage = 10) {
  const cleanUrl = storeUrl.replace(/\/+$/, '');
  const authHeader = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const endpoint = `${cleanUrl}/wp-json/wc/v3/orders?per_page=${perPage}&order=desc&orderby=date`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'User-Agent': 'ShopPilot-AI-CRM/0.1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`WooCommerce error ${response.status}: ${response.statusText}`);
  }

  const rawOrders = await response.json();

  // Normalize into ShopPilot CRM schema
  return rawOrders.map(raw => {
    const createdDate = new Date(raw.date_created || Date.now());
    const ageDays = Math.max(0, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      id: String(raw.id),
      orderNumber: `#${raw.number || raw.id}`,
      customerId: raw.customer_id ? `cust-${raw.customer_id}` : `guest-${raw.id}`,
      customerName: `${raw.billing?.first_name || 'Guest'} ${raw.billing?.last_name || ''}`.trim() || 'Valued Customer',
      customerEmail: raw.billing?.email || 'N/A',
      status: raw.status || 'processing',
      ageDays,
      createdAt: raw.date_created,
      currency: raw.currency || 'USD',
      currencySymbol: getCurrencySymbol(raw.currency),
      total: parseFloat(raw.total || 0),
      paymentMethod: raw.payment_method_title || raw.payment_method || 'Online Payment',
      shippingMethod: raw.shipping_lines?.[0]?.method_title || 'Standard Shipping',
      items: (raw.line_items || []).map(li => ({
        id: String(li.id),
        name: li.name,
        quantity: li.quantity,
        price: parseFloat(li.price || 0),
        sku: li.sku || 'N/A'
      })),
      shippingAddress: {
        address1: raw.shipping?.address_1 || raw.billing?.address_1 || '',
        city: raw.shipping?.city || raw.billing?.city || '',
        state: raw.shipping?.state || raw.billing?.state || '',
        postcode: raw.shipping?.postcode || raw.billing?.postcode || '',
        country: raw.shipping?.country || raw.billing?.country || ''
      },
      internalNotes: raw.customer_note || 'Fetched from live store.'
    };
  });
}

function getCurrencySymbol(currency) {
  switch (currency) {
    case 'INR': return '₹';
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return currency || '$';
  }
}
