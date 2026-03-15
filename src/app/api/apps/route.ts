import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/api-auth'

// Mock data for demo
const MOCK_APPS = [
  {
    id: 'app-001',
    name: 'E-Commerce Platform',
    description: 'Main online shopping platform with inventory management',
    category: 'E-Commerce',
    status: 'healthy',
    version: '2.4.1',
    lastChecked: new Date(),
    uptime: 99.95,
    responseTime: 145,
    aiSuggestion: 'Consider implementing a CDN for static assets to improve load times by 30%.'
  },
  {
    id: 'app-002',
    name: 'Analytics Dashboard',
    description: 'Real-time analytics and reporting system',
    category: 'Analytics',
    status: 'healthy',
    version: '1.8.3',
    lastChecked: new Date(),
    uptime: 99.87,
    responseTime: 89,
    aiSuggestion: 'Add caching layer for frequently accessed reports to reduce database load.'
  },
  {
    id: 'app-003',
    name: 'Customer Portal',
    description: 'Customer-facing portal for account management',
    category: 'CRM',
    status: 'warning',
    version: '3.1.0',
    lastChecked: new Date(),
    uptime: 98.2,
    responseTime: 320,
    aiSuggestion: 'Memory usage is trending high. Consider optimizing session management.'
  },
  {
    id: 'app-004',
    name: 'API Gateway',
    description: 'Central API management and routing service',
    category: 'Infrastructure',
    status: 'healthy',
    version: '4.0.2',
    lastChecked: new Date(),
    uptime: 99.99,
    responseTime: 23,
    aiSuggestion: 'Response times are excellent. Consider documenting rate limiting best practices.'
  },
  {
    id: 'app-005',
    name: 'Payment Service',
    description: 'Payment processing and transaction management',
    category: 'Finance',
    status: 'critical',
    version: '2.1.4',
    lastChecked: new Date(),
    uptime: 95.4,
    responseTime: 890,
    aiSuggestion: 'URGENT: Payment processing latency detected. Review database indexes and connection pooling.'
  },
  {
    id: 'app-006',
    name: 'Inventory System',
    description: 'Stock management and warehouse coordination',
    category: 'Operations',
    status: 'healthy',
    version: '1.5.2',
    lastChecked: new Date(),
    uptime: 99.6,
    responseTime: 156,
    aiSuggestion: 'Implement real-time stock alerts to prevent overselling.'
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

    if (id) {
      // Get single app
      let app = await db.app.findUnique({
        where: { id }
      })

      if (!app) {
        // Return mock data if not in database
        app = MOCK_APPS.find(a => a.id === id) as any
      }

      if (!app) {
        return NextResponse.json({ error: 'App not found', success: false }, { status: 404 })
      }

      return NextResponse.json({ app, success: true })
    }

    // Get all apps
    let apps = await db.app.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    // If no apps in database, seed with mock data
    if (apps.length === 0) {
      for (const mockApp of MOCK_APPS) {
        await db.app.create({
          data: {
            id: mockApp.id,
            name: mockApp.name,
            description: mockApp.description,
            category: mockApp.category,
            status: mockApp.status,
            version: mockApp.version,
            uptime: mockApp.uptime,
            responseTime: mockApp.responseTime,
            userId
          }
        })
      }
      apps = await db.app.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
    }

    // Add AI suggestions to apps
    const appsWithSuggestions = apps.map((app, index) => ({
      ...app,
      aiSuggestion: MOCK_APPS[index % MOCK_APPS.length]?.aiSuggestion || 'No specific suggestions at this time.'
    }))

    return NextResponse.json({ apps: appsWithSuggestions, success: true })
  } catch (error) {
    console.error('Failed to fetch apps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch apps', success: false },
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

    const app = await db.app.create({
      data: {
        name: data.name,
        description: data.description || '',
        category: data.category || 'Other',
        status: data.status || 'healthy',
        version: data.version || '1.0.0',
        uptime: data.uptime || 99.9,
        responseTime: data.responseTime || 100,
        userId
      }
    })

    return NextResponse.json({ app, success: true })
  } catch (error) {
    console.error('Failed to create app:', error)
    return NextResponse.json(
      { error: 'Failed to create app', success: false },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    const app = await db.app.update({
      where: { id },
      data: {
        ...updateData,
        lastChecked: new Date()
      }
    })

    return NextResponse.json({ app, success: true })
  } catch (error) {
    console.error('Failed to update app:', error)
    return NextResponse.json(
      { error: 'Failed to update app', success: false },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'App ID is required', success: false }, { status: 400 })
    }

    await db.app.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete app:', error)
    return NextResponse.json(
      { error: 'Failed to delete app', success: false },
      { status: 500 }
    )
  }
}
