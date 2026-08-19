import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supplier = await db.supplier.findUnique({
      where: { id },
    })

    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier nahi mila' }, { status: 404 })
    }

    // Fetch all purchases and payments
    const [purchases, payments] = await Promise.all([
      db.supplierPurchase.findMany({
        where: {
          OR: [{ supplierId: id }, { supplierName: supplier.name }],
        },
        orderBy: { purchaseDate: 'asc' },
      }),
      db.supplierPayment.findMany({
        where: { supplierId: id },
        orderBy: { paidAt: 'asc' },
      }),
    ])

    // Combine into uniform ledger entries
    interface LedgerItem {
      id: string
      date: string
      type: 'PURCHASE' | 'PAYMENT'
      description: string
      debit: number // We paid (reduces our payable)
      credit: number // We bought (increases our payable)
      runningBalance: number
      details: Record<string, unknown>
    }

    const rawEntries: Array<{
      id: string
      date: Date
      type: 'PURCHASE' | 'PAYMENT'
      description: string
      debit: number
      credit: number
      details: Record<string, unknown>
    }> = []

    for (const p of purchases) {
      rawEntries.push({
        id: p.id,
        date: p.purchaseDate,
        type: 'PURCHASE',
        description: `Murgi Purchase (${p.netWeight} kg @ Rs ${p.ratePerKg})`,
        debit: 0,
        credit: p.totalAmount,
        details: {
          grossWeight: p.grossWeight,
          dudWeight: p.dudWeight,
          netWeight: p.netWeight,
          ratePerKg: p.ratePerKg,
          cashPaid: p.cashPaid,
        },
      })
    }

    for (const pm of payments) {
      rawEntries.push({
        id: pm.id,
        date: pm.paidAt,
        type: 'PAYMENT',
        description: `Adaiygi (${pm.method})${pm.note ? ` - ${pm.note}` : ''}`,
        debit: pm.amount,
        credit: 0,
        details: {
          method: pm.method,
          note: pm.note,
        },
      })
    }

    // Sort chronologically ascending
    rawEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let currentBalance = 0
    const ledger: LedgerItem[] = rawEntries.map((entry) => {
      currentBalance += entry.credit - entry.debit
      return {
        id: entry.id,
        date: entry.date.toISOString(),
        type: entry.type,
        description: entry.description,
        debit: entry.debit,
        credit: entry.credit,
        runningBalance: currentBalance,
        details: entry.details,
      }
    })

    // Auto-reconcile totalPayable if out of sync with ledger balance
    if (Math.abs(supplier.totalPayable - currentBalance) > 0.01) {
      await db.supplier.update({
        where: { id },
        data: { totalPayable: currentBalance },
      })
      supplier.totalPayable = currentBalance
    }

    // Auto-link any unlinked purchases to this supplier
    await db.supplierPurchase.updateMany({
      where: { supplierName: supplier.name, supplierId: null },
      data: { supplierId: id },
    })

    // Return reversed (newest first for UI presentation)
    return NextResponse.json({
      success: true,
      data: {
        supplier,
        calculatedTotalPayable: currentBalance,
        totalPurchasesAmount: rawEntries.reduce((s, e) => s + e.credit, 0),
        totalPaymentsAmount: rawEntries.reduce((s, e) => s + e.debit, 0),
        entries: ledger.reverse(),
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
