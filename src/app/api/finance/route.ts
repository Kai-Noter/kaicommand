import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'
import { getUserId } from '@/lib/api-auth'

// Mock finance data
const MOCK_TRANSACTIONS = [
  { id: 'tx-001', description: 'Salary Deposit', amount: 8500, type: 'income', category: 'salary', date: new Date(Date.now() - 86400000 * 2) },
  { id: 'tx-002', description: 'Freelance Project', amount: 2500, type: 'income', category: 'freelance', date: new Date(Date.now() - 86400000 * 5) },
  { id: 'tx-003', description: 'Grocery Shopping', amount: -285.50, type: 'expense', category: 'food', date: new Date(Date.now() - 86400000 * 1) },
  { id: 'tx-004', description: 'Electric Bill', amount: -125.00, type: 'expense', category: 'bills', date: new Date(Date.now() - 86400000 * 3) },
  { id: 'tx-005', description: 'Netflix Subscription', amount: -15.99, type: 'expense', category: 'entertainment', date: new Date(Date.now() - 86400000 * 7) },
  { id: 'tx-006', description: 'Gas Station', amount: -65.00, type: 'expense', category: 'transport', date: new Date(Date.now() - 86400000 * 2) },
  { id: 'tx-007', description: 'Investment Return', amount: 450, type: 'income', category: 'other', date: new Date(Date.now() - 86400000 * 10) },
  { id: 'tx-008', description: 'Restaurant Dinner', amount: -89.50, type: 'expense', category: 'food', date: new Date(Date.now() - 86400000 * 4) },
  { id: 'tx-009', description: 'Amazon Purchase', amount: -156.99, type: 'expense', category: 'shopping', date: new Date(Date.now() - 86400000 * 6) },
  { id: 'tx-010', description: 'Consulting Fee', amount: 1200, type: 'income', category: 'freelance', date: new Date(Date.now() - 86400000 * 8) },
  { id: 'tx-011', description: 'Internet Bill', amount: -79.99, type: 'expense', category: 'bills', date: new Date(Date.now() - 86400000 * 12) },
  { id: 'tx-012', description: 'Coffee Shop', amount: -12.50, type: 'expense', category: 'food', date: new Date(Date.now() - 86400000 * 1) },
  { id: 'tx-013', description: 'Gym Membership', amount: -49.99, type: 'expense', category: 'entertainment', date: new Date(Date.now() - 86400000 * 15) },
  { id: 'tx-014', description: 'Dividend Income', amount: 180, type: 'income', category: 'other', date: new Date(Date.now() - 86400000 * 20) },
  { id: 'tx-015', description: 'Uber Ride', amount: -24.50, type: 'expense', category: 'transport', date: new Date(Date.now() - 86400000 * 3) }
]

const BUDGET_DATA = [
  { category: 'food', budget: 500, spent: 387.50 },
  { category: 'transport', budget: 200, spent: 89.50 },
  { category: 'entertainment', budget: 150, spent: 65.98 },
  { category: 'bills', budget: 400, spent: 204.99 },
  { category: 'shopping', budget: 300, spent: 156.99 }
]

export async function GET(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    // Get transactions from database
    let transactions = await db.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    })

    // Seed mock data if empty
    if (transactions.length === 0) {
      for (const tx of MOCK_TRANSACTIONS) {
        await db.transaction.create({
          data: {
            id: tx.id,
            description: tx.description,
            amount: Math.abs(tx.amount),
            type: tx.type,
            category: tx.category,
            date: tx.date,
            userId
          }
        })
      }
      transactions = await db.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' }
      })
    }

    // Calculate summary
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = income - expenses

    // Category breakdown
    const categoryBreakdown = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    // Monthly data
    const monthlyData = [
      { name: 'Jan', income: 9500, expenses: 4500 },
      { name: 'Feb', income: 10200, expenses: 4800 },
      { name: 'Mar', income: 8800, expenses: 4200 },
      { name: 'Apr', income: 11000, expenses: 5100 },
      { name: 'May', income: 10500, expenses: 4600 },
      { name: 'Jun', income: 12000, expenses: 5200 }
    ]

    if (type === 'summary') {
      return NextResponse.json({
        summary: {
          income,
          expenses,
          balance,
          savingsRate: Math.round((balance / income) * 100)
        },
        success: true
      })
    }

    if (type === 'budget') {
      return NextResponse.json({ budget: BUDGET_DATA, success: true })
    }

    return NextResponse.json({
      transactions,
      summary: { income, expenses, balance },
      budget: BUDGET_DATA,
      categoryBreakdown,
      monthlyData,
      success: true
    })
  } catch (error) {
    console.error('Failed to fetch finance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch finance data', success: false },
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

    if (data.type === 'recommendations') {
      // Generate AI financial recommendations
      const zai = await ZAI.create()

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a financial advisor AI. Based on the following data, provide 3-5 actionable financial recommendations:
            
            Budget Data: ${JSON.stringify(BUDGET_DATA)}
            Monthly Data: ${JSON.stringify([
              { name: 'Jan', income: 9500, expenses: 4500 },
              { name: 'Feb', income: 10200, expenses: 4800 },
              { name: 'Mar', income: 8800, expenses: 4200 },
              { name: 'Apr', income: 11000, expenses: 5100 },
              { name: 'May', income: 10500, expenses: 4600 },
              { name: 'Jun', income: 12000, expenses: 5200 }
            ])}
            
            Provide practical advice for budgeting, saving, and spending optimization.`
          },
          {
            role: 'user',
            content: data.query || 'Provide financial recommendations based on my spending patterns.'
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })

      const recommendations = completion.choices[0]?.message?.content || 'Unable to generate recommendations.'

      return NextResponse.json({ recommendations, success: true })
    }

    // Create new transaction
    const transaction = await db.transaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: data.date ? new Date(data.date) : new Date(),
        userId
      }
    })

    return NextResponse.json({ transaction, success: true })
  } catch (error) {
    console.error('Failed to process finance request:', error)
    return NextResponse.json(
      { error: 'Failed to process finance request', success: false },
      { status: 500 }
    )
  }
}
