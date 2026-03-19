'use client'

import { create } from 'zustand'
import { readSmartNotesSnapshot, writeSmartNotesSnapshot } from '@/lib/indexeddb-smart-notes'

export type SmartNote = {
  id: string
  title: string
  content: string
  subfolderId: string
  tags: string
  isPinned: boolean
  aiSummary?: string | null
  aiKeyPoints?: string | null
  updatedAt: string
}

export type SmartSubfolder = {
  id: string
  name: string
  folderId: string
  notes: SmartNote[]
  createdAt?: string
  updatedAt?: string
}

export type SmartFolder = {
  id: string
  name: string
  subfolders: SmartSubfolder[]
  createdAt?: string
  updatedAt?: string
}

type SmartNotesState = {
  folders: SmartFolder[]
  selectedFolderId: string | null
  selectedSubfolderId: string | null
  selectedNoteId: string | null
  searchQuery: string
  isLoading: boolean
  isSaving: boolean
  error: string | null
  hydratedFromCache: boolean
  isOfflineMode: boolean

  initialize: () => Promise<void>
  refresh: () => Promise<void>

  setSearchQuery: (q: string) => void
  setSelectedFolder: (id: string | null) => void
  setSelectedSubfolder: (id: string | null) => void
  setSelectedNote: (id: string | null) => void

  createFolder: (name: string) => Promise<void>
  renameFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>

  createSubfolder: (folderId: string, name: string) => Promise<void>
  renameSubfolder: (id: string, name: string) => Promise<void>
  moveSubfolder: (id: string, folderId: string) => Promise<void>
  deleteSubfolder: (id: string) => Promise<void>

  createNote: (subfolderId: string) => Promise<string | null>
  updateNote: (id: string, patch: Partial<Pick<SmartNote, 'title' | 'content' | 'isPinned'>>) => Promise<void>
  updateNoteTags: (id: string, tags: string[]) => Promise<void>
  moveNote: (id: string, subfolderId: string) => Promise<void>
  deleteNote: (id: string) => Promise<void>
}

async function parseApiJsonSafe(res: Response): Promise<any> {
  const raw = await res.text()
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useSmartNotesStore = create<SmartNotesState>((set, get) => ({
  folders: [],
  selectedFolderId: null,
  selectedSubfolderId: null,
  selectedNoteId: null,
  searchQuery: '',
  isLoading: true,
  isSaving: false,
  error: null,
  hydratedFromCache: false,
  isOfflineMode: false,

  initialize: async () => {
    set({ isLoading: true, error: null })
    const cached = await readSmartNotesSnapshot()
    if (cached?.folders?.length) {
      set({ folders: cached.folders as SmartFolder[], hydratedFromCache: true, isLoading: false })
      const firstFolder = (cached.folders as SmartFolder[])[0]
      if (firstFolder) {
        set({
          selectedFolderId: firstFolder.id,
          selectedSubfolderId: firstFolder.subfolders[0]?.id ?? null
        })
      }
    }
    await get().refresh()
  },

  refresh: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/smart-notes')
      const data = await parseApiJsonSafe(res)
      if (!res.ok || !data?.success) {
        const currentFolders = get().folders
        if (currentFolders.length === 0) {
          const localFolders: SmartFolder[] = [
            {
              id: 'local-folder-1',
              name: 'Local Notes',
              subfolders: [
                {
                  id: 'local-subfolder-1',
                  name: 'General',
                  folderId: 'local-folder-1',
                  notes: [],
                },
              ],
            },
          ]
          set({
            folders: localFolders,
            selectedFolderId: localFolders[0].id,
            selectedSubfolderId: localFolders[0].subfolders[0].id,
            selectedNoteId: null,
            isOfflineMode: true,
            error: (data?.error || `Smart Notes request failed (${res.status})`) + ' — using offline mode',
            isLoading: false,
          })
          await writeSmartNotesSnapshot(localFolders)
          return
        }
        set({
          error: (data?.error || `Smart Notes request failed (${res.status})`) + ' — using offline mode',
          isOfflineMode: true,
          isLoading: false,
        })
        return
      }
      const folders = (data.folders || []) as SmartFolder[]
      set((state) => {
        const selectedFolderId = state.selectedFolderId || folders[0]?.id || null
        const selectedFolder = folders.find((f) => f.id === selectedFolderId)
        const selectedSubfolderId = state.selectedSubfolderId || selectedFolder?.subfolders[0]?.id || null
        return { folders, selectedFolderId, selectedSubfolderId, isLoading: false, error: null, isOfflineMode: false }
      })
      await writeSmartNotesSnapshot(folders)
    } catch (e: any) {
      set({ error: (e?.message ? String(e.message) : 'Failed to load Smart Notes') + ' — using offline mode', isLoading: false, isOfflineMode: true })
    }
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedFolder: (id) => set({ selectedFolderId: id }),
  setSelectedSubfolder: (id) => set({ selectedSubfolderId: id }),
  setSelectedNote: (id) => set({ selectedNoteId: id }),

  createFolder: async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (get().isOfflineMode) {
      const id = `local-folder-${Date.now()}`
      set((s) => ({
        folders: [
          ...s.folders,
          { id, name: trimmed, subfolders: [] },
        ],
        selectedFolderId: id,
      }))
      await writeSmartNotesSnapshot(get().folders)
      return
    }
    set({ isSaving: true, error: null })
    try {
      const res = await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_FOLDER', payload: { name: trimmed } })
      })
      const data = await parseApiJsonSafe(res)
      if (!res.ok || !data?.success) {
        set({ error: data?.error || 'Failed to create folder' })
      }
    } finally {
      set({ isSaving: false })
      await get().refresh()
    }
  },

  renameFolder: async (id, name) => {
    set({ isSaving: true, error: null })
    try {
      await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RENAME_FOLDER', payload: { id, name } })
      })
    } finally {
      set({ isSaving: false })
      await get().refresh()
    }
  },

  deleteFolder: async (id) => {
    set({ isSaving: true, error: null })
    try {
      await fetch(`/api/smart-notes?id=${id}&type=folder`, { method: 'DELETE' })
      set((s) => ({
        selectedFolderId: s.selectedFolderId === id ? null : s.selectedFolderId,
        selectedSubfolderId: null,
        selectedNoteId: null
      }))
    } finally {
      set({ isSaving: false })
      await get().refresh()
    }
  },

  createSubfolder: async (folderId, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (get().isOfflineMode) {
      const subId = `local-subfolder-${Date.now()}`
      set((s) => ({
        folders: s.folders.map((f) =>
          f.id === folderId
            ? {
                ...f,
                subfolders: [
                  ...f.subfolders,
                  { id: subId, name: trimmed, folderId, notes: [] },
                ],
              }
            : f
        ),
        selectedFolderId: folderId,
        selectedSubfolderId: subId,
      }))
      await writeSmartNotesSnapshot(get().folders)
      return
    }
    set({ isSaving: true, error: null })
    try {
      await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_SUBFOLDER', payload: { folderId, name: trimmed } })
      })
    } finally {
      set({ isSaving: false })
      await get().refresh()
    }
  },

  renameSubfolder: async (id, name) => {
    set({ isSaving: true, error: null })
    try {
      await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RENAME_SUBFOLDER', payload: { id, name } })
      })
    } finally {
      set({ isSaving: false })
      await get().refresh()
    }
  },

  moveSubfolder: async (id, folderId) => {
    set({ isSaving: true, error: null })
    try {
      await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MOVE_SUBFOLDER', payload: { id, folderId } })
      })
    } finally {
      set({ isSaving: false })
      await get().refresh()
    }
  },

  deleteSubfolder: async (id) => {
    set({ isSaving: true, error: null })
    try {
      await fetch(`/api/smart-notes?id=${id}&type=subfolder`, { method: 'DELETE' })
      set((s) => ({
        selectedSubfolderId: s.selectedSubfolderId === id ? null : s.selectedSubfolderId,
        selectedNoteId: null
      }))
    } finally {
      set({ isSaving: false })
      await get().refresh()
    }
  },

  createNote: async (subfolderId) => {
    if (get().isOfflineMode) {
      const noteId = `local-note-${Date.now()}`
      const now = new Date().toISOString()
      set((s) => ({
        folders: s.folders.map((f) => ({
          ...f,
          subfolders: f.subfolders.map((sub) =>
            sub.id === subfolderId
              ? {
                  ...sub,
                  notes: [
                    {
                      id: noteId,
                      title: 'Untitled',
                      content: '',
                      subfolderId,
                      tags: '[]',
                      isPinned: false,
                      updatedAt: now,
                    },
                    ...sub.notes,
                  ],
                }
              : sub
          ),
        })),
        selectedNoteId: noteId,
        selectedSubfolderId: subfolderId,
      }))
      await writeSmartNotesSnapshot(get().folders)
      return noteId
    }
    set({ isSaving: true, error: null })
    try {
      const res = await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_NOTE',
          payload: {
            title: 'Untitled',
            content: '',
            subfolderId,
            tags: '[]'
          }
        })
      })
      const data = await parseApiJsonSafe(res)
      if (!res.ok || !data?.success) {
        set({ error: data?.error || 'Failed to create note' })
        return null
      }
      set({ selectedNoteId: data.data.id, selectedSubfolderId: subfolderId })
      return data.data.id as string
    } finally {
      set({ isSaving: false })
      await get().refresh()
    }
  },

  updateNote: async (id, patch) => {
    if (get().isOfflineMode) {
      const now = new Date().toISOString()
      set((s) => ({
        folders: s.folders.map((f) => ({
          ...f,
          subfolders: f.subfolders.map((sub) => ({
            ...sub,
            notes: sub.notes.map((n) =>
              n.id === id
                ? {
                    ...n,
                    title: patch.title ?? n.title,
                    content: patch.content ?? n.content,
                    isPinned: patch.isPinned ?? n.isPinned,
                    updatedAt: now,
                  }
                : n
            ),
          })),
        })),
      }))
      await writeSmartNotesSnapshot(get().folders)
      return
    }
    set({ isSaving: true, error: null })
    try {
      const state = get()
      const note = flattenNotes(state.folders).find((n) => n.id === id)
      if (!note) return
      await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_NOTE',
          payload: {
            id,
            title: patch.title ?? note.title,
            content: patch.content ?? note.content,
            isPinned: patch.isPinned ?? note.isPinned
          }
        })
      })
    } finally {
      set({ isSaving: false })
      await get().refresh()
    }
  },

  updateNoteTags: async (id, tags) => {
    if (get().isOfflineMode) {
      const now = new Date().toISOString()
      set((s) => ({
        folders: s.folders.map((f) => ({
          ...f,
          subfolders: f.subfolders.map((sub) => ({
            ...sub,
            notes: sub.notes.map((n) =>
              n.id === id ? { ...n, tags: JSON.stringify(tags), updatedAt: now } : n
            ),
          })),
        })),
      }))
      await writeSmartNotesSnapshot(get().folders)
      return
    }
    set({ isSaving: true, error: null })
    try {
      await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_NOTE',
          payload: { id, tags: JSON.stringify(tags) }
        })
      })
    } finally {
      set({ isSaving: false })
      await get().refresh()
    }
  },

  moveNote: async (id, subfolderId) => {
    if (get().isOfflineMode) {
      const s = get()
      const all = flattenNotes(s.folders)
      const note = all.find((n) => n.id === id)
      if (!note) return
      const now = new Date().toISOString()
      set((state) => ({
        folders: state.folders.map((f) => ({
          ...f,
          subfolders: f.subfolders.map((sub) => {
            if (sub.id === note.subfolderId) {
              return { ...sub, notes: sub.notes.filter((n) => n.id !== id) }
            }
            if (sub.id === subfolderId) {
              return {
                ...sub,
                notes: [{ ...note, subfolderId, updatedAt: now }, ...sub.notes],
              }
            }
            return sub
          }),
        })),
        selectedSubfolderId: subfolderId,
      }))
      await writeSmartNotesSnapshot(get().folders)
      return
    }
    set({ isSaving: true, error: null })
    try {
      await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MOVE_NOTE', payload: { id, subfolderId } })
      })
    } finally {
      set({ isSaving: false })
      await get().refresh()
    }
  },

  deleteNote: async (id) => {
    if (get().isOfflineMode) {
      set((s) => ({
        folders: s.folders.map((f) => ({
          ...f,
          subfolders: f.subfolders.map((sub) => ({
            ...sub,
            notes: sub.notes.filter((n) => n.id !== id),
          })),
        })),
        selectedNoteId: s.selectedNoteId === id ? null : s.selectedNoteId,
      }))
      await writeSmartNotesSnapshot(get().folders)
      return
    }
    set({ isSaving: true, error: null })
    try {
      await fetch(`/api/smart-notes?id=${id}&type=note`, { method: 'DELETE' })
      set((s) => ({ selectedNoteId: s.selectedNoteId === id ? null : s.selectedNoteId }))
    } finally {
      set({ isSaving: false })
      await get().refresh()
    }
  }
}))

export function flattenNotes(folders: SmartFolder[]): SmartNote[] {
  return folders.flatMap((f) => f.subfolders.flatMap((s) => s.notes))
}

export function getSubfolderDerived(subfolder: SmartSubfolder) {
  const notes = subfolder.notes || []
  const noteCount = notes.length
  if (noteCount === 0) {
    return { noteCount, lastModified: subfolder.updatedAt || null, preview: '' }
  }
  const sorted = [...notes].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  const latest = sorted[0]
  const preview = (latest.aiSummary || latest.content || '').slice(0, 140)
  return {
    noteCount,
    lastModified: latest.updatedAt,
    preview
  }
}

export function getFolderDerived(folder: SmartFolder) {
  const notes = flattenNotes([folder])
  const totalNotes = notes.length
  if (totalNotes === 0) {
    return { totalNotes, lastModified: folder.updatedAt || null, preview: '' }
  }
  const sorted = [...notes].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  const latest = sorted[0]
  const preview = (latest.aiSummary || latest.content || '').slice(0, 140)
  return {
    totalNotes,
    lastModified: latest.updatedAt,
    preview
  }
}

