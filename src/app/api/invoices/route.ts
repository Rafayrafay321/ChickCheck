import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')

    const invoices = await db.invoice.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(customerId ? { customerId } : {})
      },
      include: {
        customer: true,
        order: { include: { items: { include: { product: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: invoices })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
