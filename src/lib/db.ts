import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

const DEMO_USER_ID = 'demo-user-001'

/** Ensure the demo user exists (for unauthenticated demo mode). */
export async function ensureDemoUser(): Promise<void> {
  await db.user.upsert({
    where: { id: DEMO_USER_ID },
    create: {
      id: DEMO_USER_ID,
      email: 'demo@kaicommand.app',
      name: 'Demo User',
    },
    update: {},
  })
}