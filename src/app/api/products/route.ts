import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const products = await db.product.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ success: true, data: products })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Naam zaroor chahiye' }, { status: 400 })
    }
    if (!['kg', 'piece'].includes(body.unit)) {
      return NextResponse.json({ success: false, error: 'Unit galat hai (kg ya piece)' }, { status: 400 })
    }

    const pricingType = body.pricingType === 'FIXED' ? 'FIXED' : 'MULTIPLIER'
    const defaultMultiplier = pricingType === 'MULTIPLIER' ? (Number(body.defaultMultiplier) || 1.0) : null
    const pricePerUnit = pricingType === 'FIXED' ? (Number(body.pricePerUnit) || 0) : 0

    if (pricingType === 'FIXED' && pricePerUnit <= 0) {
      return NextResponse.json({ success: false, error: 'Fixed Rate (Rs) sahi daalo' }, { status: 400 })
    }
    if (pricingType === 'MULTIPLIER' && (!defaultMultiplier || defaultMultiplier <= 0)) {
      return NextResponse.json({ success: false, error: 'Mandi Multiplier sahi daalo (e.g. 2.0 ya 1.5)' }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        name: body.name.trim(),
        nameUrdu: body.nameUrdu?.trim() || null,
        unit: body.unit,
        pricingType,
        defaultMultiplier,
        pricePerUnit,
        isByproduct: Boolean(body.isByproduct),
      },
    })
    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
