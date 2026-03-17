import { NextRequest, NextResponse } from 'next/server'
import { generateCompletion } from '@/lib/ai'
import { getUserId } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }

  try {
    const { content, action } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required', success: false }, { status: 400 })
    }

    let systemPrompt = ''
    if (action === 'summarize') {
      systemPrompt = 'You are an AI assistant. Provide a concise, highly readable summary of the provided text. Format it as a markdown paragraph or short bulleted list.'
    } else if (action === 'key_points') {
      systemPrompt = 'You are an AI assistant analyzing text. Extract the main action items, core ideas, and key takeaways from the provided text. Format it as a markdown bulleted list. Do not include extraneous conversational text.'
    } else {
      return NextResponse.json({ error: 'Invalid action', success: false }, { status: 400 })
    }

    const aiRes = await generateCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: content }
    ], {
      temperature: 0.3,
      max_tokens: 500
    })

    if (!aiRes.text) {
      throw new Error('No completion returned')
    }

    return NextResponse.json({ result: aiRes.text, success: true })

  } catch (error) {
    console.error('Smart Notes AI Error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI request', success: false },
      { status: 500 }
    )
  }
}
