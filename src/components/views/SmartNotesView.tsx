'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Folder, FileText, Plus, Search, Tag as TagIcon, Trash2, Pin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface SmartFolder {
  id: string
  name: string
  subfolders: SmartSubfolder[]
}

export interface SmartSubfolder {
  id: string
  name: string
  folderId: string
  notes: SmartNote[]
}

export interface SmartNote {
  id: string
  title: string
  content: string
  subfolderId: string
  updatedAt: string
  tags: string
  isPinned: boolean
  aiSummary?: string | null
  aiKeyPoints?: string | null
}

function safeParseStringArray(raw: unknown): string[] {
  try {
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(v)) return []
    return v.filter((x) => typeof x === 'string')
  } catch {
    return []
  }
}

function toTagsInput(tags: string): string {
  const parsed = safeParseStringArray(tags)
  return parsed.join(', ')
}

export function SmartNotesView() {
  const [folders, setFolders] = useState<SmartFolder[]>([])
  const [notes, setNotes] = useState<SmartNote[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedSubfolderId, setSelectedSubfolderId] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  const [noteSearchQuery, setNoteSearchQuery] = useState('')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [tagsDraft, setTagsDraft] = useState('')
  const [newSubfolderName, setNewSubfolderName] = useState('')
  const [addingSubfolder, setAddingSubfolder] = useState(false)

  const [isTyping, setIsTyping] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const typeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = async () => {
    setErrorMsg(null)
    try {
      const res = await fetch('/api/smart-notes')
      const data = await res.json()
      if (!data.success) {
        setErrorMsg(data.error || 'Failed to load Smart Notes')
        return
      }

      const nextFolders: SmartFolder[] = data.folders
      const allNotes: SmartNote[] = nextFolders.flatMap((f) => f.subfolders.flatMap((s) => s.notes))

      setFolders(nextFolders)
      setNotes(allNotes)

      // Reset selection; effects below will select defaults.
      setSelectedFolderId(null)
      setSelectedSubfolderId(null)
      setSelectedNoteId(null)
      setTagsDraft('')
      setPinnedOnly(false)
      setNoteSearchQuery('')
      setAddingSubfolder(false)
      setNewSubfolderName('')
    } catch (e: any) {
      console.error(e)
      setErrorMsg(e?.message ? String(e.message) : 'Failed to load Smart Notes')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (folders.length === 0) return
    if (!selectedFolderId) {
      const firstFolder = folders[0]
      setSelectedFolderId(firstFolder.id)
      setSelectedSubfolderId(firstFolder.subfolders[0]?.id ?? null)
    }
  }, [folders, selectedFolderId])

  useEffect(() => {
    if (!selectedSubfolderId) {
      setSelectedNoteId(null)
      setTagsDraft('')
      return
    }
    setSelectedNoteId(null)
    setTagsDraft('')
  }, [selectedSubfolderId])

  const selectedFolder = useMemo(() => {
    if (!selectedFolderId) return null
    return folders.find((f) => f.id === selectedFolderId) ?? null
  }, [folders, selectedFolderId])

  const visibleSubfolders = selectedFolder?.subfolders ?? []

  useEffect(() => {
    if (!selectedNoteId) return
    const selected = notes.find((n) => n.id === selectedNoteId)
    if (!selected) {
      setTagsDraft('')
      return
    }
    setTagsDraft(toTagsInput(selected.tags))
  }, [notes, selectedNoteId])

  const selectedNote = selectedNoteId ? notes.find((n) => n.id === selectedNoteId) : undefined

  const visibleNotes = useMemo(() => {
    if (!selectedSubfolderId) return []
    const q = noteSearchQuery.trim().toLowerCase()

    return notes
      .filter((n) => n.subfolderId === selectedSubfolderId)
      .filter((n) => (pinnedOnly ? n.isPinned : true))
      .filter((n) => {
        if (!q) return true
        const ai = (n.aiSummary || '').toLowerCase()
        return (
          (n.title || '').toLowerCase().includes(q) ||
          (n.content || '').toLowerCase().includes(q) ||
          ai.includes(q)
        )
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [notes, pinnedOnly, noteSearchQuery, selectedSubfolderId])

  const handleSubfolderClick = (folderId: string, subfolderId: string) => {
    setSelectedFolderId(folderId)
    setSelectedSubfolderId(subfolderId)
    setSelectedNoteId(null)
    setTagsDraft('')
  }

  const handleEditorChange = async (title: string, content: string) => {
    setErrorMsg(null)
    setIsTyping(true)

    if (typeTimeoutRef.current) clearTimeout(typeTimeoutRef.current)
    if (!selectedSubfolderId) return

    if (!selectedNoteId) {
      const tempId = 'temp-' + Date.now()
      const newNote: SmartNote = {
        id: tempId,
        title: title || 'Untitled Note',
        content,
        subfolderId: selectedSubfolderId,
        updatedAt: new Date().toISOString(),
        tags: JSON.stringify([]),
        isPinned: false,
        aiSummary: null,
        aiKeyPoints: JSON.stringify([])
      }

      setNotes((prev) => [newNote, ...prev])
      setSelectedNoteId(tempId)

      try {
        const res = await fetch('/api/smart-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CREATE_NOTE',
            payload: {
              title: title || 'Untitled Note',
              content,
              subfolderId: selectedSubfolderId,
              tags: '[]'
            }
          })
        })
        const data = await res.json()
        if (data.success) {
          setNotes((prev) => prev.map((n) => (n.id === tempId ? data.data : n)))
          setSelectedNoteId(data.data.id)
        } else {
          setErrorMsg(data.error || 'Failed to create note')
        }
      } catch (e: any) {
        setErrorMsg(e?.message ? String(e.message) : 'Failed to create note')
      } finally {
        setIsTyping(false)
      }
    } else {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNoteId
            ? {
                ...n,
                title,
                content,
                updatedAt: new Date().toISOString()
              }
            : n
        )
      )

      typeTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch('/api/smart-notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'UPDATE_NOTE',
              payload: { id: selectedNoteId, title, content, subfolderId: selectedSubfolderId }
            })
          })
          const data = await res.json()
          if (!data.success) {
            setErrorMsg(data.error || 'Failed to update note')
          }
        } catch (e: any) {
          setErrorMsg(e?.message ? String(e.message) : 'Failed to update note')
        } finally {
          setIsTyping(false)
        }
      }, 1000)
    }
  }

  const handleDeleteSubfolder = async (id: string) => {
    setErrorMsg(null)
    await fetch(`/api/smart-notes?id=${id}&type=subfolder`, { method: 'DELETE' })
    if (selectedSubfolderId === id) {
      setSelectedSubfolderId(null)
      setSelectedNoteId(null)
      setTagsDraft('')
    }
    fetchData()
  }

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setErrorMsg(null)
    await fetch(`/api/smart-notes?id=${id}&type=note`, { method: 'DELETE' })
    if (selectedNoteId === id) setSelectedNoteId(null)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const handleTogglePinned = async (nextPinned: boolean) => {
    if (!selectedNoteId) return
    setErrorMsg(null)
    setIsTyping(true)
    try {
      const res = await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_NOTE',
          payload: { id: selectedNoteId, isPinned: nextPinned }
        })
      })
      const data = await res.json()
      if (!data.success) {
        setErrorMsg(data.error || 'Failed to update pinned state')
      } else {
        setNotes((prev) => prev.map((n) => (n.id === selectedNoteId ? { ...n, isPinned: nextPinned } : n)))
      }
    } catch (e: any) {
      setErrorMsg(e?.message ? String(e.message) : 'Failed to update pinned state')
    } finally {
      setIsTyping(false)
    }
  }

  const handleSaveTags = async () => {
    if (!selectedNoteId) return
    setErrorMsg(null)
    setIsTyping(true)

    const tags = tagsDraft
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20)

    try {
      const res = await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_NOTE',
          payload: { id: selectedNoteId, tags: JSON.stringify(tags) }
        })
      })
      const data = await res.json()
      if (!data.success) {
        setErrorMsg(data.error || 'Failed to save tags')
      } else {
        setNotes((prev) => prev.map((n) => (n.id === selectedNoteId ? { ...n, tags: JSON.stringify(tags) } : n)))
      }
    } catch (e: any) {
      setErrorMsg(e?.message ? String(e.message) : 'Failed to save tags')
    } finally {
      setIsTyping(false)
    }
  }

  const handleCreateSubfolder = async () => {
    if (!selectedFolderId) return
    const name = newSubfolderName.trim()
    if (!name) return
    setErrorMsg(null)
    try {
      const res = await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_SUBFOLDER',
          payload: { name, folderId: selectedFolderId }
        })
      })
      const data = await res.json()
      if (!data.success) {
        setErrorMsg(data.error || 'Failed to create subfolder')
        return
      }
      setAddingSubfolder(false)
      setNewSubfolderName('')
      await fetchData()
    } catch (e: any) {
      setErrorMsg(e?.message ? String(e.message) : 'Failed to create subfolder')
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-black/90 text-white overflow-hidden">
      {/* Left: Folders -> Subfolders */}
      <div className="w-64 border-r border-[#333] flex flex-col bg-zinc-950">
        <div className="p-4 border-b border-[#333] flex items-center justify-between">
          <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
            <Folder size={16} className="text-blue-400" /> Smart Notes
          </h2>
        </div>

        <ScrollArea className="flex-1 p-2">
          {folders.map((folder) => {
            const isActiveFolder = folder.id === selectedFolderId
            return (
              <div key={folder.id} className="mb-2">
                <button
                  onClick={() => {
                    setSelectedFolderId(folder.id)
                    setSelectedSubfolderId(folder.subfolders[0]?.id ?? null)
                    setSelectedNoteId(null)
                  }}
                  className={`w-full text-left px-2 py-2 rounded-md text-sm transition-colors ${
                    isActiveFolder ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  {folder.name}
                </button>

                {isActiveFolder && (
                  <div className="mt-1 space-y-1">
                    {folder.subfolders.map((sub) => (
                      <div key={sub.id} className="group flex items-center justify-between px-2">
                        <button
                          onClick={() => handleSubfolderClick(folder.id, sub.id)}
                          className={`flex-1 text-left p-2 rounded-md text-sm transition-colors ${
                            selectedSubfolderId === sub.id
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'
                          }`}
                        >
                          {sub.name}
                        </button>
                        <button
                          onClick={() => handleDeleteSubfolder(sub.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-400/20 rounded"
                          aria-label={`Delete subfolder ${sub.name}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}

                    {selectedFolderId === folder.id && (
                      <div className="px-2 pt-2">
                        {!addingSubfolder ? (
                          <button
                            onClick={() => setAddingSubfolder(true)}
                            className="w-full text-left text-xs text-zinc-300 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors flex items-center gap-2"
                          >
                            <Plus size={14} className="text-blue-400" /> Add subfolder
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Subfolder name"
                              value={newSubfolderName}
                              onChange={(e) => setNewSubfolderName(e.target.value)}
                              className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleCreateSubfolder}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={!newSubfolderName.trim()}
                              >
                                Create
                              </Button>
                              <Button
                                onClick={() => {
                                  setAddingSubfolder(false)
                                  setNewSubfolderName('')
                                }}
                                size="sm"
                                variant="outline"
                                className="border-zinc-700 text-zinc-200 hover:bg-white/5"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </ScrollArea>
      </div>

      {/* Middle: Notes list + search */}
      <div className="w-80 border-r border-[#333] flex flex-col bg-zinc-900/50">
        <div className="p-4 border-b border-[#333]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-zinc-100">Notes</h2>
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pinnedOnly}
                onChange={(e) => setPinnedOnly(e.target.checked)}
              />
              Pinned
            </label>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Search size={14} className="text-zinc-500" />
            <input
              type="text"
              value={noteSearchQuery}
              onChange={(e) => setNoteSearchQuery(e.target.value)}
              placeholder="Search title/content/summary..."
              className="w-full bg-zinc-950/30 border border-zinc-800 text-zinc-100 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {!selectedSubfolderId && (
            <p className="text-xs text-zinc-500 mt-2">Select a subfolder to view notes</p>
          )}
        </div>

        <ScrollArea className="flex-1 p-2">
          {visibleNotes.length === 0 && selectedSubfolderId ? (
            <p className="text-xs text-zinc-500 text-center py-6">No matching notes</p>
          ) : (
            visibleNotes.map((note) => {
              const tags = safeParseStringArray(note.tags)
              const preview = note.aiSummary || note.content || ''
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`p-3 mb-2 rounded-lg cursor-pointer border transition-all ${
                    selectedNoteId === note.id
                      ? 'bg-zinc-800 border-zinc-600'
                      : 'bg-transparent border-transparent hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {note.isPinned && <Pin size={14} className="text-amber-300" />}
                        <h3 className="font-medium text-sm text-zinc-200 truncate">
                          {note.title || 'Untitled Note'}
                        </h3>
                      </div>
                      {tags.length > 0 && (
                        <p className="text-[11px] text-zinc-500 mt-1 truncate">
                          {tags.slice(0, 3).map((t) => `#${t}`).join(' ')}
                          {tags.length > 3 ? '…' : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="text-red-400/50 hover:text-red-400"
                      aria-label={`Delete note ${note.title}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                    {preview ? preview : 'No content...'}
                  </p>
                </div>
              )
            })
          )}
        </ScrollArea>
      </div>

      {/* Right: Editor */}
      <div className="flex-1 flex flex-col bg-zinc-950">
        {!selectedSubfolderId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
            <FileText size={48} className="mb-4 opacity-50" />
            <p>Select a subfolder to start typing</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-6 max-w-3xl mx-auto w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">
                {isTyping ? 'Saving changes...' : 'AI summaries update in the background.'}
              </span>
              {errorMsg && <span className="text-xs text-red-400">{errorMsg}</span>}
            </div>

            <input
              type="text"
              placeholder="Note Title"
              value={selectedNote?.title || ''}
              onChange={(e) => handleEditorChange(e.target.value, selectedNote?.content || '')}
              className="bg-transparent border-none text-3xl font-bold focus:outline-none focus:ring-0 text-white placeholder-zinc-700 mb-4 px-0"
            />

            <textarea
              placeholder="Start typing..."
              value={selectedNote?.content || ''}
              onChange={(e) => handleEditorChange(selectedNote?.title || '', e.target.value)}
              className="flex-1 bg-transparent border-none text-zinc-300 resize-none focus:outline-none focus:ring-0 px-0 text-lg leading-relaxed placeholder-zinc-700"
            />

            {/* Meta: pinned + tags + AI summary */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-zinc-200 cursor-pointer select-none">
                  <Pin size={14} className="text-amber-300" />
                  <input
                    type="checkbox"
                    checked={selectedNote?.isPinned ?? false}
                    disabled={!selectedNoteId}
                    onChange={(e) => handleTogglePinned(e.target.checked)}
                  />
                  Pin note
                </label>
              </div>

              <div className="flex items-center gap-2">
                <TagIcon size={14} className="text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tags (comma-separated) e.g. work, idea, finance"
                  value={tagsDraft}
                  disabled={!selectedNoteId}
                  onChange={(e) => setTagsDraft(e.target.value)}
                  onBlur={() => {
                    if (selectedNoteId) void handleSaveTags()
                  }}
                  className="flex-1 bg-zinc-900/30 border border-zinc-800 text-zinc-100 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
                <Button
                  size="sm"
                  disabled={!selectedNoteId}
                  onClick={() => void handleSaveTags()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save tags
                </Button>
              </div>

              {selectedNote?.aiSummary && selectedNote.aiSummary.trim() !== '' && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                  <p className="text-xs text-blue-300 font-semibold mb-2">AI Summary</p>
                  <p className="text-sm text-zinc-100 whitespace-pre-wrap">{selectedNote.aiSummary}</p>
                  {selectedNote.aiKeyPoints && (
                    <div className="mt-3">
                      <p className="text-xs text-zinc-300 font-semibold mb-2">Key points</p>
                      {safeParseStringArray(selectedNote.aiKeyPoints).length > 0 ? (
                        <ul className="text-sm text-zinc-100 list-disc pl-5">
                          {safeParseStringArray(selectedNote.aiKeyPoints).slice(0, 6).map((k) => (
                            <li key={k} className="mb-1">
                              {k}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-zinc-500">Key points will appear after AI enrichment.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
