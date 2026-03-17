import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/api-auth'
import { indexKnowledgeNode } from '@/lib/second-brain'

export async function GET(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }

  try {
    const notes = await db.smartNote.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    })
    
    // Seed an initial note if none exist
    if (notes.length === 0) {
      const welcomeNote = await db.smartNote.create({
        data: {
          title: 'Welcome to Smart Notes',
          content: 'This is your new Apple Notes inspired workspace.\n\n- Write freely without limits.\n- Organize by folders like "Work", "Personal", or "Ideas".\n- Pin important notes to the top.\n- Use tags for rapid retrieval.\n\nKaiCommand automatically indexes your notes for semantic search.',
          folder: 'Personal',
          userId
        }
      })
      notes.push(welcomeNote)
    }

    return NextResponse.json({ notes, success: true })
  } catch (error) {
    console.error('Failed to fetch smart notes:', error)
    return NextResponse.json({ error: 'Failed to fetch', success: false }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }

  try {
    const data = await request.json()
    const { id, title, content, folder, subfolder, tags, isPinned } = data

    let note;
    if (id) {
      // Update
      note = await db.smartNote.update({
        where: { id },
        data: { title, content, folder, subfolder, tags, isPinned }
      })
    } else {
      // Create
      note = await db.smartNote.create({
        data: { title, content, folder, subfolder, tags, isPinned, userId }
      })
    }

    // Index to semantic brain
    try {
      await indexKnowledgeNode({
        userId,
        nodeType: 'SmartNote',
        referenceId: note.id,
        content: `Note Title: ${note.title}\nFolder: ${note.folder}\nContent: ${note.content}`
      })
    } catch (e) {
      console.error('Failed to index SmartNote to Semantic Brain', e)
    }

    return NextResponse.json({ note, success: true })
  } catch (error) {
    console.error('Failed to save smart note:', error)
    return NextResponse.json({ error: 'Failed to save', success: false }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) return NextResponse.json({ error: 'ID required', success: false }, { status: 400 })

    await db.smartNote.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete smart note:', error)
    return NextResponse.json({ error: 'Failed to delete', success: false }, { status: 500 })
  }
}
