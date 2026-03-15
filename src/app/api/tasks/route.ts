import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

// Mock data for demo
const MOCK_TASKS = [
  {
    id: 'task-001',
    name: 'Daily Database Backup',
    description: 'Automated backup of all production databases',
    category: 'maintenance',
    schedule: '0 2 * * *',
    scheduleType: 'daily',
    status: 'active',
    lastRun: new Date(Date.now() - 3600000 * 6),
    nextRun: new Date(Date.now() + 3600000 * 18),
    runCount: 156
  },
  {
    id: 'task-002',
    name: 'Performance Analysis',
    description: 'Weekly performance report generation and analysis',
    category: 'analysis',
    schedule: '0 9 * * 1',
    scheduleType: 'weekly',
    status: 'active',
    lastRun: new Date(Date.now() - 3600000 * 24 * 2),
    nextRun: new Date(Date.now() + 3600000 * 24 * 5),
    runCount: 52
  },
  {
    id: 'task-003',
    name: 'System Health Check',
    description: 'Monitor all services and alert on anomalies',
    category: 'monitoring',
    schedule: '*/5 * * * *',
    scheduleType: 'interval',
    status: 'active',
    lastRun: new Date(Date.now() - 300000),
    nextRun: new Date(Date.now() + 300000),
    runCount: 12480
  },
  {
    id: 'task-004',
    name: 'Log Cleanup',
    description: 'Archive and clean old log files',
    category: 'cleanup',
    schedule: '0 3 * * 0',
    scheduleType: 'weekly',
    status: 'paused',
    lastRun: new Date(Date.now() - 3600000 * 24 * 7),
    nextRun: null,
    runCount: 48
  },
  {
    id: 'task-005',
    name: 'SSL Certificate Renewal Check',
    description: 'Check and renew SSL certificates before expiry',
    category: 'maintenance',
    schedule: '0 0 1 * *',
    scheduleType: 'monthly',
    status: 'active',
    lastRun: new Date(Date.now() - 3600000 * 24 * 15),
    nextRun: new Date(Date.now() + 3600000 * 24 * 15),
    runCount: 12
  },
  {
    id: 'task-006',
    name: 'Email Digest Generation',
    description: 'Generate daily email summary and priorities',
    category: 'analysis',
    schedule: '0 8 * * *',
    scheduleType: 'daily',
    status: 'active',
    lastRun: new Date(Date.now() - 3600000 * 12),
    nextRun: new Date(Date.now() + 3600000 * 12),
    runCount: 365
  }
]

export async function GET(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const includeLogs = searchParams.get('includeLogs') === 'true'

    if (id) {
      let task = await db.task.findUnique({
        where: { id },
        include: includeLogs ? { logs: { take: 10, orderBy: { createdAt: 'desc' } } } : undefined
      })

      if (!task) {
        task = MOCK_TASKS.find(t => t.id === id) as any
      }

      if (!task) {
        return NextResponse.json({ error: 'Task not found', success: false }, { status: 404 })
      }

      return NextResponse.json({ task, success: true })
    }

    let tasks = await db.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    // If no tasks in database, seed with mock data
    if (tasks.length === 0) {
      for (const mockTask of MOCK_TASKS) {
        await db.task.create({
          data: {
            id: mockTask.id,
            name: mockTask.name,
            description: mockTask.description,
            category: mockTask.category,
            schedule: mockTask.schedule,
            scheduleType: mockTask.scheduleType,
            status: mockTask.status,
            lastRun: mockTask.lastRun,
            nextRun: mockTask.nextRun,
            runCount: mockTask.runCount,
            userId
          }
        })
      }
      tasks = await db.task.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json({ tasks, success: true })
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  try {
    const data = await request.json()

    const task = await db.task.create({
      data: {
        name: data.name,
        description: data.description || '',
        category: data.category || 'maintenance',
        schedule: data.schedule || '0 * * * *',
        scheduleType: data.scheduleType || 'interval',
        status: data.status || 'active',
        nextRun: data.nextRun ? new Date(data.nextRun) : null,
        userId
      }
    })
    await logAudit(userId, 'task_created', { taskId: task.id, name: task.name })

    return NextResponse.json({ task, success: true })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json(
      { error: 'Failed to create task', success: false },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    const task = await db.task.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ task, success: true })
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json(
      { error: 'Failed to update task', success: false },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required', success: false }, { status: 400 })
    }

    await db.task.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task', success: false },
      { status: 500 }
    )
  }
}
