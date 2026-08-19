import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { SupplierInput } from '@/shared/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where: Record<string, unknown> = {}
    if (activeOnly) {
      where.isActive = true
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const suppliers = await db.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { purchases: true, payments: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: suppliers })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SupplierInput

    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Supplier ka naam zaroori hai' }, { status: 400 })
    }

    const existing = await db.supplier.findUnique({
      where: { name: body.name.trim() },
    })

    if (existing) {
      return NextResponse.json({ success: false, error: 'Is naam ka supplier pehle se maujood hai' }, { status: 400 })
    }

    const supplier = await db.$transaction(async (tx) => {
      const unlinkedPurchases = await tx.supplierPurchase.findMany({
        where: { supplierName: body.name.trim(), supplierId: null },
      })
      const initialPurchasesCost = unlinkedPurchases.reduce((sum, p) => sum + (p.totalAmount - (p.cashPaid || 0)), 0)

      const created = await tx.supplier.create({
        data: {
          name: body.name.trim(),
          phone: body.phone?.trim() || null,
          address: body.address?.trim() || null,
          ratePremium: body.ratePremium !== undefined ? Number(body.ratePremium) : 4,
          totalPayable: initialPurchasesCost,
          isActive: true,
        },
      })

      if (unlinkedPurchases.length > 0) {
        await tx.supplierPurchase.updateMany({
          where: { supplierName: body.name.trim(), supplierId: null },
          data: { supplierId: created.id },
        })
      }

      return created
    })

    return NextResponse.json({ success: true, data: supplier }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
