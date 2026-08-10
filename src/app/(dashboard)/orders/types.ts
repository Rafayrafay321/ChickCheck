export interface OrderItemInput {
  productId: string
  quantity: number
}

export interface OrderProduct {
  name: string
  unit: string
}

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  total: number
  product: OrderProduct
}

export interface OrderCustomer {
  name: string
  type: string
}

export interface OrderInvoice {
  id: string
  status: string
  paidAmount: number
}

export interface OrderWithDetails {
  id: string
  customerId: string
  status: 'PENDING' | 'DELIVERED' | 'CANCELLED'
  totalAmount: number
  note: string | null
  orderDate: string
  deliveredAt: string | null
  customer: OrderCustomer
  items: OrderItem[]
  invoice: OrderInvoice | null
}
