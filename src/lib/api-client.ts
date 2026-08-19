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
  InvoiceFilters,
  ExpenseInput,
  SupplierPurchaseInput,
  BatchSupplierPurchaseInput,
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
  login: (password: string) =>request('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),

  setupOwner: (data: OwnerSetupInput) =>request('/api/auth/setup', { method: 'POST', body: JSON.stringify(data) }),

  checkOwnerExists: () =>request<boolean>('/api/auth/check'),

  // ── Customers ─────────────────────────────────────────────────
  getCustomers: () =>request('/api/customers'),

  createCustomer: (data: CustomerInput) =>request('/api/customers', { method: 'POST', body: JSON.stringify(data) }),

  updateCustomer: (id: string, data: Partial<CustomerInput>) =>request(`/api/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteCustomer: (id: string) =>request(`/api/customers/${id}`, { method: 'DELETE' }),

  getCustomerUdhaar: (id: string) =>request(`/api/customers/${id}/udhaar`),

  getCustomerMultipliers: (customerId: string) =>request(`/api/customer-multipliers?customerId=${customerId}`),

  setCustomerMultiplier: (data: { customerId: string; productId: string; multiplier: number }) =>
    request('/api/customer-multipliers', { method: 'POST', body: JSON.stringify(data) }),

  // ── Products ──────────────────────────────────────────────────
  getProducts: () =>request('/api/products'),

  createProduct: (data: ProductInput) =>request('/api/products', { method: 'POST', body: JSON.stringify(data) }),

  updateProduct: (id: string, data: Partial<ProductInput>) =>request(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // ── Stock ─────────────────────────────────────────────────────
  getStockSummary: () =>request('/api/stock'),

  addStockEntry: (data: StockEntryInput) =>request('/api/stock', { method: 'POST', body: JSON.stringify(data) }),

  getStockHistory: (productId: string) =>request(`/api/stock/${productId}`),

  // ── Orders ────────────────────────────────────────────────────
  getOrders: (filters?: OrderFilters) => {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.customerId) params.set('customerId', filters.customerId)
    if (filters?.date) params.set('date', filters.date)
    if (filters?.startDate) params.set('startDate', filters.startDate)
    if (filters?.endDate) params.set('endDate', filters.endDate)
    const qs = params.toString()
    return request(`/api/orders${qs ? `?${qs}` : ''}`)
  },

  createOrder: (data: CreateOrderInput) =>request('/api/orders', { method: 'POST', body: JSON.stringify(data) }),

  updateOrderStatus: (id: string, status: string) =>request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  cancelOrder: (id: string) =>request(`/api/orders/${id}/cancel`, { method: 'PATCH' }),

  // ── Invoices ──────────────────────────────────────────────────
  getInvoices: (filters?: InvoiceFilters) => {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.customerId) params.set('customerId', filters.customerId)
    const qs = params.toString()
    return request(`/api/invoices${qs ? `?${qs}` : ''}`)
  },

  getInvoiceById: (id: string) =>request(`/api/invoices/${id}`),

  generatePDF: (invoiceId: string) =>request(`/api/invoices/${invoiceId}/pdf`),

  // ── Payments ──────────────────────────────────────────────────
  recordPayment: (data: RecordPaymentInput) =>request('/api/payments', { method: 'POST', body: JSON.stringify(data) }),

  getPaymentHistory: (customerId: string) =>request(`/api/payments/history/${customerId}`),

  // ── End of Day ────────────────────────────────────────────────
  submitEndOfDay: (data: EndOfDayInput) =>request('/api/eod', { method: 'POST', body: JSON.stringify(data) }),

  getEndOfDayHistory: () =>request('/api/eod'),

  // ── Sync ──────────────────────────────────────────────────────
  syncToCloud: () =>request('/api/sync', { method: 'POST' }),

  getSyncStatus: () =>request('/api/sync'),

  // ── Dashboard ─────────────────────────────────────────────────
  getDashboardStats: () =>request('/api/dashboard'),

  // ── Daily Rate ────────────────────────────────────────────────
  getDailyRate: () => request<{ id: string; date: string; farmRate: number; supplierPremium: number; supplyRate: number }>('/api/daily-rate'),

  updateDailyRate: (farmRate: number, supplierPremium: number = 4) =>
    request<{ id: string; date: string; farmRate: number; supplierPremium: number; supplyRate: number }>('/api/daily-rate', {
      method: 'POST',
      body: JSON.stringify({ farmRate, supplierPremium }),
    }),

  // ── Expenses ──────────────────────────────────────────────────
  getExpenses: (category?: string, date?: string) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (date) params.set('date', date)
    const qs = params.toString()
    return request(`/api/expenses${qs ? `?${qs}` : ''}`)
  },

  createExpense: (data: ExpenseInput) =>
    request('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),

  deleteExpense: (id: string) =>
    request(`/api/expenses/${id}`, { method: 'DELETE' }),

  // ── Suppliers ──────────────────────────────────────────────────
  getSuppliers: (search?: string, activeOnly?: boolean) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (activeOnly) params.set('activeOnly', 'true')
    const qs = params.toString()
    return request<Array<{ id: string; name: string; phone: string | null; address: string | null; ratePremium: number; totalPayable: number; isActive: boolean; _count?: { purchases: number; payments: number } }>>(`/api/suppliers${qs ? `?${qs}` : ''}`)
  },

  createSupplier: (data: { name: string; phone?: string; address?: string; ratePremium?: number }) =>
    request('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),

  updateSupplier: (id: string, data: { name?: string; phone?: string; address?: string; ratePremium?: number; isActive?: boolean }) =>
    request(`/api/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteSupplier: (id: string) =>
    request(`/api/suppliers/${id}`, { method: 'DELETE' }),

  getSupplierLedger: (id: string) =>
    request(`/api/suppliers/${id}/ledger`),

  recordSupplierPayment: (data: { supplierId: string; amount: number; method?: string; note?: string }) =>
    request('/api/supplier-payments', { method: 'POST', body: JSON.stringify(data) }),

  // ── Purchases ─────────────────────────────────────────────────
  getPurchases: (date?: string, all?: boolean) => {
    const params = new URLSearchParams()
    if (date) params.set('date', date)
    if (all) params.set('all', 'true')
    const qs = params.toString()
    return request(`/api/purchases${qs ? `?${qs}` : ''}`)
  },

  createPurchase: (data: SupplierPurchaseInput) =>
    request('/api/purchases', { method: 'POST', body: JSON.stringify(data) }),

  createPurchasesBatch: (data: BatchSupplierPurchaseInput) =>
    request('/api/purchases', { method: 'POST', body: JSON.stringify(data) }),

  // ── Emergency Purchases ───────────────────────────────────────
  getEmergencyPurchases: () =>
    request('/api/emergency-purchases'),

  createEmergencyPurchase: (data: {
    isLiveHen: boolean
    productId?: string
    supplierName?: string
    quantity: number
    costPerKg: number
    note?: string
  }) =>
    request('/api/emergency-purchases', { method: 'POST', body: JSON.stringify(data) }),
} as const
