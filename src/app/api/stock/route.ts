import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const latestEod = await db.endOfDay.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    const sessionStart = latestEod ? latestEod.createdAt : today

    // Check purchases and sold since sessionStart
    const [purchasesAgg, pool] = await Promise.all([
      db.supplierPurchase.aggregate({
        _sum: { netWeight: true },
        where: { purchaseDate: { gte: sessionStart } },
      }),
      db.liveWeightPool.findUnique({
        where: { date: today },
      }),
    ])

    // Determine opening weight:
    // If today's pool has had an EOD closing (pool?.closingWeight !== null):
    // The active session opens with that closing weight.
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

    // Purchases weight in this active session
    const purchasesWeight = purchasesAgg._sum.netWeight ?? 0

    // Sold weight in this active session (non-byproduct items only)
    const soldOrders = await db.order.findMany({
      where: {
        orderDate: { gte: sessionStart },
        status: { not: 'CANCELLED' },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    let soldWeight = 0
    for (const order of soldOrders) {
      for (const item of order.items) {
        if (!item.product.isByproduct) {
          soldWeight += item.quantity
        }
      }
    }

    const availableWeight = openingWeight + purchasesWeight - soldWeight

    return NextResponse.json({
      success: true,
      data: {
        livePool: {
          id: pool?.id ?? 'session',
          date: today,
          openingWeight,
          purchasesWeight,
          soldWeight,
          availableWeight,
          closingWeight: pool?.closingWeight ?? null,
          variance: pool?.variance ?? null,
        },
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, type, quantity, note } = body

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product select karein' }, { status: 400 })
    }
    if (type !== 'IN' && type !== 'OUT') {
      return NextResponse.json({ success: false, error: 'Type IN ya OUT honi chahiye' }, { status: 400 })
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return NextResponse.json({ success: false, error: 'Wazan zero se zyada hona chahiye (Quantity > 0)' }, { status: 400 })
    }

    const entry = await db.stockEntry.create({
      data: {
        productId,
        type,
        quantity: Number(quantity),
        note: note || null,
      },
    })

    return NextResponse.json({ success: true, data: entry }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
