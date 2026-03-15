import { db } from '@/lib/db'

export async function logAudit(userId: string, action: string, details?: Record<string, unknown>) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        details: details ? JSON.stringify(details) : null,
      },
    })
  } catch (e) {
    console.error('Audit log failed:', e)
  }
}
