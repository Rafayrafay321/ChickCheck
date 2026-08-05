import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await db.customer.findUnique({
      where: { id },
      select: { id: true, name: true, totalUdhaar: true }
    })
    return NextResponse.json({ success: true, data: customer })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
