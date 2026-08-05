import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        order: { include: { items: { include: { product: true } } } },
        payments: true
      }
    })
    return NextResponse.json({ success: true, data: invoice })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
