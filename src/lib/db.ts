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
const DEMO_USER_EMAIL = 'demo@kaicommand.app'

/** Ensure the demo user exists (for unauthenticated demo mode). */
export async function ensureDemoUser(): Promise<string> {
  const byId = await db.user.findUnique({ where: { id: DEMO_USER_ID } })
  if (byId) return byId.id

  // If the email already exists under another ID, reuse that user instead of failing.
  const byEmail = await db.user.findUnique({ where: { email: DEMO_USER_EMAIL } })
  if (byEmail) return byEmail.id

  const created = await db.user.create({
    data: {
      id: DEMO_USER_ID,
      email: DEMO_USER_EMAIL,
      name: 'Demo User',
    },
  })
  return created.id
}