import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { ExpenseInput } from '@/shared/types'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const expenses = await db.expense.findMany({
      where: {
        date: { gte: today },
      },
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
