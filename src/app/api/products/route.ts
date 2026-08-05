import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const products = await db.product.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
    return NextResponse.json({ success: true, data: products })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const product = await db.product.create({ data })
    return NextResponse.json({ success: true, data: product })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
