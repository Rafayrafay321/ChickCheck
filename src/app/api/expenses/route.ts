import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { ExpenseInput } from '@/shared/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const category = searchParams.get('category')
    const all = searchParams.get('all')

    const where: Record<string, unknown> = {}
    if (category) where.category = category

    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setDate(end.getDate() + 1)
      end.setHours(0, 0, 0, 0)
      where.date = { gte: start, lt: end }
    } else if (all === 'true') {
      // No date filter — return all history
    } else {
      // Default: Active session
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const latestEod = await db.endOfDay.findFirst({
        orderBy: { createdAt: 'desc' },
      })
      const sessionStart = latestEod ? latestEod.createdAt : today
      where.date = { gte: sessionStart }
    }

    const expenses = await db.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: expenses })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExpenseInput

    if (!body.category) {
      return NextResponse.json({ success: false, error: 'Expense category zaroori hai' }, { status: 400 })
    }
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount sahi daalo' }, { status: 400 })
    }

    const expense = await db.expense.create({
      data: {
        category: body.category,
        amount: body.amount,
        note: body.note?.trim() || null,
      },
    })

    return NextResponse.json({ success: true, data: expense }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
