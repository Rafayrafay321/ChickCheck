import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.order.update({ where: { id }, data: { status: 'CANCELLED' } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
