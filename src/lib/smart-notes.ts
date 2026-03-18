import { db } from './db'
import { indexKnowledgeNode } from '@/lib/second-brain'
import { generateCompletion } from '@/lib/ai'

export interface CreateSmartNoteParams {
  userId: string
  title?: string
  content?: string
  subfolderId: string
  tags?: string[]
  isPinned?: boolean
  links?: string[]
  source?: 'manual' | 'voice' | 'finance' | 'ai' | 'task' | string
  contextType?: 'idea' | 'task' | 'insight' | 'memory' | 'log' | string
  relatedEntities?: string[]
}

export interface UpdateSmartNoteParams {
  userId: string
  noteId: string
  title?: string
  content?: string
  tags?: string[]
  isPinned?: boolean
  links?: string[]
  source?: string
  contextType?: string
  relatedEntities?: string[]
  aiSummary?: string
  aiKeyPoints?: string[]
}

export async function createSmartNote(params: CreateSmartNoteParams) {
  const note = await db.smartNote.create({
    data: {
      title: params.title || 'Untitled Note',
      content: params.content || '',
      subfolderId: params.subfolderId,
      userId: params.userId,
      tags: JSON.stringify(params.tags || []),
      isPinned: params.isPinned || false,
      links: JSON.stringify(params.links || []),
      source: params.source || 'manual',
      contextType: params.contextType || 'insight',
      relatedEntities: JSON.stringify(params.relatedEntities || [])
    }
  })

  // Index into Semantic Brain asynchronously without awaiting to avoid blocking
  indexKnowledgeNode({
    userId: params.userId,
    nodeType: 'SmartNote',
    referenceId: note.id,
    content: `Note Title: ${note.title}\nContent: ${note.content}`
  }).catch(console.error)

  // Trigger background AI enrichment
  if ((params.content || '').length > 50) {
    generateNoteSummaryInBackground(note.id, params.userId, params.title || '', params.content || '').catch(console.error)
  }

  return note
}

export async function updateSmartNote(params: UpdateSmartNoteParams) {
  const dataToUpdate: any = {}
  if (params.title !== undefined) dataToUpdate.title = params.title
  if (params.content !== undefined) dataToUpdate.content = params.content
  if (params.tags !== undefined) dataToUpdate.tags = JSON.stringify(params.tags)
  if (params.isPinned !== undefined) dataToUpdate.isPinned = params.isPinned
  if (params.links !== undefined) dataToUpdate.links = JSON.stringify(params.links)
  if (params.source !== undefined) dataToUpdate.source = params.source
  if (params.contextType !== undefined) dataToUpdate.contextType = params.contextType
  if (params.relatedEntities !== undefined) dataToUpdate.relatedEntities = JSON.stringify(params.relatedEntities)
  if (params.aiSummary !== undefined) dataToUpdate.aiSummary = params.aiSummary
  if (params.aiKeyPoints !== undefined) dataToUpdate.aiKeyPoints = JSON.stringify(params.aiKeyPoints)

  const note = await db.smartNote.update({
    where: { id: params.noteId, userId: params.userId },
    data: dataToUpdate
  })

  if (params.title !== undefined || params.content !== undefined) {
    indexKnowledgeNode({
      userId: params.userId,
      nodeType: 'SmartNote',
      referenceId: note.id,
      content: `Note Title: ${note.title || note.title}\nContent: ${note.content || note.content}`
    }).catch(console.error)
    
    // Check if substantial content exists to generate a summary
    if (params.content && params.content.length > 50) {
       generateNoteSummaryInBackground(note.id, params.userId, params.title || '', params.content).catch(console.error)
    }
  }

  return note
}

async function generateNoteSummaryInBackground(noteId: string, userId: string, title: string, content: string) {
  try {
    const aiRes = await generateCompletion([
      { role: 'system', content: 'You are an AI context engine. Summarize the following note text in 1-2 short readable sentences, and extract a strictly formatted JSON object with two keys: "summary" (string) and "keyPoints" (array of strings containing 2-5 core concepts).' },
      { role: 'user', content: `Title: ${title}\n\nContent:\n${content}` }
    ], { temperature: 0.3, max_tokens: 300, response_format: { type: "json_object" } })
    
    if (aiRes.text) {
       const parsed = JSON.parse(aiRes.text)
       if (parsed.summary || parsed.keyPoints) {
          await db.smartNote.update({
            where: { id: noteId, userId },
            data: {
              aiSummary: parsed.summary || '',
              aiKeyPoints: JSON.stringify(parsed.keyPoints || [])
            }
          })
       }
    }
  } catch (e) {
    console.error('Failed AI smart note reflection', e)
  }
}


export async function linkNotes(userId: string, sourceNoteId: string, targetNoteId: string) {
  const sourceNote = await db.smartNote.findUnique({ where: { id: sourceNoteId, userId } })
  if (!sourceNote) throw new Error('Source note not found')
  
  const currentLinks = JSON.parse(sourceNote.links || '[]')
  if (!currentLinks.includes(targetNoteId)) {
    currentLinks.push(targetNoteId)
    await db.smartNote.update({
      where: { id: sourceNoteId, userId },
      data: { links: JSON.stringify(currentLinks) }
    })
  }

  // Optional: create reciprocal link
  const targetNote = await db.smartNote.findUnique({ where: { id: targetNoteId, userId } })
  if (targetNote) {
    const targetLinks = JSON.parse(targetNote.links || '[]')
    if (!targetLinks.includes(sourceNoteId)) {
      targetLinks.push(sourceNoteId)
      await db.smartNote.update({
        where: { id: targetNoteId, userId },
        data: { links: JSON.stringify(targetLinks) }
      })
    }
  }

  return true
}

export async function getNotesByTag(userId: string, tag: string) {
  // Simple JSON contains array check, Prisma's `contains` is substring search for string types
  const notes = await db.smartNote.findMany({
    where: { 
      userId,
      tags: { contains: `"${tag}"` } 
    },
    orderBy: { updatedAt: 'desc' }
  })
  return notes
}

export async function getNotesByContext(userId: string, contextType: string) {
  return await db.smartNote.findMany({
    where: { userId, contextType },
    orderBy: { updatedAt: 'desc' }
  })
}

export async function getRelatedNotes(userId: string, entityId: string) {
  return await db.smartNote.findMany({
    where: {
      userId,
      relatedEntities: { contains: `"${entityId}"` }
    },
    orderBy: { updatedAt: 'desc' }
  })
}
