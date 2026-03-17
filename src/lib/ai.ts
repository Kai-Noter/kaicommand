import ZAI from 'z-ai-web-dev-sdk'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CompletionOptions {
  temperature?: number
  max_tokens?: number
}

export async function generateCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  const temperature = options.temperature ?? 0.7
  const max_tokens = options.max_tokens ?? 1000

  const ZAI_BASE_URL = process.env.ZAI_BASE_URL
  const ZAI_API_KEY = process.env.ZAI_API_KEY
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  // 1. Primary: Use KaiCommand PRO (ZAI Env vars)
  if (ZAI_BASE_URL && ZAI_API_KEY) {
    const url = `${ZAI_BASE_URL.replace(/\/$/, '')}/chat/completions`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ZAI_API_KEY}`,
        'X-Z-AI-From': 'Z'
      },
      body: JSON.stringify({
        messages,
        temperature,
        max_tokens,
        thinking: { type: 'disabled' }
      })
    })
    
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`ZAI API error ${res.status}: ${text.slice(0, 200)}`)
    }
    
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (content == null) throw new Error('ZAI API returned no content')
    return content
  }

  // 2. Fallback: Standard OpenAI API Key
  if (OPENAI_API_KEY) {
    const url = 'https://api.openai.com/v1/chat/completions'
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature,
        max_tokens,
      })
    })
    
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`OpenAI API error ${res.status}: ${text.slice(0, 200)}`)
    }
    
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (content == null) throw new Error('OpenAI API returned no content')
    return content
  }

  // 3. SDK Fallback: local .z-ai-config file
  try {
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages,
      temperature,
      max_tokens
    })
    return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'
  } catch (sdkError: any) {
    const msg = sdkError?.message || String(sdkError)
    if (msg.includes('Configuration file not found') || msg.includes('not found or invalid')) {
       throw new Error('AI assistant is not configured. Set OPENAI_API_KEY or ZAI_API_KEY in your environment variables.')
    }
    throw sdkError
  }
}
