import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateCompletion } from '@/lib/ai'
import { getUserId } from '@/lib/api-auth'

// Mock analysis data
const MOCK_ANALYTICS = {
  metrics: {
    revenue: { value: 124500, change: 12.5, trend: 'up' },
    tasksCompleted: { value: 847, change: 8.2, trend: 'up' },
    efficiencyScore: { value: 94.2, change: 2.1, trend: 'up' },
    activeUsers: { value: 2847, change: -3.4, trend: 'down' },
    avgResponseTime: { value: 145, change: -15, trend: 'up' },
    uptime: { value: 99.8, change: 0.2, trend: 'up' }
  },
  trendData: [
    { name: 'Jan', revenue: 45000, tasks: 120, users: 2100 },
    { name: 'Feb', revenue: 52000, tasks: 145, users: 2300 },
    { name: 'Mar', revenue: 48000, tasks: 132, users: 2450 },
    { name: 'Apr', revenue: 61000, tasks: 165, users: 2380 },
    { name: 'May', revenue: 55000, tasks: 158, users: 2550 },
    { name: 'Jun', revenue: 68000, tasks: 178, users: 2620 },
    { name: 'Jul', revenue: 72000, tasks: 195, users: 2750 },
    { name: 'Aug', revenue: 78000, tasks: 210, users: 2847 }
  ],
  categoryData: [
    { name: 'E-Commerce', value: 35 },
    { name: 'Analytics', value: 25 },
    { name: 'CRM', value: 20 },
    { name: 'Infrastructure', value: 12 },
    { name: 'Finance', value: 8 }
  ],
  performanceData: [
    { name: 'Mon', response: 120, errors: 2 },
    { name: 'Tue', response: 135, errors: 3 },
    { name: 'Wed', response: 145, errors: 1 },
    { name: 'Thu', response: 130, errors: 2 },
    { name: 'Fri', response: 155, errors: 4 },
    { name: 'Sat', response: 110, errors: 0 },
    { name: 'Sun', response: 105, errors: 0 }
  ]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    if (type === 'metrics') {
      return NextResponse.json({ metrics: MOCK_ANALYTICS.metrics, success: true })
    }

    if (type === 'trends') {
      return NextResponse.json({ trends: MOCK_ANALYTICS.trendData, success: true })
    }

    if (type === 'categories') {
      return NextResponse.json({ categories: MOCK_ANALYTICS.categoryData, success: true })
    }

    if (type === 'performance') {
      return NextResponse.json({ performance: MOCK_ANALYTICS.performanceData, success: true })
    }

    // Return all analytics data
    return NextResponse.json({ 
      analytics: MOCK_ANALYTICS, 
      success: true 
    })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', success: false },
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
    const { query } = await request.json()

    // Generate AI insights using central AI wrapper (falls back to OpenAI if needed)
    const insights = await generateCompletion([
      {
        role: 'system',
        content: `You are a data analyst AI. Generate concise, actionable insights based on the following data:
        
        Metrics: ${JSON.stringify(MOCK_ANALYTICS.metrics)}
        Trends: ${JSON.stringify(MOCK_ANALYTICS.trendData)}
        Categories: ${JSON.stringify(MOCK_ANALYTICS.categoryData)}
        
        Provide 3-5 key insights in a structured format. Focus on trends, opportunities, and potential concerns.`
      },
      {
        role: 'user',
        content: query || 'Analyze the data and provide insights.'
      }
    ], {
      temperature: 0.7,
      max_tokens: 500
    })

    // Save analysis to database
    const analysis = await db.analysis.create({
      data: {
        title: 'AI Generated Analysis',
        type: 'performance',
        data: JSON.stringify(MOCK_ANALYTICS),
        insights,
        userId
      }
    })

    return NextResponse.json({ 
      insights, 
      analysis,
      success: true 
    })
  } catch (error) {
    console.error('Failed to generate analysis:', error)
    return NextResponse.json(
      { error: 'Failed to generate analysis', success: false },
      { status: 500 }
    )
  }
}
