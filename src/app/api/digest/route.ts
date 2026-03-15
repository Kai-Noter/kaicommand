import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/api-auth'

const HOURS_AGO = 24
const EXPIRY_DAYS = 30

export async function GET(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  try {
    const since = new Date(Date.now() - HOURS_AGO * 60 * 60 * 1000)
    const expiryThreshold = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000)

    const [
      auditLogs,
      unreadEmails,
      appsWarningOrCritical,
      certificationsExpiring,
      tasksActive,
    ] = await Promise.all([
      db.auditLog.findMany({
        where: { userId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      db.email.count({ where: { userId, isRead: false } }),
      db.app.findMany({
        where: { userId, status: { in: ['warning', 'critical'] } },
        select: { id: true, name: true, status: true },
      }),
      db.certification.findMany({
        where: {
          userId,
          expiryDate: { lte: expiryThreshold, not: null },
          status: { in: ['active', 'expiring'] },
        },
        orderBy: { expiryDate: 'asc' },
        take: 5,
      }),
      db.task.findMany({
        where: { userId, status: 'active' },
        select: { id: true, name: true, nextRun: true },
        take: 20,
      }),
    ])

    const suggestions: { label: string; tabId: string; count?: number; urgency?: 'high' | 'medium' }[] = []
    if (unreadEmails > 0) {
      suggestions.push({
        label: `${unreadEmails} unread email${unreadEmails > 1 ? 's' : ''}`,
        tabId: 'emails',
        count: unreadEmails,
        urgency: unreadEmails >= 5 ? 'high' : 'medium',
      })
    }
    appsWarningOrCritical.forEach((app) => {
      suggestions.push({
        label: `${app.name} is ${app.status}`,
        tabId: 'apps',
        urgency: app.status === 'critical' ? 'high' : 'medium',
      })
    })
    certificationsExpiring.forEach((c) => {
      const days = c.expiryDate
        ? Math.ceil((c.expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        : 0
      if (days <= 14) {
        suggestions.push({
          label: `${c.name} expires in ${days} days`,
          tabId: 'certifications',
          urgency: days <= 7 ? 'high' : 'medium',
        })
      }
    })

    const recentActivity = auditLogs.map((log) => ({
      action: log.action.replace(/_/g, ' '),
      details: log.details,
      time: log.createdAt,
    }))

    const whileYouWereAway =
      recentActivity.length > 0
        ? `In the last ${HOURS_AGO} hours: ${recentActivity.length} action(s) — ${recentActivity
            .slice(0, 3)
            .map((a) => a.action)
            .join(', ')}.`
        : `No recorded activity in the last ${HOURS_AGO} hours. Check your emails and apps for updates.`

    return NextResponse.json({
      whileYouWereAway,
      suggestions: suggestions.slice(0, 6),
      recentActivity,
      success: true,
    })
  } catch (error) {
    console.error('Digest GET error:', error)
    return NextResponse.json(
      { error: 'Failed to build digest', success: false },
      { status: 500 }
    )
  }
}
