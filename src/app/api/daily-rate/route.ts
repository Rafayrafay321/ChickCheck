import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { DailyRateInput } from '@/shared/types'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dailyRate = await db.dailyRate.findFirst({
      where: { date: today },
    })

    return NextResponse.json({ success: true, data: dailyRate })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DailyRateInput

    if (!body.farmRate || body.farmRate <= 0) {
      return NextResponse.json(
        { success: false, error: 'Farm Rate sahi daalo (e.g. 300)' },
        { status: 400 }
      )
    }

    const premium = body.supplierPremium ?? 4
    const supplyRate = body.farmRate + premium

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dailyRate = await db.dailyRate.upsert({
      where: { date: today },
      update: {
        farmRate: body.farmRate,
        supplierPremium: premium,
        supplyRate,
      },
      create: {
        date: today,
        farmRate: body.farmRate,
        supplierPremium: premium,
        supplyRate,
      },
    })

    return NextResponse.json({ success: true, data: dailyRate }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
