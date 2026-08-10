export interface ProductStock {
  id: string
  name: string
  nameUrdu: string | null
  unit: 'kg' | 'piece'
  currentStock: number
}

export interface StockHistoryEntry {
  id: string
  productId: string
  type: 'IN' | 'OUT'
  quantity: number
  note: string | null
  entryDate: string
  product?: {
    name: string
    nameUrdu: string | null
    unit: 'kg' | 'piece'
  }
}
