import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { CreateOrderInput } from '@/shared/types'

// GET — list orders with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')

    const orders = await db.order.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(customerId ? { customerId } : {})
      },
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { orderDate: 'desc' }
    })
    return NextResponse.json({ success: true, data: orders })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

// POST — create order + items + auto-generate invoice (all in one transaction)
export async function POST(request: Request) {
  try {
    const data = await request.json() as CreateOrderInput
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId: data.customerId,
          note: data.note,
          totalAmount,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice
            }))
          }
        },
        include: { items: true, customer: true }
      })

      // Auto-create invoice for every order
      await tx.invoice.create({
        data: { orderId: newOrder.id, customerId: data.customerId, totalAmount }
      })

      // Update customer udhaar
      await tx.customer.update({
        where: { id: data.customerId },
        data: { totalUdhaar: { increment: totalAmount } }
      })

      return newOrder
    })

    return NextResponse.json({ success: true, data: order })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
