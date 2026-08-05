import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})

// Next.js hot-reloads in dev, which creates new PrismaClient instances each time.
// This singleton pattern stores the client on globalThis to reuse across reloads.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
