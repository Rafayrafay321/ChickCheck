import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { ProductInput } from '@/shared/types'

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
    const body = (await request.json()) as ProductInput

    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Naam zaroor chahiye' }, { status: 400 })
    }
    if (!['kg', 'piece'].includes(body.unit)) {
      return NextResponse.json({ success: false, error: 'Unit galat hai (kg ya piece)' }, { status: 400 })
    }
    if (!body.pricePerUnit || body.pricePerUnit <= 0) {
      return NextResponse.json({ success: false, error: 'Qeemat sahi daalo' }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        name: body.name.trim(),
        nameUrdu: body.nameUrdu?.trim() || null,
        unit: body.unit,
        pricePerUnit: body.pricePerUnit,
      },
    })
    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
