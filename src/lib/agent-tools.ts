import { db } from './db'
import { createSmartNote } from '@/lib/smart-notes'

export const agentTools = [
  {
    type: "function",
    function: {
      name: "searchSmartNotes",
      description: "Search the user's Smart Notes system-wide knowledge base for relevant context or historical notes.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query to match against note content, titles, or AI summaries." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createSmartNote",
      description: "Save an idea, memory, or context log directly into the user's unified Smart Notes system.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "A concise title" },
          content: { type: "string", description: "The detailed content of the note" },
          contextType: { type: "string", enum: ["idea", "task", "insight", "memory", "log"], description: "The type of thought being logged" }
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createLegalAlert",
      description: "Log a new legal, compliance, or regulatory risk into the Legal Radar system.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string", description: "Details of the legal risk and why it matters." },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["title", "description", "severity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Perform a real-time web search for information such as legal laws, regulations, or recent news using Tavily.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query to look up on the web." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createFinancialTransaction",
      description: "Log a new financial transaction (income or expense) into the user's Finance Database.",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "A short description of the expense or income." },
          amount: { type: "number", description: "The amount in British Pounds (£). Should be a positive number for income, and negative for expenses." },
          type: { type: "string", enum: ["income", "expense"], description: "Whether money was gained or spent." },
          category: { type: "string", enum: ["food", "transport", "entertainment", "bills", "shopping", "salary", "freelance", "other"], description: "The budget category." },
        },
        required: ["description", "amount", "type", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "switchWorkContext",
      description: "Change the user's active UI Work Context (e.g., to healthcare, electrical, or development).",
      parameters: {
        type: "object",
        properties: {
          contextType: { type: "string", enum: ["healthcare", "electrical", "development"], description: "The specific industry context to switch to." },
        },
        required: ["contextType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createVoiceNote",
      description: "Log a summarized thought or voice note transcript into the Second Brain semantic knowledge graph.",
      parameters: {
        type: "object",
        properties: {
          transcript: { type: "string", description: "The full text content of the note." },
          category: { type: "string", enum: ["patient_obs", "electrical", "code_idea", "general"] },
          duration: { type: "number", description: "Estimated duration in seconds if spoken, default to 15." }
        },
        required: ["transcript", "category", "duration"],
      },
    },
  }
]

// Tool dispatcher
export async function executeAgentTool(name: string, args: any, userId: string) {
  switch (name) {
    case 'searchSmartNotes':
      try {
        const notes = await db.smartNote.findMany({
          where: { 
            userId,
            OR: [
              { title: { contains: args.query, mode: 'insensitive' } },
              { content: { contains: args.query, mode: 'insensitive' } },
              { aiSummary: { contains: args.query, mode: 'insensitive' } }
            ]
          },
          take: 5,
          orderBy: { updatedAt: 'desc' }
        })
        return { success: true, notes: notes.map(n => ({ title: n.title, aiSummary: n.aiSummary, contentSnippet: n.content.substring(0, 200) })) }
      } catch (err: any) {
        return { success: false, message: "Smart Note search failed: " + err.message }
      }

    case 'createSmartNote':
      try {
        // Find a default subfolder, or just throw it in the first one available
        const folder = await db.smartFolder.findFirst({ where: { userId }, include: { subfolders: true } })
        let targetSubfolderId = folder?.subfolders[0]?.id

        if (!targetSubfolderId) {
           const newFolder = await db.smartFolder.create({ data: { name: 'AI Inbox', userId, subfolders: { create: [{ name: 'Agent Notes', userId }] } }, include: { subfolders: true }})
           targetSubfolderId = newFolder.subfolders[0].id
        }

        const note = await createSmartNote({
           userId,
           title: args.title,
           content: args.content,
           contextType: args.contextType || 'insight',
           source: 'ai',
           subfolderId: targetSubfolderId
        })
        return { success: true, message: "Saved exclusively to Smart Notes.", noteId: note.id }
      } catch (err: any) {
        return { success: false, message: "Note creation failed: " + err.message }
      }

    case 'search_web':
      const apiKey = process.env.TAVILY_API_KEY
      if (!apiKey) {
        return { success: false, message: "Tavily API key not configured." }
      }
      try {
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
            query: args.query,
            search_depth: "basic",
            include_answer: true,
            max_results: 3
          })
        })
        const data = await res.json()
        return { success: true, answer: data.answer, results: data.results }
      } catch (err: any) {
        return { success: false, message: "Search failed: " + err.message }
      }
      
    case 'createLegalAlert':
      return await db.legalAlert.create({
        data: {
          title: args.title,
          description: args.description,
          severity: args.severity,
          status: 'active',
          userId
        }
      })

    case 'createFinancialTransaction':
      return await db.transaction.create({
        data: {
          description: args.description,
          amount: Math.abs(args.amount) * (args.type === 'expense' ? -1 : 1),
          type: args.type,
          category: args.category,
          date: new Date(),
          userId
        }
      })
    
    case 'switchWorkContext':
      // Ensure one is active
      const contexts = await db.workContext.findMany({ where: { userId } })
      const target = contexts.find(c => c.type === args.contextType)
      if (target) {
        await db.workContext.updateMany({ where: { userId }, data: { isActive: false } })
        await db.workContext.update({ where: { id: target.id }, data: { isActive: true } })
        return { success: true, message: `Context switched to ${args.contextType}` }
      }
      return { success: false, message: `Context ${args.contextType} not found in database.` }

    case 'createVoiceNote':
      return await db.voiceNote.create({
        data: {
          transcript: args.transcript,
          category: args.category,
          duration: args.duration,
          processed: true,
          summary: args.transcript.slice(0, 50) + "...",
          userId
        }
      })

    default:
      throw new Error(`Tool ${name} not implemented.`)
  }
}
