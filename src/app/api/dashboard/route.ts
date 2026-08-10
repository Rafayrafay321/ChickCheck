import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [
      todayOrders,
      todayPurchasesResult,
      todayExpensesResult,
      totalUdhaarResult,
      pendingOrders,
      products,
      recentOrders,
      recentPayments,
    ] = await Promise.all([
      db.order.findMany({
        where: { orderDate: { gte: today, lt: tomorrow }, status: { not: 'CANCELLED' } },
      }),
      db.supplierPurchase.findMany({
        where: { purchaseDate: { gte: today, lt: tomorrow } },
      }),
      db.expense.findMany({
        where: { date: { gte: today, lt: tomorrow } },
      }),
      db.customer.aggregate({ _sum: { totalUdhaar: true } }),
      db.order.count({ where: { status: 'PENDING' } }),
      db.product.findMany({
        include: {
          stockEntries: { select: { type: true, quantity: true } },
        },
      }),
      db.order.findMany({
        take: 5,
        orderBy: { orderDate: 'desc' },
        include: { customer: { select: { name: true, type: true } } },
      }),
      db.payment.findMany({
        take: 5,
        orderBy: { paidAt: 'desc' },
        include: { customer: { select: { name: true } } },
      }),
    ])

    const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const todayPurchases = todayPurchasesResult.reduce((sum, p) => sum + p.totalAmount, 0)
    const todayExpenses = todayExpensesResult.reduce((sum, e) => sum + e.amount, 0)
    const grossProfit = todaySales - todayPurchases
    const netProfit = grossProfit - todayExpenses

    // Calculate low stock count (< 10kg)
    let lowStockCount = 0
    products.forEach((p) => {
      const stockIn = p.stockEntries.filter((s) => s.type === 'IN').reduce((sum, s) => sum + s.quantity, 0)
      const stockOut = p.stockEntries.filter((s) => s.type === 'OUT').reduce((sum, s) => sum + s.quantity, 0)
      const currentStock = stockIn - stockOut
      if (currentStock < 10) lowStockCount++
    })

    return NextResponse.json({
      success: true,
      data: {
        todaySales,
        todayPurchases,
        todayExpenses,
        netProfit,
        totalUdhaar: totalUdhaarResult._sum.totalUdhaar ?? 0,
        pendingOrders,
        lowStockCount,
        recentOrders,
        recentPayments,
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
