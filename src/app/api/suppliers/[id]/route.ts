import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { SupplierInput } from '@/shared/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supplier = await db.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { purchases: true, payments: true },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier nahi mila' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: supplier })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as Partial<SupplierInput & { isActive?: boolean }>
  const supplier = await db.supplier.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.phone !== undefined && { phone: body.phone?.trim() || null }),
        ...(body.address !== undefined && { address: body.address?.trim() || null }),
        ...(body.ratePremium !== undefined && { ratePremium: Number(body.ratePremium) }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    })

    return NextResponse.json({ success: true, data: supplier })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if supplier has purchases or payments
    const supplier = await db.supplier.findUnique({
      where: { id },
      include: {
        _count: { select: { purchases: true, payments: true } },
      },
    })

    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier nahi mila' }, { status: 404 })
    }

    // Soft delete
    await db.supplier.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'Supplier deactivate kar diya gaya' })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
