import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/api-auth'

// Mock data for demo
const MOCK_EMAILS = [
  {
    id: 'email-001',
    subject: 'Q4 Financial Report - Action Required',
    sender: 'Finance Team',
    senderEmail: 'finance@company.com',
    recipient: 'user@company.com',
    preview: 'Please review the attached Q4 financial report and provide your feedback by Friday...',
    content: 'Please review the attached Q4 financial report and provide your feedback by Friday. The report includes revenue analysis, expense breakdowns, and projections for the next quarter.',
    provider: 'gmail',
    category: 'primary',
    priority: 'high',
    isRead: false,
    isStarred: true,
    createdAt: new Date(Date.now() - 3600000)
  },
  {
    id: 'email-002',
    subject: 'New login detected from Chrome on Windows',
    sender: 'Security Alert',
    senderEmail: 'security@outlook.com',
    recipient: 'user@outlook.com',
    preview: 'We noticed a new sign-in to your Outlook account from a device or location...',
    content: 'We noticed a new sign-in to your Outlook account from a device or location. If this was you, you can ignore this email. If not, please secure your account immediately.',
    provider: 'outlook',
    category: 'updates',
    priority: 'high',
    isRead: false,
    isStarred: false,
    createdAt: new Date(Date.now() - 7200000)
  },
  {
    id: 'email-003',
    subject: 'Your Amazon order has shipped!',
    sender: 'Amazon',
    senderEmail: 'ship-confirm@amazon.com',
    recipient: 'user@gmail.com',
    preview: 'Your package is on its way! Track your shipment with the link below...',
    content: 'Your package is on its way! Track your shipment with the link below. Estimated delivery: Tuesday.',
    provider: 'gmail',
    category: 'promotions',
    priority: 'normal',
    isRead: true,
    isStarred: false,
    createdAt: new Date(Date.now() - 14400000)
  },
  {
    id: 'email-004',
    subject: 'Meeting Reminder: Product Review at 2 PM',
    sender: 'John Smith',
    senderEmail: 'john.smith@company.com',
    recipient: 'user@company.com',
    preview: 'This is a reminder about our product review meeting scheduled for today...',
    content: 'This is a reminder about our product review meeting scheduled for today at 2 PM. Please come prepared with your updates on the current sprint progress.',
    provider: 'gmail',
    category: 'primary',
    priority: 'high',
    isRead: false,
    isStarred: false,
    createdAt: new Date(Date.now() - 18000000)
  },
  {
    id: 'email-005',
    subject: 'LinkedIn: 5 new connection requests',
    sender: 'LinkedIn',
    senderEmail: 'notifications@linkedin.com',
    recipient: 'user@yahoo.com',
    preview: 'You have 5 new connection requests waiting for your response...',
    content: 'You have 5 new connection requests waiting for your response. Expand your network and connect with professionals in your industry.',
    provider: 'yahoo',
    category: 'social',
    priority: 'low',
    isRead: true,
    isStarred: false,
    createdAt: new Date(Date.now() - 28800000)
  },
  {
    id: 'email-006',
    subject: 'Weekly Newsletter: Tech Trends 2024',
    sender: 'Tech Digest',
    senderEmail: 'newsletter@techdigest.com',
    recipient: 'user@hotmail.com',
    preview: 'This week in tech: AI advancements, new framework releases, and industry insights...',
    content: 'This week in tech: AI advancements, new framework releases, and industry insights. Top stories include the latest GPT updates and emerging web technologies.',
    provider: 'hotmail',
    category: 'forums',
    priority: 'normal',
    isRead: false,
    isStarred: false,
    createdAt: new Date(Date.now() - 43200000)
  },
  {
    id: 'email-007',
    subject: 'URGENT: Server Maintenance Scheduled',
    sender: 'IT Department',
    senderEmail: 'it@company.com',
    recipient: 'user@company.com',
    preview: 'Scheduled maintenance will occur this weekend. Please save all work...',
    content: 'Scheduled maintenance will occur this weekend from Saturday 10 PM to Sunday 6 AM. Please save all work and log off before the maintenance window.',
    provider: 'gmail',
    category: 'primary',
    priority: 'high',
    isRead: false,
    isStarred: true,
    createdAt: new Date(Date.now() - 57600000)
  },
  {
    id: 'email-008',
    subject: 'Your subscription renewal is coming up',
    sender: 'Netflix',
    senderEmail: 'info@netflix.com',
    recipient: 'user@gmail.com',
    preview: 'Your Netflix subscription will renew on January 15th. Manage your plan...',
    content: 'Your Netflix subscription will renew on January 15th. Manage your plan or update payment details in your account settings.',
    provider: 'gmail',
    category: 'promotions',
    priority: 'normal',
    isRead: true,
    isStarred: false,
    createdAt: new Date(Date.now() - 86400000)
  },
  {
    id: 'email-009',
    subject: 'Code Review Request: Feature Branch PR #234',
    sender: 'GitHub',
    senderEmail: 'noreply@github.com',
    recipient: 'user@outlook.com',
    preview: 'A new pull request requires your review. Please check the changes...',
    content: 'A new pull request requires your review. Please check the changes and provide your feedback. PR #234: Add user authentication flow.',
    provider: 'outlook',
    category: 'primary',
    priority: 'high',
    isRead: false,
    isStarred: false,
    createdAt: new Date(Date.now() - 10800000)
  },
  {
    id: 'email-010',
    subject: 'Happy Birthday from the Team!',
    sender: 'HR Department',
    senderEmail: 'hr@company.com',
    recipient: 'user@company.com',
    preview: 'Wishing you a wonderful birthday! Enjoy your special day...',
    content: 'Wishing you a wonderful birthday! Enjoy your special day with your loved ones. We appreciate having you on our team!',
    provider: 'gmail',
    category: 'social',
    priority: 'normal',
    isRead: true,
    isStarred: true,
    createdAt: new Date(Date.now() - 172800000)
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
    const provider = searchParams.get('provider')
    const category = searchParams.get('category')
    const filter = searchParams.get('filter')

    if (id) {
      let email = await db.email.findUnique({
        where: { id }
      })

      if (!email) {
        email = MOCK_EMAILS.find(e => e.id === id) as any
      }

      if (!email) {
        return NextResponse.json({ error: 'Email not found', success: false }, { status: 404 })
      }

      return NextResponse.json({ email, success: true })
    }

    let emails = await db.email.findMany({
      where: { 
        userId,
        ...(provider ? { provider } : {}),
        ...(category ? { category } : {}),
        ...(filter === 'unread' ? { isRead: false } : {}),
        ...(filter === 'starred' ? { isStarred: true } : {})
      },
      orderBy: { createdAt: 'desc' }
    })

    // If no emails in database, seed with mock data
    if (emails.length === 0) {
      for (const mockEmail of MOCK_EMAILS) {
        await db.email.create({
          data: {
            id: mockEmail.id,
            subject: mockEmail.subject,
            sender: mockEmail.sender,
            senderEmail: mockEmail.senderEmail,
            recipient: mockEmail.recipient,
            preview: mockEmail.preview,
            content: mockEmail.content,
            provider: mockEmail.provider,
            category: mockEmail.category,
            priority: mockEmail.priority,
            isRead: mockEmail.isRead,
            isStarred: mockEmail.isStarred,
            userId,
            createdAt: mockEmail.createdAt
          }
        })
      }
      emails = await db.email.findMany({
        where: { 
          userId,
          ...(provider ? { provider } : {}),
          ...(category ? { category } : {})
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    // Calculate statistics
    const stats = {
      total: emails.length,
      unread: emails.filter(e => !e.isRead).length,
      starred: emails.filter(e => e.isStarred).length,
      byProvider: {
        gmail: emails.filter(e => e.provider === 'gmail').length,
        yahoo: emails.filter(e => e.provider === 'yahoo').length,
        outlook: emails.filter(e => e.provider === 'outlook').length,
        hotmail: emails.filter(e => e.provider === 'hotmail').length
      },
      byCategory: {
        primary: emails.filter(e => e.category === 'primary').length,
        social: emails.filter(e => e.category === 'social').length,
        promotions: emails.filter(e => e.category === 'promotions').length,
        updates: emails.filter(e => e.category === 'updates').length,
        forums: emails.filter(e => e.category === 'forums').length
      }
    }

    return NextResponse.json({ emails, stats, success: true })
  } catch (error) {
    console.error('Failed to fetch emails:', error)
    return NextResponse.json(
      { error: 'Failed to fetch emails', success: false },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    const email = await db.email.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ email, success: true })
  } catch (error) {
    console.error('Failed to update email:', error)
    return NextResponse.json(
      { error: 'Failed to update email', success: false },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Email ID is required', success: false }, { status: 400 })
    }

    await db.email.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete email:', error)
    return NextResponse.json(
      { error: 'Failed to delete email', success: false },
      { status: 500 }
    )
  }
}
