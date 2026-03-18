'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, FolderOpen, FileText, Plus, Search, Pin, Trash2, MoreVertical, Edit3, ChevronRight, ChevronDown, Check, X, Wand2, ListChecks, CheckSquare, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface SmartFolder {
  id: string
  name: string
  totalNotes: number
  lastUpdated: string
  preview: string
  subfolders: SmartSubfolder[]
}

export interface SmartSubfolder {
  id: string
  name: string
  folderId: string
  noteCount: number
  lastUpdated: string
  preview: string
  notes: SmartNote[]
}

export interface SmartNote {
  id: string
  title: string
  content: string
  subfolderId: string
  tags: string
  isPinned: boolean
  updatedAt: string
}

const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim() || !text) return <>{text}</>
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-lime-500/30 text-lime-200 rounded px-0.5">{part}</span>
        ) : (
          part
        )
      )}
    </>
  )
}

const getPreviewContent = (content: string, query: string) => {
  if (!content) return 'Empty note'
  if (!query.trim()) return content.substring(0, 80)
  const q = query.toLowerCase()
  const lowerContent = content.toLowerCase()
  const idx = lowerContent.indexOf(q)
  if (idx === -1) return content.substring(0, 80)
  
  const start = Math.max(0, idx - 30)
  const end = Math.min(content.length, idx + q.length + 40)
  let snippet = content.substring(start, end)
  if (start > 0) snippet = '...' + snippet
  if (end < content.length) snippet = snippet + '...'
  return snippet
}
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return ''
  
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return timeStr
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `Yes`
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function SmartNotesView() {
  const [folders, setFolders] = useState<SmartFolder[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedSubfolderId, setSelectedSubfolderId] = useState<string | null>(null)
  
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  
  const [creatingSubfolderFor, setCreatingSubfolderFor] = useState<string | null>(null)
  const [newSubfolderName, setNewSubfolderName] = useState('')
  
  const folderInputRef = useRef<HTMLInputElement>(null)
  const subfolderInputRef = useRef<HTMLInputElement>(null)

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  // Optimistic UI Updater for the selected Note
  const optimisticUpdateNote = useCallback((id: string, updates: Partial<SmartNote>) => {
    setFolders(prev => prev.map(f => ({
      ...f,
      subfolders: f.subfolders.map(s => ({
        ...s,
        notes: s.notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)
      }))
    })))
  }, [])
  
  // Undo/Redo History Stack
  const [history, setHistory] = useState<{title: string, content: string}[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [isAiProcessing, setIsAiProcessing] = useState(false)

  const fetchHierarchy = async () => {
    try {
      const res = await fetch('/api/smart-notes')
      const data = await res.json()
      if (data.success) {
        setFolders(data.folders)
      }
    } catch (e) {
      console.error("Failed to fetch folders", e)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Initial Load & Hydrate LocalStorage
  useEffect(() => {
    fetchHierarchy()
    
    // Safely hydrate from LocalStorage on mount to avoid Next.js SSR errors
    try {
      const sFolder = localStorage.getItem('smart_notes_folder')
      const sSub = localStorage.getItem('smart_notes_subfolder')
      const sNote = localStorage.getItem('smart_notes_note')
      const sExp = localStorage.getItem('smart_notes_expanded')
      
      if (sFolder) setSelectedFolderId(sFolder)
      if (sSub) setSelectedSubfolderId(sSub)
      if (sNote) setSelectedNoteId(sNote)
      if (sExp) setExpandedFolders(JSON.parse(sExp))
    } catch(e) {}
  }, [])

  // Sync state to LocalStorage
  useEffect(() => {
    if (selectedFolderId) localStorage.setItem('smart_notes_folder', selectedFolderId)
    else localStorage.removeItem('smart_notes_folder')
  }, [selectedFolderId])

  useEffect(() => {
    if (selectedSubfolderId) localStorage.setItem('smart_notes_subfolder', selectedSubfolderId)
    else localStorage.removeItem('smart_notes_subfolder')
  }, [selectedSubfolderId])

  useEffect(() => {
    if (selectedNoteId) localStorage.setItem('smart_notes_note', selectedNoteId)
    else localStorage.removeItem('smart_notes_note')
  }, [selectedNoteId])

  useEffect(() => {
    localStorage.setItem('smart_notes_expanded', JSON.stringify(expandedFolders))
  }, [expandedFolders])

  const allNotes = useMemo(() => {
    return folders.flatMap(f => f.subfolders.flatMap(s => s.notes))
  }, [folders])

  const [visibleCount, setVisibleCount] = useState(50)

  useEffect(() => {
    setVisibleCount(50)
  }, [searchQuery, selectedFolderId, selectedSubfolderId])

  const filteredNotes = useMemo(() => {
    let result = allNotes
    
    // Filter by Folder / Subfolder selection
    if (selectedSubfolderId) {
      result = result.filter(n => n.subfolderId === selectedSubfolderId)
    } else if (selectedFolderId === 'Pinned') {
      result = result.filter(n => n.isPinned)
    } else if (selectedFolderId === 'Recent') {
      const today = new Date()
      result = result.filter(n => {
        const d = new Date(n.updatedAt)
        return Math.ceil((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)) <= 7
      })
    } else if (selectedFolderId && selectedFolderId !== 'All Notes') {
      const folder = folders.find(f => f.id === selectedFolderId)
      if (folder) {
        const subIds = folder.subfolders.map(s => s.id)
        result = result.filter(n => subIds.includes(n.subfolderId))
      }
    }

    // Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
    }

    return result
  }, [allNotes, folders, selectedFolderId, selectedSubfolderId, searchQuery])

  // Group notes for the middle pane
  const groupedNotes = useMemo(() => {
    const sorted = [...filteredNotes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, visibleCount)
    const pinned = sorted.filter(n => n.isPinned)
    const unpinned = sorted.filter(n => !n.isPinned)
    
    const groups: { label: string, notes: SmartNote[] }[] = [
      { label: 'Pinned', notes: pinned },
      { label: 'Today', notes: [] },
      { label: 'Yesterday', notes: [] },
      { label: 'Previous 7 Days', notes: [] },
      { label: 'Previous 30 Days', notes: [] },
      { label: 'Older', notes: [] }
    ]

    const today = new Date()
    today.setHours(0,0,0,0)

    unpinned.forEach(note => {
      const d = new Date(note.updatedAt)
      d.setHours(0,0,0,0)
      const diffTime = today.getTime() - d.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0 || diffDays === -0) groups[1].notes.push(note)
      else if (diffDays === 1) groups[2].notes.push(note)
      else if (diffDays <= 7) groups[3].notes.push(note)
      else if (diffDays <= 30) groups[4].notes.push(note)
      else groups[5].notes.push(note)
    })

    return groups.filter(g => g.notes.length > 0)
  }, [filteredNotes])

  const selectedNote = useMemo(() => allNotes.find(n => n.id === selectedNoteId), [allNotes, selectedNoteId])

  // Sync history when selected note changes
  useEffect(() => {
    if (selectedNote && !isEditing) {
      setSaveStatus('saved')
      setHistory([{ title: selectedNote.title, content: selectedNote.content }])
      setHistoryIndex(0)
    } else if (!selectedNote && !isEditing) {
      setSaveStatus('saved')
      setHistory([{ title: '', content: '' }])
      setHistoryIndex(0)
    }
  }, [selectedNote, isEditing, selectedSubfolderId])

  useEffect(() => {
    if (creatingFolder && folderInputRef.current) folderInputRef.current.focus()
  }, [creatingFolder])

  useEffect(() => {
    if (creatingSubfolderFor && subfolderInputRef.current) subfolderInputRef.current.focus()
  }, [creatingSubfolderFor])

  const handleCreateNew = async () => {
    if (!selectedSubfolderId) {
      alert("Please select a specific Subfolder before creating a new Note.")
      return
    }
    
    setIsSaving(true)
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_NOTE',
          payload: { title: 'Untitled Note', content: '', subfolderId: selectedSubfolderId, tags: '[]' }
        })
      })
      const data = await res.json()
      if (data.success) {
        await fetchHierarchy()
        setSelectedNoteId(data.data.id)
        setIsEditing(true)
        setSaveStatus('saved')
        setHistory([{ title: 'Untitled Note', content: '' }])
        setHistoryIndex(0)
      }
    } catch {
       setSaveStatus('unsaved')
    } finally {
       setIsSaving(false)
    }
  }

  const performSave = async (id: string, title: string, content: string, subfolderId: string, tags: string[], isPinned: boolean) => {
    if (!subfolderId || !id) return
    setIsSaving(true)
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_NOTE',
          payload: { id, title, content, subfolderId, tags: JSON.stringify(tags), isPinned }
        })
      })
      const data = await res.json()
      if (data.success) {
        setSaveStatus('saved')
        // We already optimistic updated locally, but let's sync to be perfectly confident
        fetchHierarchy() 
      }
    } catch(e) {
      console.error(e)
      setSaveStatus('unsaved')
    } finally {
      setIsSaving(false)
    }
  }

  const debouncedSave = useDebounce(performSave, 1000)
  const pushHistory = useDebounce((t: string, c: string) => {
    setHistory(prev => {
      const newHist = prev.slice(0, historyIndex + 1)
      newHist.push({ title: t, content: c })
      return newHist.slice(-50) // keep last 50 edits
    })
    setHistoryIndex(prev => Math.min(prev + 1, 49))
  }, 1500)

  const handleUndo = () => {
    if (historyIndex > 0 && selectedNote) {
      const prev = history[historyIndex - 1]
      optimisticUpdateNote(selectedNote.id, { title: prev.title, content: prev.content })
      setHistoryIndex(historyIndex - 1)
      setSaveStatus('unsaved')
      debouncedSave(selectedNote.id, prev.title, prev.content, selectedNote.subfolderId, JSON.parse(selectedNote.tags || '[]'), selectedNote.isPinned)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && selectedNote) {
      const next = history[historyIndex + 1]
      optimisticUpdateNote(selectedNote.id, { title: next.title, content: next.content })
      setHistoryIndex(historyIndex + 1)
      setSaveStatus('unsaved')
      debouncedSave(selectedNote.id, next.title, next.content, selectedNote.subfolderId, JSON.parse(selectedNote.tags || '[]'), selectedNote.isPinned)
    }
  }

  const handleTitleChange = (e: any) => {
    const val = e.target.value
    if (selectedNote) {
      optimisticUpdateNote(selectedNote.id, { title: val })
      pushHistory(val, selectedNote.content)
      setSaveStatus('unsaved')
      debouncedSave(selectedNote.id, val, selectedNote.content, selectedNote.subfolderId, JSON.parse(selectedNote.tags || '[]'), selectedNote.isPinned)
    }
  }

  const handleContentChange = (e: any) => {
    const val = e.target.value
    if (selectedNote) {
      optimisticUpdateNote(selectedNote.id, { content: val })
      pushHistory(selectedNote.title, val)
      setSaveStatus('unsaved')
      debouncedSave(selectedNote.id, selectedNote.title, val, selectedNote.subfolderId, JSON.parse(selectedNote.tags || '[]'), selectedNote.isPinned)
    }
  }

  const togglePin = async (e: React.MouseEvent, note: SmartNote) => {
    e.stopPropagation()
    try {
      await fetch('/api/smart-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_NOTE', payload: { id: note.id, isPinned: !note.isPinned, title: note.title, content: note.content } })
      })
      fetchHierarchy()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string, type: 'folder'|'subfolder'|'note') => {
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        await fetch(`/api/smart-notes?id=${id}&type=${type}`, { method: 'DELETE' })
        if (type === 'note' && selectedNoteId === id) {
          setSelectedNoteId(null)
          setIsEditing(false)
        }
        if (type === 'subfolder') {
          if (selectedSubfolderId === id) {
             setSelectedSubfolderId(null)
             setSelectedNoteId(null)
             setIsEditing(false)
          }
        }
        if (type === 'folder') {
          if (selectedFolderId === id) {
             setSelectedFolderId(null)
             setSelectedSubfolderId(null)
             setSelectedNoteId(null)
             setIsEditing(false)
          }
        }
        fetchHierarchy()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const toggleFolderDisplay = (folderId: string) => {
    setExpandedFolders(prev => ({...prev, [folderId]: !prev[folderId]}))
  }

  const handleExportMarkdown = () => {
    if (!selectedNote) return
    let md = `# ${selectedNote.title}\n\n`
    const parsedTags = JSON.parse(selectedNote.tags || '[]') as string[]
    if (parsedTags.length > 0) md += `**Tags:** ${parsedTags.join(', ')}\n\n`
    md += selectedNote.content
    
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const saveNewFolder = async () => {
    if (newFolderName.trim()) {
      try {
        await fetch('/api/smart-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'CREATE_FOLDER', payload: { name: newFolderName.trim() } })
        })
        fetchHierarchy()
      } catch (err) { }
    }
    setCreatingFolder(false)
    setNewFolderName('')
  }

  const saveNewSubfolder = async () => {
    if (newSubfolderName.trim() && creatingSubfolderFor) {
      try {
        await fetch('/api/smart-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'CREATE_SUBFOLDER', payload: { name: newSubfolderName.trim(), folderId: creatingSubfolderFor } })
        })
        setExpandedFolders(prev => ({...prev, [creatingSubfolderFor]: true}))
        fetchHierarchy()
      } catch (err) {}
    }
    setCreatingSubfolderFor(null)
    setNewSubfolderName('')
  }

  const handleAiAction = async (actionType: 'summarize' | 'key_points') => {
    if (!selectedNote || !selectedNote.content.trim()) return
    setIsAiProcessing(true)
    try {
      const res = await fetch('/api/smart-notes/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, content: selectedNote.content })
      })
      const data = await res.json()
      if (data.success) {
        const newContent = selectedNote.content + '\n\n---\n**AI Generated:**\n' + data.result
        optimisticUpdateNote(selectedNote.id, { content: newContent })
        setSaveStatus('unsaved')
        debouncedSave(selectedNote.id, selectedNote.title, newContent, selectedNote.subfolderId, JSON.parse(selectedNote.tags || '[]'), selectedNote.isPinned)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsAiProcessing(false)
    }
  }

  const handleFormatCollapsible = () => {
    if (selectedNote) {
       const newContent = selectedNote.content + '\n<details>\n  <summary>Click to expand</summary>\n  \n  Hidden content here...\n</details>\n'
       optimisticUpdateNote(selectedNote.id, { content: newContent })
       setSaveStatus('unsaved')
       debouncedSave(selectedNote.id, selectedNote.title, newContent, selectedNote.subfolderId, JSON.parse(selectedNote.tags || '[]'), selectedNote.isPinned)
    }
  }

  const handleSendToTasks = async (note: SmartNote) => {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Review Note: ${note.title}`,
          status: 'pending',
          priority: 'medium',
          description: `Note content:\n\n${note.content.substring(0, 200)}...\n\n[View Full Note]`
        })
      })
      alert('Sent to Tasks successfully!')
    } catch (err) {}
  }

  return (
    <motion.div
      key="smart-notes"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="h-[calc(100vh-140px)] flex flex-col md:flex-row overflow-hidden rounded-xl border border-white/10 bg-background/30 backdrop-blur-xl shadow-2xl"
    >
      {/* Pane 1: Folders Sidebar */}
      <div className="w-full md:w-72 border-r border-white/10 bg-black/20 flex flex-col shrink-0 h-48 md:h-full">
        <div className="p-4 flex items-center justify-between shrink-0 border-b border-border/10">
          <span className="font-semibold text-xs text-muted-foreground tracking-widest uppercase flex items-center gap-2">
            <Folder className="w-4 h-4" /> 
            Directories
          </span>
          <Button variant="ghost" size="icon" className="w-6 h-6 hover:bg-white/10" onClick={() => setCreatingFolder(true)}>
            <Plus className="w-4 h-4 text-emerald-400" />
          </Button>
        </div>
        <ScrollArea className="flex-1 px-2 py-2">
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">Smart Collections</span>
            <Button
              variant={selectedFolderId === null || selectedFolderId === 'All Notes' ? 'secondary' : 'ghost'}
              className={`w-full justify-start h-8 px-3 text-sm transition-all ${selectedFolderId === 'All Notes' || selectedFolderId === null ? 'bg-lime-500/20 text-lime-400' : 'hover:bg-white/5'}`}
              onClick={() => { 
                setSelectedFolderId('All Notes')
                setSelectedSubfolderId(null)
                setSelectedNoteId(null)
                setIsEditing(false)
              }}
            >
              <FileText className="w-4 h-4 mr-2 opacity-70" />
              All Notes
            </Button>
            <Button
              variant={selectedFolderId === 'Pinned' ? 'secondary' : 'ghost'}
              className={`w-full justify-start h-8 px-3 text-sm transition-all ${selectedFolderId === 'Pinned' ? 'bg-amber-500/20 text-amber-500' : 'hover:bg-white/5'}`}
              onClick={() => { 
                setSelectedFolderId('Pinned')
                setSelectedSubfolderId(null)
                setSelectedNoteId(null)
                setIsEditing(false)
              }}
            >
              <Pin className="w-4 h-4 mr-2 opacity-70" />
              Pinned
            </Button>
            <Button
              variant={selectedFolderId === 'Recent' ? 'secondary' : 'ghost'}
              className={`w-full justify-start h-8 px-3 text-sm transition-all ${selectedFolderId === 'Recent' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5'}`}
              onClick={() => { 
                setSelectedFolderId('Recent')
                setSelectedSubfolderId(null)
                setSelectedNoteId(null)
                setIsEditing(false)
              }}
            >
              <Clock className="w-4 h-4 mr-2 opacity-70" />
              Recent (7 Days)
            </Button>
            
            <div className="pt-4 space-y-2">
              <span className="px-2 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">Spaces</span>
              {folders.map(folder => (
                <div 
                  key={folder.id} 
                  className="space-y-1"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault()
                    const subfolderId = e.dataTransfer.getData('subfolderId')
                    if (subfolderId) {
                      try {
                        await fetch('/api/smart-notes', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'MOVE_SUBFOLDER', payload: { id: subfolderId, folderId: folder.id } })
                        })
                        fetchHierarchy()
                      } catch (err) {}
                    }
                  }}
                >
                  <div className={`flex items-center rounded-md px-1 group transition-all py-1 ${selectedFolderId === folder.id && !selectedSubfolderId ? 'bg-purple-500/10 text-purple-400' : 'hover:bg-white/5'}`}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-6 h-6 shrink-0 opacity-50 hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); toggleFolderDisplay(folder.id) }}
                    >
                      {folder.subfolders.length > 0 ? (
                        expandedFolders[folder.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                      ) : (
                         <span className="w-4 h-4" />
                      )}
                    </Button>
                    <div 
                      className="flex-1 flex flex-col justify-center px-2 cursor-pointer"
                      onClick={() => { 
                        setSelectedFolderId(folder.id)
                        setSelectedSubfolderId(null)
                        setSelectedNoteId(null)
                        setIsEditing(false)
                        setExpandedFolders(prev => ({...prev, [folder.id]: true}))
                      }}
                    >
                      <div className={`flex items-center text-sm font-medium ${selectedFolderId === folder.id && !selectedSubfolderId ? 'text-lime-400' : ''}`}>
                        {expandedFolders[folder.id] ? <FolderOpen className="w-4 h-4 mr-2 opacity-70 text-lime-400" /> : <Folder className="w-4 h-4 mr-2 opacity-70" />}
                        <span className="truncate">{folder.name}</span>
                      </div>
                      <div className="flex items-center text-[10px] text-muted-foreground/50 mt-0.5">
                        <span>{folder.totalNotes} notes</span>
                        {folder.lastUpdated && <>
                           <span className="mx-1">•</span>
                           <span>{formatDate(folder.lastUpdated)}</span>
                        </>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-black/90 backdrop-blur-xl border-white/10">
                        <DropdownMenuItem onClick={() => { setCreatingSubfolderFor(folder.id); setExpandedFolders(prev => ({...prev, [folder.id]: true})) }}>
                          <Plus className="w-4 h-4 mr-2 text-emerald-400" /> Add Subfolder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(folder.id, 'folder')} className="text-red-400 focus:text-red-300">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Space
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                
                  <AnimatePresence>
                    {expandedFolders[folder.id] && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pl-6 space-y-1 overflow-hidden">
                        {folder.subfolders.map(sub => (
                          <div 
                            key={sub.id}
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation()
                              e.dataTransfer.setData('subfolderId', sub.id)
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={async (e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              const noteId = e.dataTransfer.getData('noteId')
                              if (noteId) {
                                try {
                                  await fetch('/api/smart-notes', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'MOVE_NOTE', payload: { id: noteId, subfolderId: sub.id } })
                                  })
                                  fetchHierarchy()
                                } catch (err) {}
                              }
                            }}
                            className={`flex items-center w-full rounded-md px-2 py-1.5 cursor-pointer transition-colors ${selectedSubfolderId === sub.id ? 'bg-lime-500/10 border-l-2 border-lime-500' : 'hover:bg-white/5 border-l-2 border-transparent'}`}
                            onClick={() => { 
                              setSelectedFolderId(folder.id)
                              setSelectedSubfolderId(sub.id)
                              setSelectedNoteId(null)
                              setIsEditing(false)
                            }}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className={`text-xs font-medium truncate ${selectedSubfolderId === sub.id ? 'text-lime-400' : 'text-foreground/80'}`}>
                                {sub.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground/60 flex items-center justify-between mt-0.5">
                                <span>{sub.noteCount} notes</span>
                                <span>{formatDate(sub.lastUpdated)}</span>
                              </div>
                              {sub.preview && (
                                <p className="text-[9px] text-muted-foreground/40 truncate mt-0.5">
                                  {sub.preview}
                                </p>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" className="w-5 h-5 opacity-0 group-hover:opacity-100 lg:opacity-30 lg:hover:opacity-100 shrink-0 text-red-400" onClick={(e) => { e.stopPropagation(); handleDelete(sub.id, 'subfolder') }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        {creatingSubfolderFor === folder.id && (
                          <div className="flex items-center px-1 py-1 mt-1">
                            <Input 
                              ref={subfolderInputRef}
                              value={newSubfolderName}
                              onChange={(e) => setNewSubfolderName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveNewSubfolder()}
                              placeholder="Subfolder name..."
                              className="h-7 text-xs bg-black/40 border-border/50 px-2 flex-1 outline-none"
                            />
                            <Button variant="ghost" size="icon" className="w-6 h-6 ml-1 text-emerald-400" onClick={saveNewSubfolder}>
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-6 h-6 text-red-400" onClick={() => {setCreatingSubfolderFor(null); setNewSubfolderName('')}}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {creatingFolder && (
              <div className="flex items-center px-3 py-2 mt-2 bg-white/5 rounded-md border border-white/10">
                 <Folder className="w-4 h-4 mr-2 text-muted-foreground" />
                 <Input 
                    ref={folderInputRef}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveNewFolder()}
                    placeholder="New Space..."
                    className="h-7 text-xs bg-black/40 border-none px-2 flex-1 outline-none focus-visible:ring-0"
                 />
                 <Button variant="ghost" size="icon" className="w-6 h-6 ml-1 text-emerald-400" onClick={saveNewFolder}>
                   <Check className="w-3 h-3" />
                 </Button>
                 <Button variant="ghost" size="icon" className="w-6 h-6 text-red-400" onClick={() => {setCreatingFolder(false); setNewFolderName('')}}>
                   <X className="w-3 h-3" />
                 </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Pane 2: Notes List */}
      <div className="w-full md:w-80 border-r border-white/10 bg-black/10 flex flex-col shrink-0 h-64 md:h-full">
        <div className="p-4 border-b border-border/10 shrink-0 space-y-3">
          <div className="flex justify-between items-center">
             <div className="flex flex-col min-w-0 pr-4">
               <span className="font-semibold text-sm text-foreground truncate">
                 {folders.flatMap(f => f.subfolders).find(s => s.id === selectedSubfolderId)?.name 
                  || folders.find(f => f.id === selectedFolderId)?.name 
                  || selectedFolderId 
                  || 'All Notes'}
               </span>
               <span className="text-[10px] text-muted-foreground/60 tracking-wider uppercase">
                 {filteredNotes.length} notes
               </span>
             </div>
             <Button size="icon" variant="ghost" className="w-8 h-8 text-lime-400 bg-lime-500/10 hover:bg-lime-500/20 rounded-lg shrink-0" onClick={handleCreateNew} title="Create New Note">
               <Plus className="w-4 h-4" />
             </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-black/40 border-white/5 focus-visible:ring-lime-500/50 text-sm premium-transition"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <AnimatePresence mode="popLayout">
            {groupedNotes.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-8 text-muted-foreground/50">
                <FileText className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-xs text-center">No notes found here.</p>
              </motion.div>
            ) : (
              <div className="p-2 space-y-4">
                {groupedNotes.map(group => (
                  <div key={group.label}>
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2 opacity-70">{group.label}</h3>
                    <div className="space-y-1">
                      {group.notes.map(note => (
                        <motion.div
                          layout
                          key={note.id}
                          draggable
                          onDragStart={(e: any) => {
                            e.dataTransfer.setData('noteId', note.id)
                          }}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => { setSelectedNoteId(note.id); setIsEditing(false); }}
                          className={`p-3 rounded-xl cursor-pointer transition-all border shadow-sm ${
                            selectedNoteId === note.id 
                              ? 'bg-lime-500/20 border-lime-500/30 text-lime-50 shadow-inner' 
                              : 'bg-white/5 border-transparent hover:bg-white/10 text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1 gap-2">
                            <h4 className={`font-semibold text-sm truncate flex-1 ${selectedNoteId === note.id ? 'text-lime-300' : 'text-foreground'}`}>
                              <HighlightedText text={note.title} highlight={searchQuery} />
                            </h4>
                            {note.isPinned && <Pin className="w-3 h-3 text-amber-500 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                          </div>
                          <p className={`text-xs line-clamp-2 leading-relaxed mb-2 transition-opacity ${selectedNoteId === note.id ? 'opacity-90' : 'opacity-60'}`}>
                            <HighlightedText text={getPreviewContent(note.content, searchQuery)} highlight={searchQuery} />
                          </p>
                          <div className="flex items-center justify-between text-[10px] opacity-60">
                            <span className="font-medium">{formatDate(note.updatedAt)}</span>
                            {(!selectedSubfolderId) && (
                              <span className="truncate max-w-[120px] bg-black/40 rounded px-1.5 py-0.5">
                                {folders.flatMap(f => f.subfolders).find(s => s.id === note.subfolderId)?.name || 'Unknown'}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {filteredNotes.length > visibleCount && (
             <div className="p-4 flex justify-center border-t border-border/5 mt-2">
               <Button variant="ghost" className="text-xs text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10" onClick={() => setVisibleCount(p => p + 50)}>
                 Load More Notes
               </Button>
             </div>
          )}
        </ScrollArea>
      </div>

      {/* Pane 3: Editor */}
      <div className="flex-1 flex flex-col h-full bg-background/50 relative">
        {selectedNote || isEditing ? (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/10 shrink-0 glass-header">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex gap-2 w-full max-w-sm">
                    <select 
                      value={selectedNote?.subfolderId || ''}
                      onChange={(e) => {
                         const val = e.target.value
                         if (selectedNote) {
                           optimisticUpdateNote(selectedNote.id, { subfolderId: val })
                           setSaveStatus('unsaved')
                           debouncedSave(selectedNote.id, selectedNote.title, selectedNote.content, val, JSON.parse(selectedNote.tags || '[]'), selectedNote.isPinned)
                         }
                      }}
                      className="h-8 text-xs bg-black/40 border border-border/50 focus-visible:ring-lime-500/50 rounded-md px-2 text-foreground/80 outline-none"
                    >
                      <option value="" disabled>Select Subfolder</option>
                      {folders.flatMap(f => f.subfolders).map(sub => (
                        <option key={sub.id} value={sub.id}>{folders.find(f => f.id === sub.folderId)?.name} / {sub.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-muted-foreground px-2 py-1 rounded-md bg-white/5 border border-white/5">
                    <Folder className="w-3 h-3 mr-1.5 opacity-70 text-lime-400" />
                    <span className="truncate">
                      {folders.find(f => f.subfolders.some(s => s.id === selectedNote?.subfolderId))?.name} 
                      {' / '}
                      <span className="text-foreground">{folders.flatMap(f => f.subfolders).find(s => s.id === selectedNote?.subfolderId)?.name}</span>
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4 shrink-0">
                <span className={`text-[10px] font-medium uppercase tracking-wider hidden sm:inline-block ${saveStatus === 'saving' ? 'text-amber-500 animate-pulse' : saveStatus === 'unsaved' ? 'text-muted-foreground' : 'text-emerald-400'}`}>
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved changes' : 'Saved'}
                </span>

                {!isEditing ? (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-8 shadow-sm transition-all hover:border-lime-500/50 hover:bg-lime-500/10 hover:text-lime-400">
                    <Edit3 className="w-3.5 h-3.5 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setIsEditing(false)} className="h-8 bg-lime-500 hover:bg-lime-600 text-black shadow-[0_0_15px_rgba(132,204,22,0.4)]">
                    Done
                  </Button>
                )}

                {selectedNote && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-black/90 backdrop-blur-xl border-white/10">
                      <DropdownMenuItem onClick={(e) => togglePin(e as any, selectedNote)} className="hover:bg-white/10 cursor-pointer">
                        <Pin className="w-4 h-4 mr-2" />
                        {selectedNote.isPinned ? 'Unpin Note' : 'Pin Note'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendToTasks(selectedNote)} className="hover:bg-white/10 cursor-pointer text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/20">
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Send to Tasks
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportMarkdown} className="hover:bg-white/10 cursor-pointer text-blue-400 focus:text-blue-300 focus:bg-blue-500/20">
                        <FileText className="w-4 h-4 mr-2" />
                        Export Markdown
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-500/20 cursor-pointer" onClick={() => handleDelete(selectedNote.id, 'note')}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Note
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 w-full px-8 py-6 lg:px-12 lg:py-10">
              <div className="max-w-4xl mx-auto space-y-6">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={selectedNote?.title || ''}
                      onChange={handleTitleChange}
                      placeholder="Note Title"
                      className="w-full bg-transparent text-3xl md:text-5xl font-bold tracking-tight border-none outline-none placeholder:text-muted-foreground/30 text-foreground transition-all focus:placeholder:opacity-0"
                    />
                    
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {selectedNote ? (JSON.parse(selectedNote.tags || '[]') as string[]).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-400 text-xs flex items-center gap-1">
                          #{tag}
                          <button onClick={() => {
                             const newTags = JSON.parse(selectedNote.tags || '[]').filter((t: string) => t !== tag)
                             optimisticUpdateNote(selectedNote.id, { tags: JSON.stringify(newTags) })
                             debouncedSave(selectedNote.id, selectedNote.title, selectedNote.content, selectedNote.subfolderId, newTags, selectedNote.isPinned)
                          }} className="opacity-50 hover:opacity-100"><X className="w-3 h-3"/></button>
                        </span>
                      )) : null}
                      <input 
                        type="text" 
                        placeholder="Add tag..." 
                        className="bg-transparent border-none outline-none text-xs text-muted-foreground w-20 focus:w-32 transition-all placeholder:opacity-50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault()
                            const t = e.currentTarget.value.trim().replace(/^#/, '')
                            if (t && selectedNote) {
                               const currentTags = JSON.parse(selectedNote.tags || '[]')
                               if (!currentTags.includes(t)) {
                                 const newTags = [...currentTags, t]
                                 optimisticUpdateNote(selectedNote.id, { tags: JSON.stringify(newTags) })
                                 debouncedSave(selectedNote.id, selectedNote.title, selectedNote.content, selectedNote.subfolderId, newTags, selectedNote.isPinned)
                               }
                            }
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                    </div>
                    {/* AI Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-lg bg-black/40 border border-white/5 w-fit">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs text-purple-400 hover:bg-purple-500/20 hover:text-purple-300"
                        onClick={() => handleAiAction('summarize')}
                        disabled={isAiProcessing || !selectedNote?.content.trim()}
                      >
                        <Wand2 className={`w-3 h-3 mr-1.5 ${isAiProcessing ? 'animate-spin' : ''}`} />
                        Summarize
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs text-sky-400 hover:bg-sky-500/20 hover:text-sky-300"
                        onClick={() => handleAiAction('key_points')}
                        disabled={isAiProcessing || !selectedNote?.content.trim()}
                      >
                        <ListChecks className={`w-3 h-3 mr-1.5 ${isAiProcessing ? 'animate-spin' : ''}`} />
                        Key Points
                      </Button>
                      <div className="w-px h-4 bg-white/10 mx-1" />
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs text-muted-foreground hover:bg-white/10 hover:text-white"
                        onClick={handleFormatCollapsible}
                      >
                        <ChevronRight className="w-3 h-3 mr-1.5" />
                        Collapsible Block
                      </Button>
                    </div>

                    <Textarea
                      value={selectedNote?.content || ''}
                      onChange={handleContentChange}
                      placeholder="Start typing your note here..."
                      className="w-full min-h-[60vh] h-full bg-transparent border-none outline-none resize-none text-base md:text-lg leading-relaxed placeholder:text-muted-foreground/30 focus-visible:ring-0 p-0 shadow-none text-muted-foreground transition-all focus:text-foreground"
                    />
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground glow-text">
                      {selectedNote?.title}
                    </h1>
                    <div className="prose prose-invert prose-lg max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {selectedNote?.content}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 h-full p-8 text-center animate-in fade-in duration-700">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-white/5 border border-white/10 mb-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-500/10 to-transparent opacity-50" />
              <FileText className="w-10 h-10 opacity-60 text-lime-400" />
            </div>
            <h3 className="text-xl font-semibold text-foreground/80 mb-2">No Note Selected</h3>
            <p className="text-sm max-w-xs mb-8 opacity-70">Select a note from the left panel or click below to start drafting a new idea.</p>
            <Button className="bg-lime-500 hover:bg-lime-600 text-black shadow-[0_4px_20px_rgba(132,204,22,0.4)] rounded-full px-8 h-12 transition-all hover:scale-105" onClick={handleCreateNew}>
              <Plus className="w-5 h-5 mr-2" />
              Create Note
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
