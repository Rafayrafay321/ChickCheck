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
    const body = (await request.json()) as EndOfDayInput

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
      where: {
        date: { gte: today, lt: tomorrow },
      },
    })
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0)

    // 5. Calculate Profit Margins
    const grossProfit = totalSales - totalPurchases
    const netProfit = grossProfit - totalExpenses

    // 6. Record Physical Stock Audits
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

    // 7. Save EndOfDay Report
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
        note: body.note?.trim() || null,
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
        note: body.note?.trim() || null,
      },
    })

    return NextResponse.json({ success: true, data: report }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
