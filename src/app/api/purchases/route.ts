import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { SupplierPurchaseInput } from '@/shared/types'

export async function GET() {
  try {
    const purchases = await db.supplierPurchase.findMany({
      orderBy: { purchaseDate: 'desc' },
      take: 50,
    })
    return NextResponse.json({ success: true, data: purchases })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SupplierPurchaseInput

    if (!body.supplierName?.trim()) {
      return NextResponse.json({ success: false, error: 'Supplier ka naam zaroori hai' }, { status: 400 })
    }
    if (!body.grossWeight || body.grossWeight <= 0) {
      return NextResponse.json({ success: false, error: 'Gross weight daalein' }, { status: 400 })
    }

    // Get today's supply rate
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayRate = await db.dailyRate.findFirst({
      where: { date: today },
    })

    if (!todayRate) {
      return NextResponse.json(
        { success: false, error: 'Pehle aaj ka Farm Rate enter karein!' },
        { status: 400 }
      )
    }

    const dud = body.dudWeight ?? 0
    const netWeight = Math.max(0, body.grossWeight - dud)
    const ratePerKg = todayRate.supplyRate
    const totalAmount = netWeight * ratePerKg
    const cashPaid = body.cashPaid ?? 0

    const purchase = await db.supplierPurchase.create({
      data: {
        supplierName: body.supplierName.trim(),
        grossWeight: body.grossWeight,
        dudWeight: dud,
        netWeight,
        ratePerKg,
        totalAmount,
        cashPaid,
      },
    })

    // Auto-update Live Hen StockEntry IN
    const liveHenProduct = await db.product.findFirst({
      where: { name: { contains: 'Live' } },
    })

    if (liveHenProduct) {
      await db.stockEntry.create({
        data: {
          productId: liveHenProduct.id,
          type: 'IN',
          quantity: netWeight,
          note: `Supplier Purchase: ${body.supplierName.trim()}`,
        },
      })
    }

    return NextResponse.json({ success: true, data: purchase }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
