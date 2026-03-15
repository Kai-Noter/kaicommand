import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/api-auth'

/** List recent audit logs for the current user. */
export async function GET(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 20, 100)
  try {
    const logs = await db.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json({ logs, success: true })
  } catch (error) {
    console.error('Audit GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit log', success: false },
      { status: 500 }
    )
  }
}

/** Create an audit entry (e.g. from client after an action, or from other API routes). */
export async function POST(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { action, details } = body
    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        { error: 'action (string) is required', success: false },
        { status: 400 }
      )
    }
    const log = await db.auditLog.create({
      data: {
        userId,
        action,
        details: details ? JSON.stringify(details) : null,
      },
    })
    return NextResponse.json({ log, success: true })
  } catch (error) {
    console.error('Audit POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create audit entry', success: false },
      { status: 500 }
    )
  }
}
