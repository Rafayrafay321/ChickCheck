import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const date = searchParams.get('date')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (customerId) where.customerId = customerId

    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setDate(end.getDate() + 1)
      end.setHours(0, 0, 0, 0)
      where.createdAt = { gte: start, lt: end }
    }

    const invoices = await db.invoice.findMany({
      where,
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
