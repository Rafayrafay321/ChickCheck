import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const aggregations = await db.stockEntry.groupBy({
      by: ['productId', 'type'],
      _sum: {
        quantity: true
      }
    })

    const products = await db.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    const stockMap: Record<string, number> = {}
    
    aggregations.forEach(agg => {
      if (!stockMap[agg.productId]) stockMap[agg.productId] = 0
      
      const qty = agg._sum.quantity || 0
      if (agg.type === 'IN') {
        stockMap[agg.productId] += qty
      } else if (agg.type === 'OUT') {
        stockMap[agg.productId] -= qty
      }
    })

    const data = products.map(p => ({
      id: p.id,
      name: p.name,
      nameUrdu: p.nameUrdu,
      unit: p.unit,
      currentStock: stockMap[p.id] || 0
    }))

    return NextResponse.json({ success: true, data })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, type, quantity, note } = body

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Maal chunna zaroori hai (Select Product)' })
    }
    if (type !== 'IN' && type !== 'OUT') {
      return NextResponse.json({ success: false, error: 'Type IN ya OUT honi chahiye' })
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return NextResponse.json({ success: false, error: 'Wazan zero se zyada hona chahiye (Quantity > 0)' })
    }

    const entry = await db.stockEntry.create({
      data: {
        productId,
        type,
        quantity: Number(quantity),
        note: note || null,
      }
    })

    return NextResponse.json({ success: true, data: entry })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
