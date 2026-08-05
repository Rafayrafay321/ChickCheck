import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const entries = await db.stockEntry.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: entries })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
