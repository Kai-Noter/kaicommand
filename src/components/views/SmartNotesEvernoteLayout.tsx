'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Folder, FileText, Search, Tag as TagIcon, Trash2, Pin, Plus } from 'lucide-react'

type SmartFolder = {
  id: string
  name: string
  subfolders: SmartSubfolder[]
}

type SmartSubfolder = {
  id: string
  name: string
  folderId: string
  notes: SmartNote[]
}

type SmartNote = {
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

type NotesView = 'all' | 'pinned' | 'ai'

function safeParseStringArray(raw: unknown): string[] {
  try {
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(v)) return []
    return v.filter((x) => typeof x === 'string')
  } catch {
    return []
  }
}

function getRecencyBucket(updatedAtIso: string): 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Previous 30 Days' | 'Earlier' {
  const d = new Date(updatedAtIso)
  const now = new Date()
  const ms = now.getTime() - d.getTime()
  const day = 24 * 60 * 60 * 1000
  if (ms < day) return 'Today'
  if (ms < 2 * day) return 'Yesterday'
  if (ms < 7 * day) return 'Previous 7 Days'
  if (ms < 30 * day) return 'Previous 30 Days'
  return 'Earlier'
}

export function SmartNotesEvernoteLayout() {
  const [folders, setFolders] = useState<SmartFolder[]>([])
  const [notes, setNotes] = useState<SmartNote[]>([])

  const [activeView, setActiveView] = useState<NotesView>('all')
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [selectedSubfolderId, setSelectedSubfolderId] = useState<string | null>(null)

  const [titleDraft, setTitleDraft] = useState('')
  const [contentDraft, setContentDraft] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [tagsDraft, setTagsDraft] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchData = async () => {
    setErrorMsg(null)
    try {
      const res = await fetch('/api/smart-notes')
      const data = await res.json()
      if (!data.success) {
        setErrorMsg(data.error || 'Failed to load Smart Notes')
        return
      }

      setFolders(data.folders)
      const allNotes = data.folders.flatMap((f: SmartFolder) => f.subfolders.flatMap((s: SmartSubfolder) => s.notes))
      setNotes(allNotes)
    } catch (e: any) {
      console.error(e)
      setErrorMsg(e?.message ? String(e.message) : 'Failed to load Smart Notes')
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  // Keep selection consistent when data changes
  useEffect(() => {
    if (selectedNoteId) {
      const n = notes.find((x) => x.id === selectedNoteId)
      if (n) {
        setSelectedSubfolderId(n.subfolderId)
        setTitleDraft(n.title)
        setContentDraft(n.content)
        setTagsDraft(safeParseStringArray(n.tags).join(', '))
      }
    } else if (notes.length > 0) {
      // Default selection: newest note
      const newest = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      setSelectedNoteId(newest.id)
      setSelectedSubfolderId(newest.subfolderId)
      setTitleDraft(newest.title)
      setContentDraft(newest.content)
      setTagsDraft(safeParseStringArray(newest.tags).join(', '))
    }
  }, [notes])

  const allSubfolderIds = useMemo(() => new Set(folders.flatMap((f) => f.subfolders.map((s) => s.id))), [folders])

  const folderToSubfolderIds = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const f of folders) m.set(f.id, f.subfolders.map((s) => s.id))
    return m
  }, [folders])

  const defaultSubfolderId = useMemo(() => {
    if (selectedSubfolderId) return selectedSubfolderId
    if (folders.length === 0) return null
    return folders[0]?.subfolders?.[0]?.id ?? null
  }, [folders, selectedSubfolderId])

  const selectedNote = selectedNoteId ? notes.find((n) => n.id === selectedNoteId) : undefined

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const n of notes) {
      for (const t of safeParseStringArray(n.tags)) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    return counts
  }, [notes])

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const matchesQuery = (n: SmartNote) => {
      if (!q) return true
      const tags = safeParseStringArray(n.tags).join(' ').toLowerCase()
      const ai = (n.aiSummary || '').toLowerCase()
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        ai.includes(q) ||
        tags.includes(q)
      )
    }

    return notes
      .filter((n) => {
        if (activeView === 'pinned') return n.isPinned
        if (activeView === 'ai') return !!n.aiSummary && n.aiSummary.trim().length > 0
        return true
      })
      .filter((n) => {
        if (!activeFolderId) return true
        const allowed = folderToSubfolderIds.get(activeFolderId) ?? []
        return allowed.includes(n.subfolderId)
      })
      .filter((n) => {
        if (!activeTag) return true
        return safeParseStringArray(n.tags).includes(activeTag)
      })
      .filter(matchesQuery)
  }, [notes, searchQuery, activeView, activeFolderId, activeTag, folderToSubfolderIds])

  const groupedNotes = useMemo(() => {
    const buckets: Record<string, SmartNote[]> = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      Earlier: []
    }
    for (const n of filteredNotes) {
      buckets[getRecencyBucket(n.updatedAt)].push(n)
    }
    // Within bucket: newest first
    for (const k of Object.keys(buckets)) {
      buckets[k].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    }
    return buckets
  }, [filteredNotes])

  const handleSelectNote = (id: string) => {
    const n = notes.find((x) => x.id === id)
    if (!n) return
    setSelectedNoteId(id)
    setSelectedSubfolderId(n.subfolderId)
    setTitleDraft(n.title)
    setContentDraft(n.content)
    setTagsDraft(safeParseStringArray(n.tags).join(', '))
  }

  const persistTitleContent = async (payload: { id: string; title: string; content: string; subfolderId: string | null }) => {
    setErrorMsg(null)
    setIsSaving(true)
    try {
      const res = await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_NOTE',
          payload: {
            id: payload.id,
            title: payload.title,
            content: payload.content,
            subfolderId: payload.subfolderId
          }
        })
      })
      const data = await res.json()
      if (!data.success) setErrorMsg(data.error || 'Failed to save note')
    } catch (e: any) {
      console.error(e)
      setErrorMsg(e?.message ? String(e.message) : 'Failed to save note')
    } finally {
      setIsSaving(false)
      await fetchData()
    }
  }

  const handleDraftChange = (nextTitle: string, nextContent: string) => {
    setTitleDraft(nextTitle)
    setContentDraft(nextContent)

    if (!selectedNoteId) return
    if (!selectedSubfolderId) return
    if (!allSubfolderIds.has(selectedSubfolderId)) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void persistTitleContent({
        id: selectedNoteId,
        title: nextTitle,
        content: nextContent,
        subfolderId: selectedSubfolderId
      })
    }, 1000)
  }

  const handleTogglePinned = async () => {
    if (!selectedNoteId) return
    const nextPinned = !(selectedNote?.isPinned ?? false)
    setIsSaving(true)
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
      if (!data.success) setErrorMsg(data.error || 'Failed to update pin')
    } catch (e: any) {
      setErrorMsg(e?.message ? String(e.message) : 'Failed to update pin')
    } finally {
      setIsSaving(false)
      await fetchData()
    }
  }

  const handleSaveTags = async () => {
    if (!selectedNoteId) return
    const tags = tagsDraft
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20)
    setIsSaving(true)
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
      if (!data.success) setErrorMsg(data.error || 'Failed to save tags')
    } catch (e: any) {
      setErrorMsg(e?.message ? String(e.message) : 'Failed to save tags')
    } finally {
      setIsSaving(false)
      await fetchData()
    }
  }

  const handleCreateNote = async () => {
    if (!defaultSubfolderId) return
    setErrorMsg(null)
    setIsSaving(true)
    try {
      const tempTitle = 'New Note'
      const tempContent = ''
      const res = await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_NOTE',
          payload: {
            title: tempTitle,
            content: tempContent,
            subfolderId: defaultSubfolderId,
            tags: '[]'
          }
        })
      })
      const data = await res.json()
      if (!data.success) {
        setErrorMsg(data.error || 'Failed to create note')
        return
      }
      await fetchData()
      setSelectedNoteId(data.data.id)
    } catch (e: any) {
      setErrorMsg(e?.message ? String(e.message) : 'Failed to create note')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setErrorMsg(null)
    setIsSaving(true)
    try {
      await fetch(`/api/smart-notes?id=${id}&type=note`, { method: 'DELETE' })
      if (selectedNoteId === id) {
        setSelectedNoteId(null)
      }
      await fetchData()
    } catch (ex: any) {
      setErrorMsg(ex?.message ? String(ex.message) : 'Failed to delete note')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-black/90 text-white overflow-hidden">
      {/* Left: collections / views / tags */}
      <aside className="w-72 border-r border-[#333] flex flex-col bg-zinc-950">
        <div className="p-4 border-b border-[#333] flex items-center justify-between">
          <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
            <Folder size={16} className="text-blue-400" /> Smart Notes
          </h2>
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="space-y-6">
            <div>
              <p className="text-[11px] uppercase text-zinc-500 mb-2">Views</p>
              <div className="space-y-1">
                <button
                  className={`w-full text-left px-2 py-1 rounded ${activeView === 'all' ? 'bg-blue-600/20 text-blue-300' : 'text-zinc-400 hover:bg-white/5'}`}
                  onClick={() => setActiveView('all')}
                >
                  All Cloud
                </button>
                <button
                  className={`w-full text-left px-2 py-1 rounded ${activeView === 'pinned' ? 'bg-blue-600/20 text-blue-300' : 'text-zinc-400 hover:bg-white/5'}`}
                  onClick={() => setActiveView('pinned')}
                >
                  Pinned
                </button>
                <button
                  className={`w-full text-left px-2 py-1 rounded ${activeView === 'ai' ? 'bg-blue-600/20 text-blue-300' : 'text-zinc-400 hover:bg-white/5'}`}
                  onClick={() => setActiveView('ai')}
                >
                  AI
                </button>
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase text-zinc-500 mb-2">Collections</p>
              <div className="space-y-1">
                {folders.map((f) => (
                  <button
                    key={f.id}
                    className={`w-full text-left px-2 py-1 rounded ${
                      activeFolderId === f.id ? 'bg-blue-600/20 text-blue-300' : 'text-zinc-400 hover:bg-white/5'
                    }`}
                    onClick={() => {
                      setActiveFolderId(f.id)
                      setActiveTag(null)
                    }}
                  >
                    {f.name}
                  </button>
                ))}
                {activeFolderId && (
                  <button
                    className="w-full text-left px-2 py-1 rounded text-zinc-400 hover:bg-white/5"
                    onClick={() => setActiveFolderId(null)}
                  >
                    Clear collection
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-[11px] uppercase text-zinc-500">Tags</p>
                {activeTag && (
                  <button className="text-[11px] text-blue-300 hover:underline" onClick={() => setActiveTag(null)}>
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {[...tagCounts.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 30)
                  .map(([t, c]) => (
                    <button
                      key={t}
                      className={`px-2 py-1 rounded-full text-[11px] border ${
                        activeTag === t ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                      }`}
                      onClick={() => setActiveTag(t)}
                      title={`${c} notes`}
                    >
                      #{t}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Middle: search + grouped list */}
      <section className="w-96 border-r border-[#333] flex flex-col bg-zinc-900/50">
        <div className="p-4 border-b border-[#333]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-zinc-100">Notes</h3>
            <Button size="sm" onClick={() => void handleCreateNote()} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus size={14} className="mr-1" /> New
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Search size={14} className="text-zinc-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title/content/summary..."
              className="w-full bg-zinc-950/30 border border-zinc-800 text-zinc-100 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {errorMsg && <p className="text-xs text-red-300 mt-2">{errorMsg}</p>}
        </div>

        <ScrollArea className="flex-1 p-2">
          {notes.length === 0 && (
            <div className="p-6 text-center text-zinc-500">
              <FileText className="mx-auto mb-3 opacity-50" />
              Loading your Smart Notes...
            </div>
          )}

          {notes.length > 0 && filteredNotes.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-6">No matching notes</p>
          )}

          {filteredNotes.length > 0 && (
            <div className="space-y-3">
              {(
                [
                  'Today',
                  'Yesterday',
                  'Previous 7 Days',
                  'Previous 30 Days',
                  'Earlier'
                ] as const
              ).map((bucket) => (
                <div key={bucket} className="space-y-2">
                  {groupedNotes[bucket].length > 0 && (
                    <div className="text-[11px] uppercase text-zinc-500 px-2">{bucket}</div>
                  )}
                  {groupedNotes[bucket].map((n) => {
                    const tags = safeParseStringArray(n.tags)
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleSelectNote(n.id)}
                        className={`p-3 mb-2 rounded-lg cursor-pointer border transition-all ${
                          selectedNoteId === n.id ? 'bg-zinc-800 border-zinc-600' : 'bg-transparent border-transparent hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              {n.isPinned && <Pin size={14} className="text-amber-300" />}
                              <h4 className="font-medium text-sm text-zinc-200 truncate">
                                {n.title || 'Untitled'}
                              </h4>
                            </div>
                            {n.aiSummary && n.aiSummary.trim().length > 0 && (
                              <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{n.aiSummary}</p>
                            )}
                            {!n.aiSummary && (
                              <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                                {(n.content || '').slice(0, 140) || 'No content...'}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => void handleDeleteNote(n.id, e)}
                            className="text-red-400/60 hover:text-red-400"
                            aria-label={`Delete note ${n.title}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {tags.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </section>

      {/* Right: editor */}
      <section className="flex-1 flex flex-col bg-zinc-950">
        {!selectedNoteId || !selectedNote || !selectedSubfolderId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 p-6">
            <FileText size={48} className="mb-4 opacity-50" />
            <p className="text-sm">Select a note to view / edit</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                {selectedNote.isPinned ? (
                  <Pin size={16} className="text-amber-300" />
                ) : (
                  <Pin size={16} className="text-zinc-600" />
                )}
                <span className="text-xs text-zinc-500">{isSaving ? 'Saving...' : 'Autosave enabled'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => void handleTogglePinned()} className="border-zinc-700 text-zinc-200 hover:bg-white/5">
                  {selectedNote.isPinned ? 'Unpin' : 'Pin'}
                </Button>
              </div>
            </div>

            <input
              className="bg-transparent border-none text-3xl font-bold focus:outline-none focus:ring-0 text-white placeholder-zinc-700 mb-4 px-0"
              value={titleDraft}
              onChange={(e) => handleDraftChange(e.target.value, contentDraft)}
              placeholder="Note title"
            />

            <textarea
              className="flex-1 bg-transparent border-none text-zinc-300 resize-none focus:outline-none focus:ring-0 px-0 text-lg leading-relaxed placeholder-zinc-700"
              value={contentDraft}
              onChange={(e) => handleDraftChange(titleDraft, e.target.value)}
              placeholder="Start typing..."
            />

            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-2">
                <TagIcon size={14} className="text-zinc-400" />
                <input
                  value={tagsDraft}
                  onChange={(e) => setTagsDraft(e.target.value)}
                  onBlur={() => void handleSaveTags()}
                  disabled={!selectedNoteId}
                  className="flex-1 bg-zinc-900/30 border border-zinc-800 text-zinc-100 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Tags (comma-separated)"
                />
                <Button size="sm" onClick={() => void handleSaveTags()} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save
                </Button>
              </div>

              {selectedNote.aiSummary && selectedNote.aiSummary.trim().length > 0 && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                  <p className="text-xs text-blue-300 font-semibold mb-2">AI Summary</p>
                  <p className="text-sm text-zinc-100 whitespace-pre-wrap">{selectedNote.aiSummary}</p>

                  {selectedNote.aiKeyPoints && safeParseStringArray(selectedNote.aiKeyPoints).length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-zinc-300 font-semibold mb-2">Key points</p>
                      <ul className="text-sm text-zinc-100 list-disc pl-5">
                        {safeParseStringArray(selectedNote.aiKeyPoints).slice(0, 8).map((k) => (
                          <li key={k} className="mb-1">
                            {k}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

