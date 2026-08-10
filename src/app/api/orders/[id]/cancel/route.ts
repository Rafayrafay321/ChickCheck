import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = params
    
    const order = await db.order.findUnique({ where: { id } })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order nahi mila' }, { status: 404 })
    }

    if (order.status === 'DELIVERED') {
      return NextResponse.json({ success: false, error: 'Deliver shuda order cancel nahi ho sakta' }, { status: 400 })
    }

    await db.$transaction(async (tx) => {
      // Mark order as cancelled
      await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' }
      })
      
      // Also update the associated invoice to be cancelled
      await tx.invoice.update({
        where: { orderId: id },
        data: { status: 'CANCELLED' }
      })
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
