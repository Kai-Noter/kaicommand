'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Folder, FileText, Search, Tag as TagIcon, Trash2, Pin, Plus, Image as ImageIcon, ListTodo, Bold, Italic } from 'lucide-react'
import {
  useSmartNotesStore,
  flattenNotes,
  getFolderDerived,
  getSubfolderDerived,
  type SmartNote,
} from '@/stores/smart-notes-store'

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : []
  } catch {
    return []
  }
}

function bucketDate(iso: string): 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Previous 30 Days' | 'Earlier' {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const day = 24 * 60 * 60 * 1000
  if (diff < day) return 'Today'
  if (diff < 2 * day) return 'Yesterday'
  if (diff < 7 * day) return 'Previous 7 Days'
  if (diff < 30 * day) return 'Previous 30 Days'
  return 'Earlier'
}

function insertAroundSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string
): { value: string; start: number; end: number } {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const current = textarea.value
  const selected = current.slice(start, end)
  const next = `${current.slice(0, start)}${before}${selected}${after}${current.slice(end)}`
  const nextStart = start + before.length
  const nextEnd = nextStart + selected.length
  return { value: next, start: nextStart, end: nextEnd }
}

export function SmartNotesEvernoteLayout() {
  const {
    folders,
    selectedFolderId,
    selectedSubfolderId,
    selectedNoteId,
    searchQuery,
    isLoading,
    isSaving,
    error,
    initialize,
    refresh,
    setSearchQuery,
    setSelectedFolder,
    setSelectedSubfolder,
    setSelectedNote,
    createFolder,
    createSubfolder,
    renameFolder,
    renameSubfolder,
    moveSubfolder,
    createNote,
    updateNote,
    updateNoteTags,
    moveNote,
    deleteNote,
    deleteSubfolder,
    deleteFolder,
  } = useSmartNotesStore()

  const [newFolderName, setNewFolderName] = useState('')
  const [newSubfolderName, setNewSubfolderName] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [tagsDraft, setTagsDraft] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [pinnedOnly, setPinnedOnly] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const autosaveRef = useRef<NodeJS.Timeout | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void initialize()
  }, [initialize])

  const allNotes = useMemo(() => flattenNotes(folders), [folders])
  const selectedNote = useMemo(() => allNotes.find((n) => n.id === selectedNoteId), [allNotes, selectedNoteId])

  useEffect(() => {
    const t = setTimeout(() => {
      if (!selectedNote) {
        setNoteTitle('')
        setNoteContent('')
        setTagsDraft('')
        return
      }
      setNoteTitle(selectedNote.title)
      setNoteContent(selectedNote.content)
      setTagsDraft(parseTags(selectedNote.tags).join(', '))
    }, 0)
    return () => clearTimeout(t)
  }, [selectedNote])

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey
      if (!cmd) return

      if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        searchRef.current?.focus()
      }

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        if (selectedSubfolderId) {
          void createNote(selectedSubfolderId)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedSubfolderId, createNote])

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return allNotes
      .filter((n) => (selectedFolderId ? folders.find((f) => f.id === selectedFolderId)?.subfolders.some((s) => s.id === n.subfolderId) : true))
      .filter((n) => (selectedSubfolderId ? n.subfolderId === selectedSubfolderId : true))
      .filter((n) => (pinnedOnly ? n.isPinned : true))
      .filter((n) => (activeTag ? parseTags(n.tags).includes(activeTag) : true))
      .filter((n) => {
        if (!q) return true
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.aiSummary || '').toLowerCase().includes(q) ||
          parseTags(n.tags).join(' ').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  }, [allNotes, selectedFolderId, selectedSubfolderId, pinnedOnly, activeTag, searchQuery, folders])

  const grouped = useMemo(() => {
    const buckets: Record<string, SmartNote[]> = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      Earlier: [],
    }
    for (const n of filteredNotes) {
      buckets[bucketDate(n.updatedAt)].push(n)
    }
    return buckets
  }, [filteredNotes])

  const allTags = useMemo(() => {
    const map = new Map<string, number>()
    for (const n of allNotes) {
      for (const t of parseTags(n.tags)) map.set(t, (map.get(t) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [allNotes])

  const queueAutosave = (nextTitle: string, nextContent: string) => {
    setNoteTitle(nextTitle)
    setNoteContent(nextContent)
    if (!selectedNoteId) return
    if (autosaveRef.current) clearTimeout(autosaveRef.current)
    autosaveRef.current = setTimeout(() => {
      void updateNote(selectedNoteId, { title: nextTitle, content: nextContent })
    }, 600)
  }

  const handleSaveTags = async () => {
    if (!selectedNoteId) return
    const tags = tagsDraft
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20)
    await updateNoteTags(selectedNoteId, tags)
  }

  const applyMarkdown = (before: string, after: string = '') => {
    const el = editorRef.current
    if (!el) return
    const { value, start, end } = insertAroundSelection(el, before, after)
    queueAutosave(noteTitle, value)
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = start
      el.selectionEnd = end
    })
  }

  const handleInsertChecklist = () => applyMarkdown('\n- [ ] ')

  const handleInsertImage = async (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      const marker = `\n![image](${dataUrl})\n`
      queueAutosave(noteTitle, `${noteContent}${marker}`)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Left sidebar */}
      <aside className="w-80 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Folder size={14} className="text-sky-400" /> Folders
          </h3>

          <div className="mt-3 flex gap-2">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder"
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs"
            />
            <Button
              size="sm"
              className="bg-sky-600 hover:bg-sky-700"
              onClick={() => {
                void createFolder(newFolderName)
                setNewFolderName('')
              }}
            >
              <Plus size={12} />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {folders.map((folder) => {
              const derived = getFolderDerived(folder)
              const activeFolder = selectedFolderId === folder.id
              return (
                <div
                  key={folder.id}
                  className={`rounded-lg border ${activeFolder ? 'border-sky-500/50 bg-sky-500/10' : 'border-zinc-800 bg-zinc-900/40'}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const raw = e.dataTransfer.getData('text/plain')
                    if (raw.startsWith('subfolder:')) {
                      const id = raw.replace('subfolder:', '')
                      void moveSubfolder(id, folder.id)
                    }
                  }}
                >
                  <div className="p-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        className="text-left flex-1"
                        onClick={() => {
                          setSelectedFolder(folder.id)
                          setSelectedSubfolder(folder.subfolders[0]?.id ?? null)
                        }}
                      >
                        <p className="text-sm font-medium">{folder.name}</p>
                        <p className="text-[11px] text-zinc-400">{derived.totalNotes} notes</p>
                      </button>
                      <div className="flex gap-1">
                        <button
                          className="text-xs text-zinc-400 hover:text-zinc-200"
                          onClick={() => {
                            const next = prompt('Rename folder', folder.name)
                            if (next && next.trim()) void renameFolder(folder.id, next.trim())
                          }}
                        >
                          Rename
                        </button>
                        <button className="text-xs text-red-400" onClick={() => void deleteFolder(folder.id)}>
                          Del
                        </button>
                      </div>
                    </div>
                    {derived.preview && <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1">{derived.preview}</p>}
                  </div>

                  <div className="px-2 pb-2 space-y-1">
                    {folder.subfolders.map((sub) => {
                      const d = getSubfolderDerived(sub)
                      const activeSub = selectedSubfolderId === sub.id
                      return (
                        <div
                          key={sub.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', `subfolder:${sub.id}`)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            const raw = e.dataTransfer.getData('text/plain')
                            if (raw.startsWith('note:')) {
                              const noteId = raw.replace('note:', '')
                              void moveNote(noteId, sub.id)
                            }
                          }}
                          className={`rounded px-2 py-1 border ${activeSub ? 'border-sky-500/40 bg-sky-500/10' : 'border-zinc-800 bg-zinc-900/30'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <button
                              className="text-left flex-1"
                              onClick={() => {
                                setSelectedFolder(folder.id)
                                setSelectedSubfolder(sub.id)
                              }}
                            >
                              <p className="text-xs font-medium">{sub.name}</p>
                              <p className="text-[10px] text-zinc-400">{d.noteCount} notes</p>
                            </button>
                            <div className="flex gap-1">
                              <button
                                className="text-[10px] text-zinc-400"
                                onClick={() => {
                                  const next = prompt('Rename subfolder', sub.name)
                                  if (next && next.trim()) void renameSubfolder(sub.id, next.trim())
                                }}
                              >
                                R
                              </button>
                              <button className="text-[10px] text-red-400" onClick={() => void deleteSubfolder(sub.id)}>
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    <div className="flex gap-2 pt-1">
                      <input
                        value={activeFolder ? newSubfolderName : ''}
                        onChange={(e) => {
                          if (activeFolder) setNewSubfolderName(e.target.value)
                        }}
                        placeholder={activeFolder ? 'New subfolder' : 'Select folder'}
                        disabled={!activeFolder}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] disabled:opacity-50"
                      />
                      <button
                        disabled={!activeFolder || !newSubfolderName.trim()}
                        onClick={() => {
                          void createSubfolder(folder.id, newSubfolderName)
                          if (activeFolder) setNewSubfolderName('')
                        }}
                        className="text-xs px-2 rounded bg-zinc-800 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </aside>

      {/* Middle panel */}
      <section className="w-[420px] border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Notes</h3>
            <Button
              size="sm"
              className="bg-sky-600 hover:bg-sky-700"
              disabled={!selectedSubfolderId}
              onClick={() => {
                if (selectedSubfolderId) void createNote(selectedSubfolderId)
              }}
            >
              <Plus size={12} className="mr-1" /> New
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Search size={14} className="text-zinc-500" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search داخل notes..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs"
            />
          </div>

          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-400">
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" checked={pinnedOnly} onChange={(e) => setPinnedOnly(e.target.checked)} /> Pinned only
            </label>
            <button className="hover:text-zinc-200" onClick={() => setActiveTag(null)}>
              Clear tag filter
            </button>
          </div>

          {error && (
            <div className="mt-2 text-xs text-red-300 flex items-center justify-between gap-2">
              <span>{error}</span>
              <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => void refresh()}>
                Retry
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 p-2">
          {isLoading && <p className="text-xs text-zinc-500 text-center py-6">Loading notes...</p>}
          {!isLoading && filteredNotes.length === 0 && <p className="text-xs text-zinc-500 text-center py-6">No notes found</p>}

          {!isLoading && (
            <div className="space-y-3">
              {(['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', 'Earlier'] as const).map((bucket) => {
                const list = grouped[bucket]
                if (list.length === 0) return null
                return (
                  <div key={bucket} className="space-y-2">
                    <p className="text-[11px] uppercase text-zinc-500 px-2">{bucket}</p>
                    {list.map((n) => {
                      const tags = parseTags(n.tags)
                      return (
                        <div
                          key={n.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', `note:${n.id}`)}
                          onClick={() => setSelectedNote(n.id)}
                          className={`rounded-lg border p-3 cursor-pointer ${selectedNoteId === n.id ? 'border-sky-500/40 bg-sky-500/10' : 'border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {n.isPinned && <Pin size={12} className="text-amber-300" />}
                                <p className="text-sm font-medium truncate">{n.title || 'Untitled'}</p>
                              </div>
                              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{(n.aiSummary || n.content || '').slice(0, 120)}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                void deleteNote(n.id)
                              }}
                              className="text-red-400/70 hover:text-red-400"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          {tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {tags.slice(0, 4).map((t) => (
                                <button
                                  key={t}
                                  className={`text-[10px] px-2 py-0.5 rounded-full border ${activeTag === t ? 'border-sky-500/40 bg-sky-500/10 text-sky-200' : 'border-zinc-700 text-zinc-300'}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveTag(t)
                                  }}
                                >
                                  #{t}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </section>

      {/* Editor */}
      <section className="flex-1 flex flex-col">
        {!selectedNote ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
            <FileText size={48} className="opacity-50 mb-3" />
            <p>Select a note to edit</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => applyMarkdown('**', '**')}>
                  <Bold size={14} />
                </Button>
                <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => applyMarkdown('_', '_')}>
                  <Italic size={14} />
                </Button>
                <Button size="sm" variant="outline" className="border-zinc-700" onClick={handleInsertChecklist}>
                  <ListTodo size={14} />
                </Button>
                <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => imageInputRef.current?.click()}>
                  <ImageIcon size={14} />
                </Button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleInsertImage(file)
                    e.currentTarget.value = ''
                  }}
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <button
                  className="hover:text-zinc-200"
                  onClick={() => {
                    if (selectedNoteId) void updateNote(selectedNoteId, { isPinned: !selectedNote.isPinned })
                  }}
                >
                  {selectedNote.isPinned ? 'Unpin' : 'Pin'}
                </button>
                <span>{isSaving ? 'Saving...' : 'Saved'}</span>
              </div>
            </div>

            <input
              value={noteTitle}
              onChange={(e) => queueAutosave(e.target.value, noteContent)}
              placeholder="Note title"
              className="bg-transparent border-none text-3xl font-bold focus:outline-none text-zinc-100 placeholder-zinc-600 mb-4"
            />

            <textarea
              ref={editorRef}
              value={noteContent}
              onChange={(e) => queueAutosave(noteTitle, e.target.value)}
              placeholder="Start writing..."
              className="flex-1 bg-transparent border-none resize-none focus:outline-none text-zinc-200 leading-relaxed"
            />

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <TagIcon size={14} className="text-zinc-400" />
                <input
                  value={tagsDraft}
                  onChange={(e) => setTagsDraft(e.target.value)}
                  onBlur={() => void handleSaveTags()}
                  placeholder="tags: work, handover, idea"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs"
                />
                <Button size="sm" className="bg-sky-600 hover:bg-sky-700" onClick={() => void handleSaveTags()}>
                  Save tags
                </Button>
              </div>

              {selectedNote.aiSummary && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                  <p className="text-xs text-sky-300 font-semibold mb-1">AI Summary</p>
                  <p className="text-sm text-zinc-200">{selectedNote.aiSummary}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
