import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = params
    
    const body = await request.json()
    const { status } = body

    if (!['PENDING', 'DELIVERED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Status sahi nahi hai' })
    }

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order nahi mila' }, { status: 404 })
    }

    // Business Logic: Only deduct stock when moving to DELIVERED
    // If order was already delivered, do nothing to prevent double deduction.
    const isNewDelivery = status === 'DELIVERED' && order.status !== 'DELIVERED'

    await db.$transaction(async (tx) => {
      // 1. Update order status
      await tx.order.update({
        where: { id },
        data: { 
          status, 
          deliveredAt: status === 'DELIVERED' ? new Date() : null 
        }
      })

      // 2. Deduct stock if newly delivered
      if (isNewDelivery) {
        for (const item of order.items) {
          await tx.stockEntry.create({
            data: {
              productId: item.productId,
              type: 'OUT',
              quantity: item.quantity,
              note: `Order #${order.id.slice(-6).toUpperCase()} deliver hua`
            }
          })
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
