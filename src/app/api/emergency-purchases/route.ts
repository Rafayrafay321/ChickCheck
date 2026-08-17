import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — Today's emergency purchases with remaining available qty per product
export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const latestEod = await db.endOfDay.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    const sessionStart = latestEod ? latestEod.createdAt : today

    const purchases = await db.emergencyPurchase.findMany({
      where: { purchaseDate: { gte: sessionStart } },
      include: { product: { select: { name: true, nameUrdu: true, unit: true } } },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate how much of each emergency purchase has been consumed via StockEntry OUT(EMERGENCY)
    const productIds = purchases
      .filter((p) => !p.isLiveHen && p.productId)
      .map((p) => p.productId as string)

    const emergencyUsedMap: Record<string, number> = {}

    if (productIds.length > 0) {
      const usedEntries = await db.stockEntry.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        where: {
          productId: { in: productIds },
          type: 'OUT',
          source: 'EMERGENCY',
          entryDate: { gte: sessionStart },
        },
      })
      usedEntries.forEach((e) => {
        emergencyUsedMap[e.productId] = e._sum.quantity ?? 0
      })
    }

    // For emergency live hens — calculate how much used via EMERGENCY_HEN OUT entries
    const totalEmergencyHenPurchased = purchases
      .filter((p) => p.isLiveHen)
      .reduce((sum, p) => sum + p.quantity, 0)

    const emergencyHenUsedEntry = await db.stockEntry.aggregate({
      _sum: { quantity: true },
      where: {
        type: 'OUT',
        source: 'EMERGENCY_HEN',
        entryDate: { gte: sessionStart },
      },
    })
    const emergencyHenUsed = emergencyHenUsedEntry._sum.quantity ?? 0

    const enrichedPurchases = purchases.map((p) => ({
      ...p,
      usedQty: p.isLiveHen ? 0 : (emergencyUsedMap[p.productId ?? ''] ?? 0),
      remainingQty: p.isLiveHen
        ? Math.max(0, totalEmergencyHenPurchased - emergencyHenUsed)
        : Math.max(0, p.quantity - (emergencyUsedMap[p.productId ?? ''] ?? 0)),
    }))

    return NextResponse.json({
      success: true,
      data: {
        purchases: enrichedPurchases,
        totalEmergencyHenAvailable: Math.max(0, totalEmergencyHenPurchased - emergencyHenUsed),
        totalEmergencyCost: purchases.reduce((sum, p) => sum + p.totalCost, 0),
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

// POST — Record a new emergency/shortfall purchase
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { isLiveHen, productId, supplierName, quantity, costPerKg, note } = body

    if (!quantity || Number(quantity) <= 0) {
      return NextResponse.json({ success: false, error: 'Quantity sahi daalein (> 0)' }, { status: 400 })
    }
    if (!costPerKg || Number(costPerKg) <= 0) {
      return NextResponse.json({ success: false, error: 'Purchase Rate daalein (Rs/kg)' }, { status: 400 })
    }
    if (!isLiveHen && !productId) {
      return NextResponse.json({ success: false, error: 'Product select karein' }, { status: 400 })
    }

    const qty = Number(quantity)
    const rate = Number(costPerKg)
    const totalCost = qty * rate

    const purchase = await db.$transaction(async (tx) => {
      const ep = await tx.emergencyPurchase.create({
        data: {
          isLiveHen: Boolean(isLiveHen),
          productId: isLiveHen ? null : productId,
          supplierName: supplierName?.trim() || null,
          quantity: qty,
          costPerKg: rate,
          totalCost,
          note: note?.trim() || null,
        },
      })

      // For ready-cut products: immediately create a StockEntry IN tagged EMERGENCY
      // so the auto-priority deduction in orders can find it
      if (!isLiveHen && productId) {
        await tx.stockEntry.create({
          data: {
            productId,
            type: 'IN',
            quantity: qty,
            source: 'EMERGENCY',
            note: `Emergency purchase @ Rs${rate}/kg${supplierName ? ` from ${supplierName}` : ''}`,
          },
        })
      }

      return ep
    })

    return NextResponse.json({ success: true, data: purchase }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
