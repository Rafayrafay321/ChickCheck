export interface LivePool {
  openingWeight: number
  purchasesWeight: number
  soldWeight: number
  availableWeight: number
}

export interface EODReport {
  id: string
  reportDate: string
  farmRate: number | null
  supplyRate: number | null
  totalSales: number
  totalPurchases: number
  totalExpenses: number
  grossProfit: number
  netProfit: number
  retailCashDrawer: number
  discrepancy: number
  note: string | null
  createdAt: string
}
