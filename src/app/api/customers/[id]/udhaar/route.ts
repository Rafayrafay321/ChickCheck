import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          where: { status: { notIn: ['PAID', 'CANCELLED'] } },
          select: { totalAmount: true, paidAmount: true },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer nahi mila' }, { status: 404 })
    }

    const dynamicUdhaar = customer.invoices.reduce(
      (sum, inv) => sum + Math.max(0, inv.totalAmount - inv.paidAmount),
      0
    )

    return NextResponse.json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        totalUdhaar: dynamicUdhaar,
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
