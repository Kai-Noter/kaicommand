import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/api-auth'

// System prompt: Secretary, servant, reliable friend — not a yes-person. Devil's advocate when it helps.
const SYSTEM_PROMPT = `You are KaiCommand AI: the user's secretary, servant, and reliable friend. You run the Command Center so they can focus on what matters. You are trusted to carry out tasks when they're not around (e.g. app updates, clearing cache, surfacing bugs, reminders) and to give honest, well-reasoned feedback — including playing devil's advocate when that would improve their decisions.

## Core identity
- **Secretary**: Proactive with scheduling, reminders, summaries, and keeping things organised. You can suggest and trigger actions (open sections, switch context, start focus/breathing).
- **Servant**: Reliable execution. When asked to do something, you confirm what you'll do and any constraints; you don't just say yes — you clarify and then deliver.
- **Reliable friend**: You do not always say yes. You give well-reasoned responses, flag risks, and play devil's advocate when it would help (e.g. "Have you considered…?", "The downside of that is…", "Another angle: …"). You're kind but honest.

## When to push back
- If a request is unclear or risky, say so and suggest a safer or clearer option.
- If the user is about to skip something important (backup, security, rest), gently point it out.
- When they're deciding between options, briefly argue the other side so they see the full picture.
- If you cannot actually perform an action (e.g. you can't run shell commands on their machine), say so and suggest what they can do instead.

## Capabilities you can support (via suggestions or in-app actions)
- **Apps**: Monitor status, suggest updates, clearing cache, and highlight potential bugs or performance issues.
- **Context**: Switch work context (healthcare, electrical, development); tailor advice to the current context.
- **Tasks & time**: Prioritisation, focus timer, breathing, reminders.
- **Finance**: Budget and expense advice (currency: British Pounds £).
- **Wellness**: Focus, breaks, brain games, stress management.

## Response style
- Clear, direct, and actionable. Use bullets or short lists when useful.
- British English (colour, organisation, etc.).
- For voice: keep replies concise and easy to hear.
- When playing devil's advocate: be brief and constructive, not preachy.

## "Argue the other side"
- If the user asks you to argue the other side, play devil's advocate, or give counterpoints to their last message or decision: give 2–3 concise counterpoints or risks. Use structure like: **Risks:** …, **Alternative:** …, **What if …?** Be constructive and brief.

## Special commands (acknowledge and, when possible, trigger via actions)
- "Switch context to [healthcare/electrical/development]" — acknowledge and suggest switching.
- "Open [dashboard/email/finance/apps/play/emergency/settings/…]" — navigate there.
- "Quick summary" — brief overview of their day or key items.
- "Help me focus" / "Start focus timer" / "Start breathing" — support and suggest starting the in-app tools.
- Emergency / urgent — take seriously and point to emergency protocols or next steps.

You are the user's personal AI companion: capable, loyal, and honest.`

export async function POST(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  try {
    const { message, history = [], context, voiceMode = false } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    // Build context-aware system prompt
    let contextPrompt = SYSTEM_PROMPT
    if (context) {
      contextPrompt += `\n\n## Current Context:\nThe user is currently in "${context}" mode. Tailor your responses accordingly.`
    }

    // Build messages array with history
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: contextPrompt
      },
      ...history.slice(-10).map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ]

    // Adjust parameters based on voice mode
    const maxTokens = voiceMode ? 300 : 1000
    const temperature = voiceMode ? 0.6 : 0.7

    const completion = await zai.chat.completions.create({
      messages,
      temperature,
      max_tokens: maxTokens
    })

    const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.'

    // Detect if this is an action request
    let action: { type: string; context?: string; tab?: string } | null = null
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('switch context') || lowerMessage.includes('change context')) {
      if (lowerMessage.includes('healthcare') || lowerMessage.includes('hospital') || lowerMessage.includes('medical')) {
        action = { type: 'switchContext', context: 'healthcare' }
      } else if (lowerMessage.includes('electrical') || lowerMessage.includes('electric') || lowerMessage.includes('construction')) {
        action = { type: 'switchContext', context: 'electrical' }
      } else if (lowerMessage.includes('development') || lowerMessage.includes('coding') || lowerMessage.includes('programming')) {
        action = { type: 'switchContext', context: 'development' }
      }
    }
    
    if (lowerMessage.includes('open') || lowerMessage.includes('go to') || lowerMessage.includes('show me')) {
      if (lowerMessage.includes('dashboard')) action = { type: 'navigate', tab: 'dashboard' }
      else if (lowerMessage.includes('email')) action = { type: 'navigate', tab: 'emails' }
      else if (lowerMessage.includes('finance') || lowerMessage.includes('money') || lowerMessage.includes('budget')) action = { type: 'navigate', tab: 'finance' }
      else if (lowerMessage.includes('app')) action = { type: 'navigate', tab: 'apps' }
      else if (lowerMessage.includes('play') || lowerMessage.includes('game') || lowerMessage.includes('relax')) action = { type: 'navigate', tab: 'playcentre' }
      else if (lowerMessage.includes('inventory') || lowerMessage.includes('stock') || lowerMessage.includes('supplies')) action = { type: 'navigate', tab: 'inventory' }
      else if (lowerMessage.includes('certification') || lowerMessage.includes('license') || lowerMessage.includes('compliance')) action = { type: 'navigate', tab: 'certifications' }
      else if (lowerMessage.includes('emergency') || lowerMessage.includes('protocol')) action = { type: 'navigate', tab: 'emergency' }
      else if (lowerMessage.includes('voice') || lowerMessage.includes('note')) action = { type: 'navigate', tab: 'voice-notes' }
      else if (lowerMessage.includes('context') || lowerMessage.includes('work')) action = { type: 'navigate', tab: 'context' }
      else if (lowerMessage.includes('setting')) action = { type: 'navigate', tab: 'settings' }
    }

    if (lowerMessage.includes('emergency') && (lowerMessage.includes('now') || lowerMessage.includes('help') || lowerMessage.includes('urgent'))) {
      action = { type: 'emergency' }
    }

    if (lowerMessage.includes('start focus') || lowerMessage.includes('focus timer') || lowerMessage.includes('pomodoro')) {
      action = { type: 'startFocus' }
    }

    if (lowerMessage.includes('start breathing') || lowerMessage.includes('relax') || lowerMessage.includes('calm down')) {
      action = { type: 'startBreathing' }
    }

    // Save chat message to database
    try {
      await db.chatMessage.create({
        data: {
          role: 'user',
          content: message,
          userId
        }
      })

      await db.chatMessage.create({
        data: {
          role: 'assistant',
          content: assistantMessage,
          userId
        }
      })
    } catch (dbError) {
      console.error('Failed to save chat message:', dbError)
    }

    return NextResponse.json({
      message: assistantMessage,
      action,
      success: true
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message', success: false },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  try {
    const messages = await db.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 100
    })

    return NextResponse.json({ messages, success: true })
  } catch (error) {
    console.error('Failed to fetch chat history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history', success: false },
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
    await db.chatMessage.deleteMany({
      where: { userId }
    })

    return NextResponse.json({ success: true, message: 'Chat history cleared' })
  } catch (error) {
    console.error('Failed to clear chat history:', error)
    return NextResponse.json(
      { error: 'Failed to clear chat history', success: false },
      { status: 500 }
    )
  }
}
