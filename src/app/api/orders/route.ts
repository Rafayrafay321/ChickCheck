import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — List orders
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')

    const where: any = {}
    if (status) where.status = status
    if (customerId) where.customerId = customerId

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
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, note, items } = body

    if (!customerId) return NextResponse.json({ success: false, error: 'Customer chuno (Select customer)' }, { status: 400 })
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Koi item nahi dala (Add items)' }, { status: 400 })
    }

    // Get today's supply rate
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayRate = await db.dailyRate.findFirst({
      where: { date: today },
    })

    // Fetch customer's custom multipliers
    const customerMultipliers = await db.customerMultiplier.findMany({
      where: { customerId },
    })

    // Validate products and calculate unit price on-the-fly
    const productIds = items.map((i: any) => i.productId)
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    })

    let totalAmount = 0
    const orderItemsToCreate: Array<{ productId: string; quantity: number; unitPrice: number; total: number }> = []

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return NextResponse.json({ success: false, error: `Product id ${item.productId} nahi mila` }, { status: 400 })
      if (!item.quantity || item.quantity <= 0) return NextResponse.json({ success: false, error: `Wazan sahi nahi hai` }, { status: 400 })

      let unitPrice = product.pricePerUnit

      if (product.pricingType === 'MULTIPLIER') {
        if (!todayRate) {
          return NextResponse.json(
            { success: false, error: 'Pehle aaj ka Farm Rate enter karein!' },
            { status: 400 }
          )
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
      })
    }

    // Use transaction to create Order, Items, and Invoice together
    const newOrder = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId,
          note: note || null,
          totalAmount,
          status: 'PENDING',
          items: {
            create: orderItemsToCreate,
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

      // Add OUT stock entry for items sold
      for (const item of orderItemsToCreate) {
        await tx.stockEntry.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            note: `Order #${order.id.slice(-6)}`,
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
