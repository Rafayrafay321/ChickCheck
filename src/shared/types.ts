// ─── API Response Wrapper ────────────────────────────────────────
// Every API route returns this shape. The frontend always knows what to expect.
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ─── Domain Input Types ──────────────────────────────────────────
// These define what the frontend sends TO the API.

export interface OwnerSetupInput {
  name: string
  shopName: string
  phone?: string
  password: string
}

export interface CustomerInput {
  name: string
  type: 'RESTAURANT' | 'RETAIL'
  phone?: string
  address?: string
}

export interface ProductInput {
  name: string
  nameUrdu?: string
  unit: 'kg' | 'piece'
  pricePerUnit: number
}

export interface StockEntryInput {
  productId: string
  type: 'IN' | 'OUT'
  quantity: number
  note?: string
}

export interface CreateOrderInput {
  customerId: string
  note?: string
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
  }>
}

export interface RecordPaymentInput {
  invoiceId: string
  customerId: string
  amount: number
  method?: 'CASH' | 'JAZZCASH' | 'EASYPAISA' | 'BANK'
  note?: string
}

export interface EndOfDayInput {
  reportDate: string
  openingStockKg: number
  closingStockKg: number
  retailCashDrawer: number
  restaurantSales: number
  retailCalculated: number
  discrepancy: number
  note?: string
}

export interface OrderFilters {
  status?: string
  customerId?: string
}

export interface InvoiceFilters {
  status?: string
  customerId?: string
}
