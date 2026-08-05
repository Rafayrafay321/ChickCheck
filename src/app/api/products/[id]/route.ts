import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const product = await db.product.update({ where: { id }, data })
    return NextResponse.json({ success: true, data: product })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
