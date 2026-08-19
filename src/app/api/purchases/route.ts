import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { SupplierPurchaseInput } from '@/shared/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const supplierName = searchParams.get('supplierName')
    const supplierId = searchParams.get('supplierId')
    const all = searchParams.get('all')

    const where: Record<string, unknown> = {}
    if (supplierId) {
      where.supplierId = supplierId
    } else if (supplierName) {
      where.supplierName = { contains: supplierName }
    }

    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setDate(end.getDate() + 1)
      end.setHours(0, 0, 0, 0)
      where.purchaseDate = { gte: start, lt: end }
    } else if (all === 'true') {
      // No date filter
    } else {
      // Default: Active session or today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const latestEod = await db.endOfDay.findFirst({
        orderBy: { createdAt: 'desc' },
      })
      const sessionStart = latestEod ? latestEod.createdAt : today
      where.purchaseDate = { gte: sessionStart }
    }

    const purchases = await db.supplierPurchase.findMany({
      where,
      orderBy: { purchaseDate: 'desc' },
      include: {
        supplier: true,
      },
    })

    return NextResponse.json({ success: true, data: purchases })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json()
    const rawItems: SupplierPurchaseInput[] = Array.isArray(rawBody)
      ? rawBody
      : Array.isArray(rawBody.items)
      ? rawBody.items
      : [rawBody]

    if (!rawItems.length) {
      return NextResponse.json({ success: false, error: 'Koi purchase entry nahi mili' }, { status: 400 })
    }

    // Get today's supply rate
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayRate = await db.dailyRate.findFirst({
      where: { date: today },
    })

    if (!todayRate) {
      return NextResponse.json(
        { success: false, error: 'Pehle aaj ka Farm Rate enter karein!' },
        { status: 400 }
      )
    }

    // Validate all items before starting transaction
    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i]
      const trimmedName = item.supplierName?.trim()
      if (!trimmedName && !item.supplierId) {
        return NextResponse.json(
          { success: false, error: `Entry #${i + 1}: Supplier ka naam zaroori hai` },
          { status: 400 }
        )
      }
      if (!item.grossWeight || Number(item.grossWeight) <= 0) {
        return NextResponse.json(
          { success: false, error: `Entry #${i + 1}: Gross weight enter karein` },
          { status: 400 }
        )
      }
    }

    const result = await db.$transaction(async (tx) => {
      let totalBatchNetWeight = 0
      const createdPurchases = []

      for (const item of rawItems) {
        const trimmedName = item.supplierName?.trim() || ''
        let supplierId = item.supplierId
        let finalSupplierName = trimmedName

        if (supplierId) {
          const found = await tx.supplier.findUnique({ where: { id: supplierId } })
          if (found) {
            finalSupplierName = found.name
          }
        } else if (finalSupplierName) {
          let found = await tx.supplier.findUnique({ where: { name: finalSupplierName } })
          if (!found) {
            found = await tx.supplier.create({
              data: {
                name: finalSupplierName,
                ratePremium: 4,
                totalPayable: 0,
              },
            })
          }
          supplierId = found.id
        }

        const dud = Number(item.dudWeight) || 0
        const gross = Number(item.grossWeight)
        const netWeight = Math.max(0, gross - dud)
        const ratePerKg = item.ratePerKg && Number(item.ratePerKg) > 0 ? Number(item.ratePerKg) : todayRate.supplyRate
        const totalAmount = netWeight * ratePerKg
        const cashPaid = Number(item.cashPaid) || 0

        totalBatchNetWeight += netWeight

        // 1. Create Purchase record
        const purchase = await tx.supplierPurchase.create({
          data: {
            supplierId,
            supplierName: finalSupplierName,
            grossWeight: gross,
            dudWeight: dud,
            netWeight,
            ratePerKg,
            totalAmount,
            cashPaid,
          },
        })
        createdPurchases.push(purchase)

        // 2. Record spot payment if paid
        if (supplierId && cashPaid > 0) {
          await tx.supplierPayment.create({
            data: {
              supplierId,
              amount: cashPaid,
              method: 'CASH',
              note: `Purchase spot payment (${netWeight} kg)`,
            },
          })
        }

        // 3. Update supplier totalPayable balance (+ totalAmount - cashPaid)
        if (supplierId) {
          const netPayableChange = totalAmount - cashPaid
          await tx.supplier.update({
            where: { id: supplierId },
            data: {
              totalPayable: { increment: netPayableChange },
            },
          })
        }

        // 4. Auto-update Live Hen StockEntry IN for legacy ledger compatibility
        const liveHenProduct = await tx.product.findFirst({
          where: { name: { contains: 'Live' } },
        })

        if (liveHenProduct) {
          await tx.stockEntry.create({
            data: {
              productId: liveHenProduct.id,
              type: 'IN',
              quantity: netWeight,
              note: `Supplier Purchase: ${finalSupplierName}`,
            },
          })
        }
      }

      // 5. Upsert today's LiveWeightPool and increment purchasesWeight
      if (totalBatchNetWeight > 0) {
        await tx.liveWeightPool.upsert({
          where: { date: today },
          update: {
            purchasesWeight: { increment: totalBatchNetWeight },
          },
          create: {
            date: today,
            openingWeight: 0,
            purchasesWeight: totalBatchNetWeight,
            soldWeight: 0,
          },
        })
      }

      return rawItems.length === 1 ? createdPurchases[0] : createdPurchases
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
