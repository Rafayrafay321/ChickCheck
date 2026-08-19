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
  type: 'RESTAURANT' | 'RETAIL' | 'WHOLESALE'
  phone?: string
  address?: string
}

export interface ProductInput {
  name: string
  nameUrdu?: string
  unit: 'kg' | 'piece'
  pricingType?: 'MULTIPLIER' | 'FIXED'
  defaultMultiplier?: number
  pricePerUnit?: number
  isExternal?: boolean
  isByproduct?: boolean // Kaleji, Pota, Wings, Necks — no live pool deduction
}


export interface DailyRateInput {
  farmRate: number
  supplierPremium?: number
}

export interface SupplierInput {
  name: string
  phone?: string
  address?: string
  ratePremium?: number
}

export interface SupplierPaymentInput {
  supplierId: string
  amount: number
  method?: 'CASH' | 'JAZZCASH' | 'EASYPAISA' | 'BANK'
  note?: string
}

export interface SupplierPurchaseInput {
  supplierId?: string
  supplierName: string
  grossWeight: number
  dudWeight?: number
  ratePerKg?: number
  cashPaid?: number
}

export interface BatchSupplierPurchaseInput {
  items: SupplierPurchaseInput[]
}

export interface CustomerMultiplierInput {
  customerId: string
  productId: string
  multiplier: number
}

export interface ExpenseInput {
  category: 'PETROL' | 'BAGS' | 'BIKE' | 'PUNCHER' | 'POLICE' | 'LUNCH' | 'WAGES' | 'OTHER'
  amount: number
  note?: string
}

export interface StockAuditInput {
  productId: string
  closingKg: number
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
  retailCashDrawer: number
  liveClosingKg?: number
  note?: string
  audits?: StockAuditInput[]
}

export interface OrderFilters {
  status?: string
  customerId?: string
  date?: string
  startDate?: string
  endDate?: string
}

export interface InvoiceFilters {
  status?: string
  customerId?: string
}
