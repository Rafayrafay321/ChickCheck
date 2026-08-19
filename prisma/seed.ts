import 'dotenv/config'
import { db } from '../src/lib/db'

async function main() {

  console.log('Seeding default products based on Chachu\'s Excel model...')

  const defaultProducts = [
    {
      name: 'Zinda Murgi',
      nameUrdu: 'زندہ مرغی',
      unit: 'kg',
      pricingType: 'MULTIPLIER',
      defaultMultiplier: 1.0,
      pricePerUnit: 0,
    },
    {
      name: 'Ghost',
      nameUrdu: 'گوشت',
      unit: 'kg',
      pricingType: 'MULTIPLIER',
      defaultMultiplier: 1.5,
      pricePerUnit: 0,
    },
    {
      name: 'Boneless',
      nameUrdu: 'بون لیس',
      unit: 'kg',
      pricingType: 'MULTIPLIER',
      defaultMultiplier: 2.0,
      pricePerUnit: 0,
    },
    {
      name: 'Tikka',
      nameUrdu: 'ٹکہ',
      unit: 'kg',
      pricingType: 'MULTIPLIER',
      defaultMultiplier: 1.6,
      pricePerUnit: 0,
    },
    {
      name: 'Kalagi',
      nameUrdu: 'کلیجی',
      unit: 'kg',
      pricingType: 'FIXED',
      defaultMultiplier: null,
      pricePerUnit: 300,
    },
    {
      name: 'Poota',
      nameUrdu: 'پوٹا',
      unit: 'kg',
      pricingType: 'FIXED',
      defaultMultiplier: null,
      pricePerUnit: 250,
    },
    {
      name: 'Gardan',
      nameUrdu: 'گردن',
      unit: 'kg',
      pricingType: 'FIXED',
      defaultMultiplier: null,
      pricePerUnit: 200,
    },
    {
      name: 'Wings',
      nameUrdu: 'پر',
      unit: 'kg',
      pricingType: 'FIXED',
      defaultMultiplier: null,
      pricePerUnit: 250,
    },
  ]

  for (const prod of defaultProducts) {
    const existing = await db.product.findFirst({
      where: { name: prod.name },
    })

    if (!existing) {
      await db.product.create({
        data: prod,
      })
      console.log(`Created product: ${prod.name}`)
    }
  }

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

