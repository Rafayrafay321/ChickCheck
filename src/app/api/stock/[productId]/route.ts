import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request, context: { params: Promise<{ productId: string }> }) {
  try {
    const params = await context.params
    const { productId } = params

    const history = await db.stockEntry.findMany({
      where: { productId },
      include: {
        product: {
          select: { name: true, nameUrdu: true, unit: true }
        }
      },
      orderBy: { entryDate: 'desc' }
    })

    return NextResponse.json({ success: true, data: history })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
