import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { SupplierPaymentInput } from '@/shared/types'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SupplierPaymentInput

    if (!body.supplierId) {
      return NextResponse.json({ success: false, error: 'Supplier select karein' }, { status: 400 })
    }
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ success: false, error: 'Raqam sahi daalein (> 0)' }, { status: 400 })
    }

    const supplier = await db.supplier.findUnique({
      where: { id: body.supplierId },
    })

    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier nahi mila' }, { status: 404 })
    }

    const payment = await db.$transaction(async (tx) => {
      // 1. Create SupplierPayment
      const pm = await tx.supplierPayment.create({
        data: {
          supplierId: body.supplierId,
          amount: body.amount,
          method: body.method || 'CASH',
          note: body.note?.trim() || null,
        },
      })

      // 2. Decrement supplier.totalPayable
      await tx.supplier.update({
        where: { id: body.supplierId },
        data: {
          totalPayable: { decrement: body.amount },
        },
      })

      return pm
    })

    return NextResponse.json({ success: true, data: payment }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
