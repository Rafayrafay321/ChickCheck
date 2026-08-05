import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH — update order status. If DELIVERED → auto-deduct stock.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status } = await request.json() as { status: string }

    if (status === 'DELIVERED') {
      await db.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id }, include: { items: true } })
        if (!order) throw new Error('Order nahi mila')

        await tx.order.update({ where: { id }, data: { status, deliveredAt: new Date() } })

        for (const item of order.items) {
          await tx.stockEntry.create({
            data: {
              productId: item.productId,
              type: 'OUT',
              quantity: item.quantity,
              note: `Order ${id}`
            }
          })
        }
      })
    } else {
      await db.order.update({ where: { id }, data: { status } })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
