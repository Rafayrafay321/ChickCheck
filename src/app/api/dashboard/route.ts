import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find the latest EOD report to know if today's session has been closed
    const latestEod = await db.endOfDay.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    // If an EOD was completed, current open session starts after that EOD.
    // Otherwise, current session starts at midnight of today.
    const sessionStart = latestEod ? latestEod.createdAt : today

    const [
      todayOrders,
      todayPurchasesResult,
      todayExpensesResult,
      todayEmergencyPurchasesResult,
      totalUdhaarResult,
      pendingOrders,
      recentOrders,
      recentPayments,
      purchasesAgg,
      pool,
      supplierPayableResult,
    ] = await Promise.all([
      db.order.findMany({
        where: { orderDate: { gte: sessionStart }, status: { not: 'CANCELLED' } },
        include: { items: { include: { product: true } } },
      }),
      db.supplierPurchase.findMany({
        where: { purchaseDate: { gte: sessionStart } },
      }),
      db.expense.findMany({
        where: { date: { gte: sessionStart } },
      }),
      db.emergencyPurchase.findMany({
        where: { purchaseDate: { gte: sessionStart } },
      }),
      db.invoice.aggregate({
        where: { status: { notIn: ['PAID', 'CANCELLED'] } },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      db.order.count({ where: { status: 'PENDING', createdAt: { gte: sessionStart } } }),
      db.order.findMany({
        take: 6,
        orderBy: { orderDate: 'desc' },
        include: { customer: { select: { name: true, type: true } } },
      }),
      db.payment.findMany({
        take: 6,
        orderBy: { paidAt: 'desc' },
        include: { customer: { select: { name: true } } },
      }),
      db.supplierPurchase.aggregate({
        _sum: { netWeight: true },
        where: { purchaseDate: { gte: sessionStart } },
      }),
      db.liveWeightPool.findUnique({
        where: { date: today },
      }),
      db.supplier.aggregate({
        where: { isActive: true },
        _sum: { totalPayable: true },
      }),
    ])

    const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const todayPurchases = todayPurchasesResult.reduce((sum, p) => sum + p.totalAmount, 0)
    const todayExpenses = todayExpensesResult.reduce((sum, e) => sum + e.amount, 0)
    const todayEmergencyCost = todayEmergencyPurchasesResult.reduce((sum, ep) => sum + ep.totalCost, 0)

    const grossProfit = todaySales - todayPurchases - todayEmergencyCost
    const netProfit = grossProfit - todayExpenses

    // Live Pool Calculation for Active Session
    let openingWeight = 0
    if (pool && pool.closingWeight !== null) {
      openingWeight = pool.closingWeight
    } else if (pool) {
      openingWeight = pool.openingWeight
    } else {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const prevPool = await db.liveWeightPool.findUnique({ where: { date: yesterday } })
      openingWeight = prevPool?.closingWeight ?? 0
    }

    const purchasesWeight = purchasesAgg._sum.netWeight ?? 0

    let soldWeight = 0
    for (const order of todayOrders) {
      for (const item of order.items) {
        if (!item.product.isByproduct) {
          soldWeight += item.quantity
        }
      }
    }

    const livePoolAvailable = Math.max(0, openingWeight + purchasesWeight - soldWeight)

    return NextResponse.json({
      success: true,
      data: {
        todaySales,
        todayPurchases: todayPurchases + todayEmergencyCost,
        todayExpenses,
        netProfit,
        totalUdhaar: Math.max(0, (totalUdhaarResult._sum.totalAmount ?? 0) - (totalUdhaarResult._sum.paidAmount ?? 0)),
        totalSupplierPayable: Math.max(0, supplierPayableResult._sum.totalPayable ?? 0),
        pendingOrders,
        livePoolAvailable,
        recentOrders,
        recentPayments,
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
