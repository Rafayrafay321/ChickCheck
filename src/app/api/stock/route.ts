import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — stock summary (current stock per product = SUM(IN) - SUM(OUT))
export async function GET() {
  try {
    const products = await db.product.findMany({ where: { isActive: true } })
    const grouped = await db.stockEntry.groupBy({
      by: ['productId', 'type'],
      _sum: { quantity: true }
    })

    const summary = products.map((product) => {
      const inQty = grouped.find(g => g.productId === product.id && g.type === 'IN')?._sum.quantity ?? 0
      const outQty = grouped.find(g => g.productId === product.id && g.type === 'OUT')?._sum.quantity ?? 0
      return { ...product, currentStock: inQty - outQty }
    })

    return NextResponse.json({ success: true, data: summary })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

// POST — add stock entry
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const entry = await db.stockEntry.create({ data })
    return NextResponse.json({ success: true, data: entry })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
