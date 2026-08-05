import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { EndOfDayInput } from '@/shared/types'

export async function GET() {
  try {
    const history = await db.endOfDay.findMany({ orderBy: { reportDate: 'desc' } })
    return NextResponse.json({ success: true, data: history })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as EndOfDayInput
    const eod = await db.endOfDay.create({
      data: {
        reportDate: new Date(data.reportDate),
        openingStockKg: data.openingStockKg,
        closingStockKg: data.closingStockKg,
        retailCashDrawer: data.retailCashDrawer,
        restaurantSales: data.restaurantSales,
        retailCalculated: data.retailCalculated,
        discrepancy: data.discrepancy,
        note: data.note
      }
    })
    return NextResponse.json({ success: true, data: eod })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
