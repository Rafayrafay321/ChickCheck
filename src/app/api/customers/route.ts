import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { CustomerInput } from '@/shared/types'

export async function GET() {
  try {
    const customers = await db.customer.findMany({
      include: {
        invoices: {
          where: { status: { notIn: ['PAID', 'CANCELLED'] } },
          select: { totalAmount: true, paidAmount: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    const data = customers.map((c) => {
      const dynamicUdhaar = c.invoices.reduce(
        (sum, inv) => sum + Math.max(0, inv.totalAmount - inv.paidAmount),
        0
      )
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        phone: c.phone,
        address: c.address,
        totalUdhaar: dynamicUdhaar,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }
    })

    return NextResponse.json({ success: true, data })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CustomerInput

    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Naam zaroor chahiye' }, { status: 400 })
    }
    if (!['RESTAURANT', 'RETAIL'].includes(body.type)) {
      return NextResponse.json({ success: false, error: 'Type galat hai' }, { status: 400 })
    }

    const customer = await db.customer.create({
      data: {
        name: body.name.trim(),
        type: body.type,
        phone: body.phone?.trim() || null,
        address: body.address?.trim() || null,
      },
    })
    return NextResponse.json({ success: true, data: customer }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
