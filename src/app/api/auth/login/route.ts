import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { password } = await request.json() as { password: string }
    const owner = await db.owner.findFirst()
    if (!owner) {
      return NextResponse.json({ success: false, error: 'Koi account nahi mila — pehle setup karo' })
    }

    // Handle plain text passwords for development seeding, otherwise check hash
    const isMatch = owner.password.startsWith('$2') 
      ? await bcrypt.compare(password, owner.password)
      : password === owner.password

    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Galat Password' })
    }

    return NextResponse.json({
      success: true,
      data: { id: owner.id, name: owner.name, shopName: owner.shopName }
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
