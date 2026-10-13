// Demo Data for ShopPilot AI CRM
// Fictional records for WooCommerce store demo

export const demoCustomers = [
  {
    id: "cust-1",
    name: "Maya Fernandes",
    email: "maya.fernandes@example.com",
    phone: "+91 98201 12345",
    city: "Panaji, Goa",
    totalOrders: 3,
    totalSpent: 6497,
    customerSince: "2025-08-14"
  },
  {
    id: "cust-2",
    name: "Arjun Naik",
    email: "arjun.naik@example.com",
    phone: "+91 98450 67890",
    city: "Bengaluru, Karnataka",
    totalOrders: 1,
    totalSpent: 899,
    customerSince: "2026-03-02"
  },
  {
    id: "cust-3",
    name: "Sara D'Souza",
    email: "sara.dsouza@example.com",
    phone: "+91 97654 32109",
    city: "Mumbai, Maharashtra",
    totalOrders: 5,
    totalSpent: 11250,
    customerSince: "2025-01-20"
  },
  {
    id: "cust-4",
    name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    phone: "+91 99100 55443",
    city: "New Delhi, Delhi",
    totalOrders: 2,
    totalSpent: 5699,
    customerSince: "2025-11-05"
  },
  {
    id: "cust-5",
    name: "Priya Patel",
    email: "priya.patel@example.com",
    phone: "+91 98220 99887",
    city: "Ahmedabad, Gujarat",
    totalOrders: 4,
    totalSpent: 9800,
    customerSince: "2025-06-11"
  }
];

export const demoOrders = [
  {
    id: "1042",
    orderNumber: "#1042",
    customerId: "cust-1",
    customerName: "Maya Fernandes",
    customerEmail: "maya.fernandes@example.com",
    status: "processing",
    ageDays: 4,
    createdAt: "2026-10-09T09:43:50Z",
    currency: "INR",
    currencySymbol: "₹",
    total: 2499,
    paymentMethod: "UPI / Razorpay (Paid)",
    shippingMethod: "Standard Express Delivery",
    items: [
      { id: "item-1", name: "Organic Handwoven Linen Shirt - Sage Green", quantity: 1, price: 1799, sku: "LIN-SHIRT-M-GRN" },
      { id: "item-2", name: "Handcrafted Coconut Shell Buttons Set", quantity: 1, price: 700, sku: "ACC-BTN-SET" }
    ],
    shippingAddress: {
      address1: "Villa 14, Dona Paula Heights",
      city: "Panaji",
      state: "Goa",
      postcode: "403004",
      country: "India"
    },
    internalNotes: "Warehouse pack slip generated 3 days ago. No tracking ID scanned yet."
  },
  {
    id: "1043",
    orderNumber: "#1043",
    customerId: "cust-2",
    customerName: "Arjun Naik",
    customerEmail: "arjun.naik@example.com",
    status: "completed",
    ageDays: 1,
    createdAt: "2026-10-12T09:43:50Z",
    currency: "INR",
    currencySymbol: "₹",
    total: 899,
    paymentMethod: "Credit Card (Paid)",
    shippingMethod: "Standard Express Delivery",
    items: [
      { id: "item-3", name: "Ceramic Coffee Mug - Indigo Wave", quantity: 1, price: 899, sku: "MUG-IND-01" }
    ],
    shippingAddress: {
      address1: "42 Indiranagar 100ft Road",
      city: "Bengaluru",
      state: "Karnataka",
      postcode: "560038",
      country: "India"
    },
    internalNotes: "Delivered via BlueDart tracking #BD982341. Customer signed."
  },
  {
    id: "1044",
    orderNumber: "#1044",
    customerId: "cust-3",
    customerName: "Sara D'Souza",
    customerEmail: "sara.dsouza@example.com",
    status: "on-hold",
    ageDays: 2,
    createdAt: "2026-10-11T09:43:50Z",
    currency: "INR",
    currencySymbol: "₹",
    total: 1799,
    paymentMethod: "Direct Bank Transfer (Awaiting confirmation)",
    shippingMethod: "Surface Courier",
    items: [
      { id: "item-4", name: "Aromatherapy Soy Candle Gift Box (3-Pack)", quantity: 1, price: 1799, sku: "CNDL-BOX-3" }
    ],
    shippingAddress: {
      address1: "Flat 402, Sea Green Apts, Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      postcode: "400050",
      country: "India"
    },
    internalNotes: "Bank transfer reference provided by customer does not match statement yet."
  },
  {
    id: "1045",
    orderNumber: "#1045",
    customerId: "cust-4",
    customerName: "Rahul Sharma",
    customerEmail: "rahul.sharma@example.com",
    status: "processing",
    ageDays: 0,
    createdAt: "2026-10-13T05:43:50Z",
    currency: "INR",
    currencySymbol: "₹",
    total: 3200,
    paymentMethod: "UPI (Paid)",
    shippingMethod: "Standard Express Delivery",
    items: [
      { id: "item-5", name: "Artisanal Leather Journal - Saddle Tan", quantity: 2, price: 1600, sku: "JRNL-LTHR-BRN" }
    ],
    shippingAddress: {
      address1: "C-12 Hauz Khas",
      city: "New Delhi",
      state: "Delhi",
      postcode: "110016",
      country: "India"
    },
    internalNotes: "Ordered today. Picked and queued for packaging."
  },
  {
    id: "1046",
    orderNumber: "#1046",
    customerId: "cust-5",
    customerName: "Priya Patel",
    customerEmail: "priya.patel@example.com",
    status: "pending",
    ageDays: 3,
    createdAt: "2026-10-10T09:43:50Z",
    currency: "INR",
    currencySymbol: "₹",
    total: 5450,
    paymentMethod: "Net Banking (Unpaid)",
    shippingMethod: "Standard Delivery",
    items: [
      { id: "item-6", name: "Brass Tabletop Planter with Stand", quantity: 2, price: 2725, sku: "PLNT-BRS-02" }
    ],
    shippingAddress: {
      address1: "7 Navrangpura Park",
      city: "Ahmedabad",
      state: "Gujarat",
      postcode: "380009",
      country: "India"
    },
    internalNotes: "Payment gateway timed out. Inventory reserved in WooCommerce for 72 hrs."
  }
];

export const initialActivityLog = [
  {
    id: "act-1",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: "system_flag",
    orderNumber: "#1042",
    title: "Order flagged by SLA policy",
    description: "Order #1042 reached 4 days in 'processing' status (exceeds 48-hour threshold).",
    operator: "Rule Engine"
  },
  {
    id: "act-2",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    type: "system_flag",
    orderNumber: "#1044",
    title: "Order placed on hold",
    description: "Order #1044 marked 'on-hold' awaiting direct bank transfer reconciliation.",
    operator: "Payment Gateway"
  }
];
