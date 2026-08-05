import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const payments = await db.payment.findMany({
      where: { customerId },
      include: { invoice: true },
      orderBy: { paidAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: payments })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
