import ZAI from 'z-ai-web-dev-sdk'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  name?: string
  tool_call_id?: string
  tool_calls?: any[]
}

export interface CompletionOptions {
  temperature?: number
  max_tokens?: number
  tools?: any[]
}

export async function generateCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<{ text: string | null; tool_calls?: any[] }> {
  const temperature = options.temperature ?? 0.7
  const max_tokens = options.max_tokens ?? 1000

  const ZAI_BASE_URL = process.env.ZAI_BASE_URL
  const ZAI_API_KEY = process.env.ZAI_API_KEY
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  // 1. Primary: Use KaiCommand PRO (ZAI Env vars) - Skip if tools are required as fallback is better
  if (ZAI_BASE_URL && ZAI_API_KEY && (!options.tools || options.tools.length === 0)) {
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
        tools: options.tools,
        thinking: { type: 'disabled' }
      })
    })
    
    if (res.ok) {
      const data = await res.json()
      const message = data.choices?.[0]?.message
      if (!message) throw new Error('ZAI API returned no content')
      return { text: message.content || null, tool_calls: message.tool_calls }
    } else {
      console.warn(`ZAI API error ${res.status}: falling back to OpenAI...`)
    }
  }

  // 2. Fallback: Standard OpenAI API Key (Best for Function Calling)
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
        tools: options.tools
      })
    })
    
    if (!res.ok) {
      const text = await res.text()
      // If quota exceeded, don't throw immediately, fall through to free SDK
      if (res.status === 429) {
        console.warn('OpenAI Quota Exceeded (429). Falling back to free ZAI SDK...')
      } else {
        throw new Error(`OpenAI API error ${res.status}: ${text.slice(0, 200)}`)
      }
    } else {
      const data = await res.json()
      const message = data.choices?.[0]?.message
      if (!message) throw new Error('OpenAI API returned no content')
      return { text: message.content || null, tool_calls: message.tool_calls }
    }
  }

  // 3. SDK Fallback: local .z-ai-config file (Free fallback if Keys fail or 429)
  try {
    const zai = await ZAI.create()
    const sdkMessages = messages.map(m => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content || '' }))
    const completion = await zai.chat.completions.create({
      messages: sdkMessages,
      temperature,
      max_tokens
    })
    const message = completion.choices[0]?.message
    return { text: message?.content || 'I apologize, but I could not generate a response.', tool_calls: undefined }
  } catch (sdkError: any) {
    const msg = sdkError?.message || String(sdkError)
    
    // Instead of throwing an error which crashes the chat, return a helpful mock response
    // if the user has no API credits AND hasn't set up the free SDK config
    if (msg.includes('Configuration file not found') || msg.includes('not found or invalid')) {
       return { 
         text: "Heads up: I am trying to use the free backup SDK because OpenAI ran out of credits, but I can't find the **`.z-ai-config`** file to authenticate it!\n\nTo fix this:\n1. Open your terminal at `MPJL APPS/KaiCommand`\n2. Run `npx z-ai init` to log in and create the config file.\n3. Restart the server!\n\n(Alternatively, you can just add billing credits to your OpenAI account!)", 
         tool_calls: undefined 
       }
    }
    
    // For other unexpected SDK errors, return a safe fallback message
    console.error("SDK Fallback Error:", sdkError)
    return { 
      text: "I am having trouble connecting to both OpenAI and the backup ZAI SDK right now. Please check your terminal console for errors.", 
      tool_calls: undefined 
    }
  }
}
