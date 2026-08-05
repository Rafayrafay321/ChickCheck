import type {
  ApiResponse,
  OwnerSetupInput,
  CustomerInput,
  ProductInput,
  StockEntryInput,
  CreateOrderInput,
  RecordPaymentInput,
  EndOfDayInput,
  OrderFilters,
  InvoiceFilters
} from '@/shared/types'

// ─── Typed Fetch Wrapper ─────────────────────────────────────────
// Replaces window.electronAPI — every method calls an API route
// and returns the same ApiResponse<T> shape.

async function request<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    return await res.json()
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────
  login: (password: string) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),

  setupOwner: (data: OwnerSetupInput) =>
    request('/api/auth/setup', { method: 'POST', body: JSON.stringify(data) }),

  checkOwnerExists: () =>
    request<boolean>('/api/auth/check'),

  // ── Customers ─────────────────────────────────────────────────
  getCustomers: () =>
    request('/api/customers'),

  createCustomer: (data: CustomerInput) =>
    request('/api/customers', { method: 'POST', body: JSON.stringify(data) }),

  updateCustomer: (id: string, data: Partial<CustomerInput>) =>
    request(`/api/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteCustomer: (id: string) =>
    request(`/api/customers/${id}`, { method: 'DELETE' }),

  getCustomerUdhaar: (id: string) =>
    request(`/api/customers/${id}/udhaar`),

  // ── Products ──────────────────────────────────────────────────
  getProducts: () =>
    request('/api/products'),

  createProduct: (data: ProductInput) =>
    request('/api/products', { method: 'POST', body: JSON.stringify(data) }),

  updateProduct: (id: string, data: Partial<ProductInput>) =>
    request(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // ── Stock ─────────────────────────────────────────────────────
  getStockSummary: () =>
    request('/api/stock'),

  addStockEntry: (data: StockEntryInput) =>
    request('/api/stock', { method: 'POST', body: JSON.stringify(data) }),

  getStockHistory: (productId: string) =>
    request(`/api/stock/${productId}`),

  // ── Orders ────────────────────────────────────────────────────
  getOrders: (filters?: OrderFilters) => {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.customerId) params.set('customerId', filters.customerId)
    const qs = params.toString()
    return request(`/api/orders${qs ? `?${qs}` : ''}`)
  },

  createOrder: (data: CreateOrderInput) =>
    request('/api/orders', { method: 'POST', body: JSON.stringify(data) }),

  updateOrderStatus: (id: string, status: string) =>
    request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  cancelOrder: (id: string) =>
    request(`/api/orders/${id}/cancel`, { method: 'PATCH' }),

  // ── Invoices ──────────────────────────────────────────────────
  getInvoices: (filters?: InvoiceFilters) => {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.customerId) params.set('customerId', filters.customerId)
    const qs = params.toString()
    return request(`/api/invoices${qs ? `?${qs}` : ''}`)
  },

  getInvoiceById: (id: string) =>
    request(`/api/invoices/${id}`),

  generatePDF: (invoiceId: string) =>
    request(`/api/invoices/${invoiceId}/pdf`),

  // ── Payments ──────────────────────────────────────────────────
  recordPayment: (data: RecordPaymentInput) =>
    request('/api/payments', { method: 'POST', body: JSON.stringify(data) }),

  getPaymentHistory: (customerId: string) =>
    request(`/api/payments/history/${customerId}`),

  // ── End of Day ────────────────────────────────────────────────
  submitEndOfDay: (data: EndOfDayInput) =>
    request('/api/eod', { method: 'POST', body: JSON.stringify(data) }),

  getEndOfDayHistory: () =>
    request('/api/eod'),

  // ── Sync ──────────────────────────────────────────────────────
  syncToCloud: () =>
    request('/api/sync', { method: 'POST' }),

  getSyncStatus: () =>
    request('/api/sync'),

  // ── Dashboard ─────────────────────────────────────────────────
  getDashboardStats: () =>
    request('/api/dashboard'),
} as const
