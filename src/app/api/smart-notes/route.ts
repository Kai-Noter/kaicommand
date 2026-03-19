import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/api-auth'
import { createSmartNote, updateSmartNote } from '@/lib/smart-notes'

// Fetch the entire Folder -> Subfolder -> Note hierarchy
export async function GET(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }

  try {
    const folders = await db.smartFolder.findMany({
      where: { userId },
      include: {
        subfolders: {
          include: {
            notes: {
              orderBy: { updatedAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    
    // Helper to compute node properties dynamically
    const enrichHierarchy = (hierarchy: any[]) => {
      return hierarchy.map(folder => {
        let totalNotes = 0;
        
        const allNotes = folder.subfolders.flatMap((sub: any) => sub.notes)
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          
        const folderLastUpdated = allNotes.length > 0 ? allNotes[0].updatedAt : folder.updatedAt;
        const folderPreview = allNotes.length > 0 ? allNotes[0].content.substring(0, 100) : "";

        const enrichedSubfolders = folder.subfolders.map((sub: any) => {
          const noteCount = sub.notes.length;
          totalNotes += noteCount;
          
          const lastUpdated = sub.notes.length > 0 ? sub.notes[0].updatedAt : sub.updatedAt;
          const preview = sub.notes.length > 0 ? sub.notes[0].content.substring(0, 100) : "";

          return {
            ...sub,
            noteCount,
            lastUpdated,
            preview
          };
        });

        return {
          ...folder,
          subfolders: enrichedSubfolders,
          totalNotes,
          lastUpdated: folderLastUpdated,
          preview: folderPreview
        };
      });
    };

    // Seed initial 3-Space hierarchical structure if entirely empty
    if (folders.length === 0) {
      const defaultFolder = await db.smartFolder.create({
        data: {
          name: 'Vision',
          userId,
          subfolders: {
            create: [
              {
                name: 'Getting Started',
                userId,
                notes: {
                  create: [
                    {
                      title: 'Welcome to Smart Notes',
                      content: 'This is your new Apple Notes inspired workspace.\n\n- Write freely without limits.\n- Hierarchically organize by Folder -> Subfolder -> Note.\n- Automate things using AI.',
                      userId
                    }
                  ]
                }
              }
            ]
          }
        },
        include: { subfolders: { include: { notes: true } } }
      })
      await db.smartFolder.create({ data: { name: 'Flow', userId } })
      await db.smartFolder.create({ data: { name: 'Memory', userId } })
      await db.smartFolder.create({ data: { name: 'planning', userId } })
      await db.smartFolder.create({ data: { name: 'completed', userId } })
      
      const newHierarchy = await db.smartFolder.findMany({
        where: { userId },
        include: {
          subfolders: { include: { notes: { orderBy: { updatedAt: 'desc' } } }, orderBy: { createdAt: 'asc' } }
        },
        orderBy: { createdAt: 'asc' }
      })
      return NextResponse.json({ folders: enrichHierarchy(newHierarchy), success: true })
    }

    return NextResponse.json({ folders: enrichHierarchy(folders), success: true })
  } catch (error) {
    console.error('Failed to fetch smart folders:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch'
    return NextResponse.json({ error: message, success: false }, { status: 500 })
  }
}

// Multiplexer POST route for Folder, Subfolder, and Note CRUD
export async function POST(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }

  try {
    const { action, payload } = await request.json()

    // 1. FOLDERS
    if (action === 'CREATE_FOLDER') {
      const folder = await db.smartFolder.create({
        data: { name: payload.name || 'New Folder', userId }
      })
      return NextResponse.json({ data: folder, success: true })
    }
    
    if (action === 'RENAME_FOLDER') {
      const result = await db.smartFolder.updateMany({
        where: { id: payload.id, userId },
        data: { name: payload.name }
      })
      if (result.count === 0) {
        return NextResponse.json({ error: 'Folder not found', success: false }, { status: 404 })
      }
      const folder = await db.smartFolder.findUnique({ where: { id: payload.id } })
      return NextResponse.json({ data: folder, success: true })
    }

    // 2. SUBFOLDERS
    if (action === 'CREATE_SUBFOLDER') {
      const subfolder = await db.smartSubfolder.create({
        data: { name: payload.name || 'New Subfolder', folderId: payload.folderId, userId }
      })
      return NextResponse.json({ data: subfolder, success: true })
    }

    if (action === 'RENAME_SUBFOLDER') {
      const result = await db.smartSubfolder.updateMany({
        where: { id: payload.id, userId },
        data: { name: payload.name }
      })
      if (result.count === 0) {
        return NextResponse.json({ error: 'Subfolder not found', success: false }, { status: 404 })
      }
      const subfolder = await db.smartSubfolder.findUnique({ where: { id: payload.id } })
      return NextResponse.json({ data: subfolder, success: true })
    }
    
    if (action === 'MOVE_SUBFOLDER') {
      const result = await db.smartSubfolder.updateMany({
        where: { id: payload.id, userId },
        data: { folderId: payload.folderId }
      })
      if (result.count === 0) {
        return NextResponse.json({ error: 'Subfolder not found', success: false }, { status: 404 })
      }
      const subfolder = await db.smartSubfolder.findUnique({ where: { id: payload.id } })
      return NextResponse.json({ data: subfolder, success: true })
    }

    // 3. NOTES
    if (action === 'CREATE_NOTE') {
      const note = await createSmartNote({
        title: payload.title,
        content: payload.content,
        subfolderId: payload.subfolderId,
        userId,
        tags: payload.tags ? JSON.parse(payload.tags) : [],
        isPinned: payload.isPinned
      })

      return NextResponse.json({ data: note, success: true })
    }

    if (action === 'MOVE_NOTE') {
      const result = await db.smartNote.updateMany({
        where: { id: payload.id, userId },
        data: { subfolderId: payload.subfolderId }
      })
      if (result.count === 0) {
        return NextResponse.json({ error: 'Note not found', success: false }, { status: 404 })
      }
      const note = await db.smartNote.findUnique({ where: { id: payload.id } })
      return NextResponse.json({ data: note, success: true })
    }

    if (action === 'UPDATE_NOTE') {
      const note = await updateSmartNote({
        noteId: payload.id,
        userId,
        title: payload.title,
        content: payload.content,
        tags: payload.tags ? JSON.parse(payload.tags) : undefined,
        isPinned: payload.isPinned
      })

      return NextResponse.json({ data: note, success: true })
    }

    return NextResponse.json({ error: 'Invalid action provided', success: false }, { status: 400 })

  } catch (error: any) {
    console.error('Failed to process smart note action:', error)
    return NextResponse.json({ error: error?.message || 'Failed to process', success: false }, { status: 500 })
  }
}

// Delete Route (Handles Cascading Folders, Subfolders, and Notes)
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'folder' | 'subfolder' | 'note'
    const id = searchParams.get('id')
    
    if (!id || !type) return NextResponse.json({ error: 'ID and type required', success: false }, { status: 400 })

    if (type === 'folder') {
      const result = await db.smartFolder.deleteMany({ where: { id, userId } })
      if (result.count === 0) {
        return NextResponse.json({ error: 'Folder not found', success: false }, { status: 404 })
      }
    } else if (type === 'subfolder') {
      const result = await db.smartSubfolder.deleteMany({ where: { id, userId } })
      if (result.count === 0) {
        return NextResponse.json({ error: 'Subfolder not found', success: false }, { status: 404 })
      }
    } else if (type === 'note') {
      const result = await db.smartNote.deleteMany({ where: { id, userId } })
      if (result.count === 0) {
        return NextResponse.json({ error: 'Note not found', success: false }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid type provided', success: false }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete entity:', error)
    return NextResponse.json({ error: 'Failed to delete entity', success: false }, { status: 500 })
  }
}
