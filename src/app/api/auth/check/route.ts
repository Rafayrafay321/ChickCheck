import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const owner = await db.owner.findFirst()
    return NextResponse.json({ success: true, data: Boolean(owner) })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
