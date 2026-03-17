import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/api-auth'
import { generateCompletion } from '@/lib/ai'

const PROMPT_ENGINEER_SYSTEM = `You are an elite Prompt Engineer for KaiCommand. 
Your exclusively role is to take a user's raw, messy, or unformulated idea and transform it into a highly structured, bulletproof "Master Prompt" that they can then use to instruct other AI agents.

A Master Prompt must ALWAYS include the following sections exactly:
# Context & Persona
(Define WHO the AI should act as, and WHAT the background situation is)

# The Objective
(A single, crystal-clear sentence defining the goal)

# Specific Requirements & Constraints
(Bullet points detailing what must be done, what must NOT be done, tone, and formatting)

# Expected Output Format
(A clear definition of how the final answer should look, e.g. markdown table, JSON, step-by-step list)

Analyze the user's raw idea, infer what they are trying to achieve (especially if it relates to business, agriculture, legal tracking, or Malawi investments), and output ONLY the final Master Prompt using the exact headings above. Do not include introductory or concluding conversational text.`

const FIERCE_CRITIQUE_SYSTEM = `You are a Fierce, Malicious AI Critic. Your sole job is to ruthlessly poke holes, find edge cases, expose weak assumptions, and completely destroy the user's idea before they build it.
Do NOT be polite. Do NOT sugarcoat.
Structure your response as:
# 🚨 Fatal Flaws
(List the biggest assumptions and reasons this will fail)

# 💼 Business / Real-World Reality Check
(Why this will fail in the real world, especially regarding Malawi agriculture, investments, or legal tracking)

# 🔨 How to Actually Fix It
(What the user needs to change immediately to make this viable)`

export async function POST(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }

  try {
    const { rawIdea, mode = 'enhance' } = await request.json()

    if (!rawIdea) {
      return NextResponse.json({ error: 'Raw idea is required', success: false }, { status: 400 })
    }

    const systemPrompt = mode === 'critique' ? FIERCE_CRITIQUE_SYSTEM : PROMPT_ENGINEER_SYSTEM
    const userPrompt = mode === 'critique'
      ? `Here is my idea. Rip it apart and ruthlessly critique it:\n\n${rawIdea}`
      : `Here is my raw idea. Please engineer it into a Master Prompt:\n\n${rawIdea}`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await generateCompletion(messages as any, { 
      temperature: 0.7, 
      max_tokens: 1500 
    })

    if (!response.text) {
      throw new Error("Failed to generate prompt text")
    }

    return NextResponse.json({ 
      success: true, 
      masterPrompt: response.text 
    })

  } catch (error: any) {
    console.error('Prompt Studio Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}
