import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { CustomerMultiplierInput } from '@/shared/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ success: false, error: 'customerId zaroori hai' }, { status: 400 })
    }

    const multipliers = await db.customerMultiplier.findMany({
      where: { customerId },
      include: { product: true },
    })

    return NextResponse.json({ success: true, data: multipliers })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CustomerMultiplierInput

    if (!body.customerId || !body.productId) {
      return NextResponse.json({ success: false, error: 'Customer aur Product ID dono zaroori hain' }, { status: 400 })
    }
    if (!body.multiplier || body.multiplier <= 0) {
      return NextResponse.json({ success: false, error: 'Multiplier value sahi daalein (e.g. 1.45)' }, { status: 400 })
    }

    const multiplierRecord = await db.customerMultiplier.upsert({
      where: {
        customerId_productId: {
          customerId: body.customerId,
          productId: body.productId,
        },
      },
      update: {
        multiplier: body.multiplier,
      },
      create: {
        customerId: body.customerId,
        productId: body.productId,
        multiplier: body.multiplier,
      },
    })

    return NextResponse.json({ success: true, data: multiplierRecord }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
