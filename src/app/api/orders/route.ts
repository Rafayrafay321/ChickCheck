import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — List orders
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (customerId) where.customerId = customerId

    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setDate(end.getDate() + 1)
      end.setHours(0, 0, 0, 0)
      where.orderDate = { gte: start, lt: end }
    } else if (startDate && endDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.orderDate = { gte: start, lte: end }
    } else if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      where.orderDate = { gte: start }
    }

    const orders = await db.order.findMany({
      where,
      include: {
        customer: { select: { name: true, type: true } },
        items: {
          include: { product: { select: { name: true, unit: true } } },
        },
        invoice: { select: { id: true, status: true, paidAmount: true } },
      },
      orderBy: { orderDate: 'desc' },
    })

    return NextResponse.json({ success: true, data: orders })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

// POST — Create order + items + invoice with Dynamic Price Resolution
// Auto-Priority Deduction: Emergency Cut Stock → Emergency Live Hen → Own Live Weight Pool
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, note, items } = body

    if (!customerId) return NextResponse.json({ success: false, error: 'Customer chuno (Select customer)' }, { status: 400 })
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Koi item nahi dala (Add items)' }, { status: 400 })
    }

    // Get today's date window
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayRate = await db.dailyRate.findFirst({ where: { date: today } })
    const customerMultipliers = await db.customerMultiplier.findMany({ where: { customerId } })

    const productIds = items.map((i: { productId: string; quantity: number }) => i.productId)
    const products = await db.product.findMany({ where: { id: { in: productIds } } })

    let totalAmount = 0
    const orderItemsToCreate: Array<{
      productId: string
      quantity: number
      unitPrice: number
      total: number
      isByproduct: boolean
    }> = []

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return NextResponse.json({ success: false, error: `Product id ${item.productId} nahi mila` }, { status: 400 })
      if (!item.quantity || item.quantity <= 0) return NextResponse.json({ success: false, error: 'Wazan sahi nahi hai' }, { status: 400 })

      let unitPrice = product.pricePerUnit

      if (product.pricingType === 'MULTIPLIER') {
        if (!todayRate) {
          return NextResponse.json({ success: false, error: 'Pehle aaj ka Farm Rate enter karein!' }, { status: 400 })
        }
        const customOverride = customerMultipliers.find((m) => m.productId === product.id)
        const effectiveMultiplier = customOverride?.multiplier ?? product.defaultMultiplier ?? 1.0
        unitPrice = todayRate.supplyRate * effectiveMultiplier
      }

      const total = item.quantity * unitPrice
      totalAmount += total

      orderItemsToCreate.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        total,
        isByproduct: product.isByproduct,
      })
    }

    // Pre-fetch today's emergency stock available per product
    // Only for non-byproduct products (byproducts never deduct from pool)
    const poolProductIds = orderItemsToCreate
      .filter((i) => !i.isByproduct)
      .map((i) => i.productId)

    // Emergency stock available = SUM(IN, source=EMERGENCY) - SUM(OUT, source=EMERGENCY) per product today
    const emergencyInAgg = await db.stockEntry.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        productId: { in: poolProductIds },
        type: 'IN',
        source: 'EMERGENCY',
        entryDate: { gte: today, lt: tomorrow },
      },
    })
    const emergencyOutAgg = await db.stockEntry.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        productId: { in: poolProductIds },
        type: 'OUT',
        source: 'EMERGENCY',
        entryDate: { gte: today, lt: tomorrow },
      },
    })

    // Build a map: productId → available emergency qty
    const emergencyAvailableMap: Record<string, number> = {}
    emergencyInAgg.forEach((e) => { emergencyAvailableMap[e.productId] = e._sum.quantity ?? 0 })
    emergencyOutAgg.forEach((e) => {
      emergencyAvailableMap[e.productId] = (emergencyAvailableMap[e.productId] ?? 0) - (e._sum.quantity ?? 0)
    })

    // Emergency Live Hen available
    const emergencyHenPurchased = await db.emergencyPurchase.aggregate({
      _sum: { quantity: true },
      where: { isLiveHen: true, purchaseDate: { gte: today, lt: tomorrow } },
    })
    const emergencyHenOut = await db.stockEntry.aggregate({
      _sum: { quantity: true },
      where: { type: 'OUT', source: 'EMERGENCY_HEN', entryDate: { gte: today, lt: tomorrow } },
    })
    let emergencyHenAvailable = Math.max(
      0,
      (emergencyHenPurchased._sum.quantity ?? 0) - (emergencyHenOut._sum.quantity ?? 0)
    )

    // Use transaction to create Order, Items, Invoice, and handle stock deductions
    const newOrder = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId,
          note: note || null,
          totalAmount,
          status: 'PENDING',
          items: {
            create: orderItemsToCreate.map(({ isByproduct, ...rest }) => rest),
          },
        },
      })

      await tx.invoice.create({
        data: {
          orderId: order.id,
          customerId,
          totalAmount,
          paidAmount: 0,
          status: 'UNPAID',
        },
      })

      // Recalculate customer's total udhaar from unpaid/partial invoices
      const unpaidInvoices = await tx.invoice.aggregate({
        where: { customerId, status: { notIn: ['PAID', 'CANCELLED'] } },
        _sum: { totalAmount: true, paidAmount: true },
      })
      const newCustomerUdhaar = Math.max(0, (unpaidInvoices._sum.totalAmount ?? 0) - (unpaidInvoices._sum.paidAmount ?? 0))
      await tx.customer.update({
        where: { id: customerId },
        data: { totalUdhaar: newCustomerUdhaar },
      })

      let livePoolDeduction = 0

      for (const item of orderItemsToCreate) {
        // ─── BYPRODUCT CHECK ────────────────────────────────────────
        // Kaleji, Pota, Wings, Necks etc. — ye murgi se khud nikalti hain
        // Inke liye koi deduction nahi hogi Live Pool se
        if (item.isByproduct) continue

        // ─── AUTO-PRIORITY DEDUCTION (Primary Cuts only) ────────────
        // Step 1: Deduct from Emergency Cut Stock first
        const emergencyAvail = Math.max(0, emergencyAvailableMap[item.productId] ?? 0)
        const deductFromEmergency = Math.min(item.quantity, emergencyAvail)
        const deductFromLivePool = item.quantity - deductFromEmergency

        if (deductFromEmergency > 0) {
          await tx.stockEntry.create({
            data: {
              productId: item.productId,
              type: 'OUT',
              quantity: deductFromEmergency,
              source: 'EMERGENCY',
              note: `Auto-deduct emergency stock — Order #${order.id.slice(-6)}`,
            },
          })
          emergencyAvailableMap[item.productId] = emergencyAvail - deductFromEmergency
        }

        // Step 2: Remaining goes from Live Pool (emergency live hen or own hen)
        let remainingForPool = deductFromLivePool
        if (remainingForPool > 0 && emergencyHenAvailable > 0) {
          const deductFromEmergencyHen = Math.min(remainingForPool, emergencyHenAvailable)
          await tx.stockEntry.create({
            data: {
              productId: item.productId,
              type: 'OUT',
              quantity: deductFromEmergencyHen,
              source: 'EMERGENCY_HEN',
              note: `Auto-deduct emergency live hen — Order #${order.id.slice(-6)}`,
            },
          })
          emergencyHenAvailable -= deductFromEmergencyHen
          remainingForPool -= deductFromEmergencyHen
        }

        if (remainingForPool > 0) {
          livePoolDeduction += remainingForPool
        }
      }

      // Step 3: Deduct all own-hen usage from LiveWeightPool in one upsert
      if (livePoolDeduction > 0) {
        await tx.liveWeightPool.upsert({
          where: { date: today },
          update: { soldWeight: { increment: livePoolDeduction } },
          create: {
            date: today,
            openingWeight: 0,
            purchasesWeight: 0,
            soldWeight: livePoolDeduction,
          },
        })
      }

      return order
    })

    return NextResponse.json({ success: true, data: newOrder }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
