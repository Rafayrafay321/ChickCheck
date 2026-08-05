import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const customers = await db.customer.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ success: true, data: customers })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const customer = await db.customer.create({ data })
    return NextResponse.json({ success: true, data: customer })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
