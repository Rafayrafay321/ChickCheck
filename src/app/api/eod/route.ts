import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { EndOfDayInput } from '@/shared/types'

export async function GET() {
  try {
    const reports = await db.endOfDay.findMany({
      orderBy: { reportDate: 'desc' },
      take: 30,
    })
    return NextResponse.json({ success: true, data: reports })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EndOfDayInput & { liveClosingKg?: number }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 1. Get today's rate
    const todayRate = await db.dailyRate.findFirst({
      where: { date: today },
    })

    // 2. Calculate Total Sales Today
    const todayOrders = await db.order.findMany({
      where: {
        orderDate: { gte: today, lt: tomorrow },
        status: { not: 'CANCELLED' },
      },
    })
    const totalSales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)

    // 3. Calculate Total Purchases Today
    const todayPurchases = await db.supplierPurchase.findMany({
      where: {
        purchaseDate: { gte: today, lt: tomorrow },
      },
    })
    const totalPurchases = todayPurchases.reduce((sum, p) => sum + p.totalAmount, 0)

    // 4. Calculate Total Expenses Today
    const todayExpenses = await db.expense.findMany({
      where: { date: { gte: today, lt: tomorrow } },
    })
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0)

    // 5. Emergency / Shortfall Purchase Cost Today
    const todayEmergencyPurchases = await db.emergencyPurchase.findMany({
      where: { purchaseDate: { gte: today, lt: tomorrow } },
    })
    const totalEmergencyPurchaseCost = todayEmergencyPurchases.reduce((sum, ep) => sum + ep.totalCost, 0)

    // 6. Calculate Profit Margins (Emergency purchases are a real cost)
    const grossProfit = totalSales - totalPurchases - totalEmergencyPurchaseCost
    const netProfit = grossProfit - totalExpenses

    // 6. Live Weight Pool Reconciliation
    let poolDiscrepancy = 0
    const liveClosingKg = body.liveClosingKg ?? body.retailCashDrawer ?? 0 // fallback or specified

    const pool = await db.liveWeightPool.findUnique({
      where: { date: today },
    })

    if (pool) {
      const expectedRemaining = pool.openingWeight + pool.purchasesWeight - pool.soldWeight
      poolDiscrepancy = liveClosingKg - expectedRemaining

      await db.liveWeightPool.update({
        where: { id: pool.id },
        data: {
          closingWeight: liveClosingKg,
          variance: poolDiscrepancy,
          note: body.note?.trim() || null,
        },
      })
    }

    // 7. Record Physical External Stock Audits if provided
    if (body.audits && Array.isArray(body.audits)) {
      for (const audit of body.audits) {
        await db.dailyStockAudit.create({
          data: {
            productId: audit.productId,
            auditDate: today,
            closingKg: audit.closingKg,
          },
        })
      }
    }

    // 8. Save EndOfDay Report
    const report = await db.endOfDay.upsert({
      where: { reportDate: today },
      update: {
        farmRate: todayRate?.farmRate || null,
        supplyRate: todayRate?.supplyRate || null,
        totalSales,
        totalPurchases,
        totalExpenses,
        grossProfit,
        netProfit,
        retailCashDrawer: body.retailCashDrawer || 0,
        discrepancy: poolDiscrepancy,
        note: body.note?.trim() || null,
        createdAt: new Date(),
      },
      create: {
        reportDate: today,
        farmRate: todayRate?.farmRate || null,
        supplyRate: todayRate?.supplyRate || null,
        totalSales,
        totalPurchases,
        totalExpenses,
        grossProfit,
        netProfit,
        retailCashDrawer: body.retailCashDrawer || 0,
        discrepancy: poolDiscrepancy,
        note: body.note?.trim() || null,
      },
    })

    return NextResponse.json({ success: true, data: report }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
