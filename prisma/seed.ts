import 'dotenv/config'
import { db as prisma } from '../src/lib/db'

async function main() {
  await prisma.owner.upsert({
    where: { id: 'test' },
    update: {},
    create: {
      id: 'test',
      name: 'Test Owner',
      shopName: 'Test Shop',
      password: 'test',
    },
  })
}
main().then(async () => { await prisma.$disconnect() })
