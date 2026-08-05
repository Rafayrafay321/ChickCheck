import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todaySalesResult, totalUdhaarResult, pendingOrders] = await Promise.all([
      db.order.aggregate({
        where: { status: 'DELIVERED', deliveredAt: { gte: today } },
        _sum: { totalAmount: true }
      }),
      db.customer.aggregate({ _sum: { totalUdhaar: true } }),
      db.order.count({ where: { status: 'PENDING' } })
    ])

    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: { orderDate: 'desc' },
      include: { customer: true }
    })

    const recentPayments = await db.payment.findMany({
      take: 5,
      orderBy: { paidAt: 'desc' },
      include: { customer: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        todaySales: todaySalesResult._sum.totalAmount ?? 0,
        totalUdhaar: totalUdhaarResult._sum.totalUdhaar ?? 0,
        pendingOrders,
        recentOrders,
        recentPayments
      }
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
