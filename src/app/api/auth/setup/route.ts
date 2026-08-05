import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import type { OwnerSetupInput } from '@/shared/types'

const SALT_ROUNDS = 10

export async function POST(request: Request) {
  try {
    const data = await request.json() as OwnerSetupInput
    const existing = await db.owner.findFirst()
    if (existing) {
      return NextResponse.json({ success: false, error: 'Owner pehle se mojood hai' })
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS)
    const owner = await db.owner.create({
      data: {
        name: data.name,
        shopName: data.shopName,
        phone: data.phone,
        password: hashedPassword
      }
    })

    return NextResponse.json({
      success: true,
      data: { id: owner.id, name: owner.name, shopName: owner.shopName }
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
