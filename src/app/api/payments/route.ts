import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { RecordPaymentInput } from '@/shared/types'

// POST — record payment with invoice status + udhaar pipeline
export async function POST(request: Request) {
  try {
    const data = await request.json() as RecordPaymentInput

    await db.$transaction(async (tx) => {
      // 1. Create the payment record
      await tx.payment.create({
        data: {
          invoiceId: data.invoiceId,
          customerId: data.customerId,
          amount: data.amount,
          method: data.method ?? 'CASH',
          note: data.note
        }
      })

      // 2. Update invoice paid_amount and derive new status
      const invoice = await tx.invoice.findUnique({ where: { id: data.invoiceId } })
      if (!invoice) throw new Error('Invoice nahi mila')

      const newPaid = invoice.paidAmount + data.amount
      let newStatus = 'UNPAID'
      if (newPaid >= invoice.totalAmount) {
        newStatus = 'PAID'
      } else if (newPaid > 0) {
        newStatus = 'PARTIAL'
      }

      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: { paidAmount: newPaid, status: newStatus }
      })

      // 3. Recalculate customer total udhaar from all unpaid invoices
      const unpaid = await tx.invoice.aggregate({
        where: { customerId: data.customerId, status: { not: 'PAID' } },
        _sum: { totalAmount: true, paidAmount: true }
      })
      const totalUdhaar = (unpaid._sum.totalAmount ?? 0) - (unpaid._sum.paidAmount ?? 0)

      await tx.customer.update({
        where: { id: data.customerId },
        data: { totalUdhaar }
      })
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
