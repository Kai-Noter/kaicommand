'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, FolderOpen, FileText, Plus, Search, Pin, Trash2, MoreVertical, Edit3, ChevronRight, ChevronDown, Check, X, Sparkles, Wand2, ListChecks, CheckSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface SmartNote {
  id: string
  title: string
  content: string
  folder: string
  subfolder?: string | null
  tags: string
  isPinned: boolean
  updatedAt: Date
}

interface SmartNotesViewProps {
  notes: SmartNote[]
  onSaveNote: (note: Partial<SmartNote>) => Promise<any>
  onDeleteNote: (id: string) => Promise<void>
}

// Helper to debounce save calls
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    const id = setTimeout(() => {
      callback(...args)
    }, delay)
    setTimeoutId(id)
  }, [callback, delay, timeoutId])
}

export function SmartNotesView({ notes, onSaveNote, onDeleteNote }: SmartNotesViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedSubfolder, setSelectedSubfolder] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  
  // Explicit creation states so empty folders persist in memory during the session
  const [explicitFolders, setExplicitFolders] = useState<string[]>(['Vision', 'Flow', 'Memory', 'planning', 'completed'])
  const [explicitSubfolders, setExplicitSubfolders] = useState<Record<string, string[]>>({})
  
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingSubfolderFor, setCreatingSubfolderFor] = useState<string | null>(null)
  const [newSubfolderName, setNewSubfolderName] = useState('')
  const folderInputRef = useRef<HTMLInputElement>(null)
  const subfolderInputRef = useRef<HTMLInputElement>(null)

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  // Edit Buffer
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editFolder, setEditFolder] = useState('Notes')
  const [editSubfolder, setEditSubfolder] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [isAiProcessing, setIsAiProcessing] = useState(false)

  const handleAiAction = async (action: 'summarize' | 'key_points') => {
    if (!editContent.trim()) return
    setIsAiProcessing(true)
    try {
      const res = await fetch('/api/smart-notes/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent, action })
      })
      const data = await res.json()
      if (data.success && data.result) {
        setEditContent(prev => prev + '\n\n---\n**AI ' + (action === 'summarize' ? 'Summary' : 'Key Points') + ':**\n' + data.result)
      }
    } catch (err) {
      console.error('AI action failed', err)
    } finally {
      setIsAiProcessing(false)
    }
  }

  const handleFormatCollapsible = () => {
    setEditContent(prev => prev + '\n<details>\n  <summary>Click to expand</summary>\n  \n  Hidden content here...\n</details>\n')
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
    } catch (err) {
      console.error('Failed to send to tasks', err)
    }
  }

  // Derive folder structure incorporating explicitly created empty folders
  const folderStructure = useMemo(() => {
    const struct: Record<string, Set<string>> = {}
    
    explicitFolders.forEach(f => {
      if (!struct[f]) struct[f] = new Set()
      if (explicitSubfolders[f]) {
        explicitSubfolders[f].forEach(sub => struct[f].add(sub))
      }
    })

    notes.forEach(n => {
      const f = n.folder || 'Notes'
      if (!struct[f]) struct[f] = new Set()
      if (explicitSubfolders[f]) {
        explicitSubfolders[f].forEach(sub => struct[f].add(sub))
      }
      if (n.subfolder) struct[f].add(n.subfolder)
    })
    return struct
  }, [notes, explicitFolders, explicitSubfolders])

  const filteredNotes = useMemo(() => {
    return notes
      .filter(n => {
        // Handle "Smart Folders" First
        if (selectedFolder === 'Pinned') return n.isPinned
        if (selectedFolder === 'Recent') {
          const d = new Date(n.updatedAt)
          const today = new Date()
          const diffDays = Math.ceil((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
          return diffDays <= 7
        }
        
        if (!selectedFolder || selectedFolder === 'All Notes') return true
        
        const f = n.folder || 'Notes'
        if (f !== selectedFolder) return false
        if (selectedSubfolder && n.subfolder !== selectedSubfolder) return false
        return true
      })
      .filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [notes, selectedFolder, selectedSubfolder, searchQuery])

  // Group notes into time buckets for rendering in the middle pane
  const groupedNotes = useMemo(() => {
    const sorted = [...filteredNotes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
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

  const selectedNote = notes.find(n => n.id === selectedNoteId)

  // Sync edits when selected note changes
  useEffect(() => {
    if (selectedNote && !isEditing) {
      setEditTitle(selectedNote.title)
      setEditContent(selectedNote.content)
      setEditFolder(selectedNote.folder || 'Notes')
      setEditSubfolder(selectedNote.subfolder || '')
      setSaveStatus('saved')
    } else if (!selectedNote && !isEditing) {
      setEditTitle('')
      setEditContent('')
      
      const smartFolders = ['All Notes', 'Pinned', 'Recent']
      const activeFolder = (selectedFolder && !smartFolders.includes(selectedFolder)) ? selectedFolder : 'Flow'
      
      setEditFolder(activeFolder)
      setEditSubfolder(selectedSubfolder || '')
      setSaveStatus('saved')
    }
  }, [selectedNote, isEditing, selectedFolder, selectedSubfolder])

  // Focus inputs when creating folders
  useEffect(() => {
    if (creatingFolder && folderInputRef.current) folderInputRef.current.focus()
  }, [creatingFolder])

  useEffect(() => {
    if (creatingSubfolderFor && subfolderInputRef.current) subfolderInputRef.current.focus()
  }, [creatingSubfolderFor])

  const handleCreateNew = () => {
    setSelectedNoteId(null)
    setEditTitle('')
    setEditContent('')
    
    const smartFolders = ['All Notes', 'Pinned', 'Recent']
    const activeFolder = (selectedFolder && !smartFolders.includes(selectedFolder)) ? selectedFolder : 'Flow'
    
    setEditFolder(activeFolder)
    setEditSubfolder(selectedSubfolder || '')
    setIsEditing(true)
    setSaveStatus('unsaved')
  }

  const performSave = async (title: string, content: string, folder: string, subfolder: string) => {
    setIsSaving(true)
    setSaveStatus('saving')
    try {
      const savedNote = await onSaveNote({
        id: selectedNoteId || undefined,
        title: title || 'Untitled Note',
        content: content,
        folder: folder || 'Notes',
        subfolder: subfolder || null,
        isPinned: selectedNote ? selectedNote.isPinned : false,
        tags: selectedNote ? selectedNote.tags : '[]'
      })
      if (savedNote?.id && !selectedNoteId) {
         setSelectedNoteId(savedNote.id)
      }
      setSaveStatus('saved')
    } catch(e) {
      console.error(e)
      setSaveStatus('unsaved')
    } finally {
      setIsSaving(false)
    }
  }

  const debouncedSave = useDebounce(performSave, 1500)

  // Auto-save strictly in Edit mode when content changes
  useEffect(() => {
    if (isEditing && (editTitle !== selectedNote?.title || editContent !== selectedNote?.content || editFolder !== selectedNote?.folder || editSubfolder !== selectedNote?.subfolder)) {
      setSaveStatus('unsaved')
      debouncedSave(editTitle, editContent, editFolder, editSubfolder)
    }
  }, [editTitle, editContent, editFolder, editSubfolder, isEditing])

  const togglePin = async (e: React.MouseEvent, note: SmartNote) => {
    e.stopPropagation()
    await onSaveNote({ id: note.id, isPinned: !note.isPinned })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await onDeleteNote(id)
      if (selectedNoteId === id) {
        setSelectedNoteId(null)
        setIsEditing(false)
      }
    }
  }

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => ({...prev, [folder]: !prev[folder]}))
  }

  const saveNewFolder = () => {
    if (newFolderName.trim()) {
      const foldedName = newFolderName.trim()
      setExplicitFolders(prev => Array.from(new Set([...prev, foldedName])))
      setSelectedFolder(foldedName)
      setSelectedSubfolder(null)
      setExpandedFolders(prev => ({...prev, [foldedName]: true}))
    }
    setCreatingFolder(false)
    setNewFolderName('')
  }

  const saveNewSubfolder = () => {
    if (newSubfolderName.trim() && creatingSubfolderFor) {
      const subName = newSubfolderName.trim()
      const folderName = creatingSubfolderFor
      setExplicitSubfolders(prev => {
        const existing = prev[folderName] || []
        return {
          ...prev,
          [folderName]: Array.from(new Set([...existing, subName]))
        }
      })
      setSelectedFolder(folderName)
      setSelectedSubfolder(subName)
      setExpandedFolders(prev => ({...prev, [folderName]: true}))
    }
    setCreatingSubfolderFor(null)
    setNewSubfolderName('')
  }
  
  const formatDate = (dateString: Date) => {
    const d = new Date(dateString)
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return timeStr
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday`
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
      <div className="w-full md:w-64 border-r border-white/10 bg-black/20 flex flex-col shrink-0 h-48 md:h-full">
        <div className="p-4 flex items-center justify-between shrink-0">
          <span className="font-semibold text-xs text-muted-foreground tracking-widest uppercase">Folders</span>
        </div>
        <ScrollArea className="flex-1 px-2 py-2">
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">Smart Folders</span>
            <Button
              variant={selectedFolder === null || selectedFolder === 'All Notes' ? 'secondary' : 'ghost'}
              className={`w-full justify-start h-8 px-3 text-sm transition-all ${selectedFolder === 'All Notes' || selectedFolder === null ? 'bg-lime-500/20 text-lime-400' : 'hover:bg-white/5'}`}
              onClick={() => { setSelectedFolder('All Notes'); setSelectedSubfolder(null) }}
            >
              <FileText className="w-4 h-4 mr-2 opacity-70" />
              All Notes
            </Button>
            <Button
              variant={selectedFolder === 'Pinned' ? 'secondary' : 'ghost'}
              className={`w-full justify-start h-8 px-3 text-sm transition-all ${selectedFolder === 'Pinned' ? 'bg-amber-500/20 text-amber-500' : 'hover:bg-white/5'}`}
              onClick={() => { setSelectedFolder('Pinned'); setSelectedSubfolder(null) }}
            >
              <Pin className="w-4 h-4 mr-2 opacity-70" />
              Pinned
            </Button>
            <Button
              variant={selectedFolder === 'Recent' ? 'secondary' : 'ghost'}
              className={`w-full justify-start h-8 px-3 text-sm transition-all ${selectedFolder === 'Recent' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5'}`}
              onClick={() => { setSelectedFolder('Recent'); setSelectedSubfolder(null) }}
            >
              <FileText className="w-4 h-4 mr-2 opacity-70" />
              Recent (7 Days)
            </Button>
            
            <div className="pt-4 space-y-1">
              <span className="px-2 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">3-Space & Directories</span>
              {Object.entries(folderStructure).sort(([a],[b]) => a.localeCompare(b)).map(([folder, subfolders]) => (
                <div key={folder} className="space-y-1 mt-2">
                  <div className={`flex items-center rounded-md px-1 group transition-all ${selectedFolder === folder && !selectedSubfolder ? 'bg-purple-500/10 text-purple-400' : 'hover:bg-white/5'}`}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-6 h-6 shrink-0 opacity-50 hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); toggleFolder(folder) }}
                  >
                    {subfolders.size > 0 ? (
                      expandedFolders[folder] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                    ) : (
                       <span className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className={`flex-1 justify-start h-8 px-2 text-sm font-medium ${selectedFolder === folder && !selectedSubfolder ? 'text-lime-400' : ''}`}
                    onClick={() => { setSelectedFolder(folder); setSelectedSubfolder(null) }}
                  >
                    {expandedFolders[folder] ? <FolderOpen className="w-4 h-4 mr-2 opacity-70" /> : <Folder className="w-4 h-4 mr-2 opacity-70" />}
                    {folder}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); setCreatingSubfolderFor(folder); setExpandedFolders(prev => ({...prev, [folder]: true})) }}
                    title="New Subfolder"
                  >
                    <Plus className="w-3 h-3 text-muted-foreground hover:text-lime-500" />
                  </Button>
                </div>
                
                {expandedFolders[folder] && (
                  <div className="pl-6 space-y-1">
                    {Array.from(subfolders).sort().map(sub => (
                      <Button
                        key={`${folder}-${sub}`}
                        variant={selectedFolder === folder && selectedSubfolder === sub ? 'secondary' : 'ghost'}
                        className={`w-full justify-start h-7 px-3 text-xs transition-colors ${selectedFolder === folder && selectedSubfolder === sub ? 'bg-lime-500/10 text-lime-400' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
                        onClick={() => { setSelectedFolder(folder); setSelectedSubfolder(sub) }}
                      >
                        {sub}
                      </Button>
                    ))}
                    {creatingSubfolderFor === folder && (
                      <div className="flex items-center px-1 h-7">
                        <Input 
                          ref={subfolderInputRef}
                          value={newSubfolderName}
                          onChange={(e) => setNewSubfolderName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveNewSubfolder()}
                          placeholder="Subfolder name..."
                          className="h-6 text-xs bg-black/40 border-border/50 px-2 flex-1 outline-none"
                        />
                        <Button variant="ghost" size="icon" className="w-6 h-6 ml-1 text-emerald-400" onClick={saveNewSubfolder}>
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-6 h-6 text-red-400" onClick={() => {setCreatingSubfolderFor(null); setNewSubfolderName('')}}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            </div>

            {creatingFolder && (
              <div className="flex items-center px-2 py-1 mt-2">
                 <Folder className="w-4 h-4 mr-2 text-muted-foreground" />
                 <Input 
                    ref={folderInputRef}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveNewFolder()}
                    placeholder="New Folder..."
                    className="h-7 text-xs bg-black/40 border-border/50 px-2 flex-1 outline-none"
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
        <div className="p-3 border-t border-white/5 shrink-0">
          <Button variant="ghost" className="w-full justify-start text-xs text-muted-foreground hover:text-white hover:bg-white/5" onClick={() => setCreatingFolder(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Pane 2: Notes List */}
      <div className="w-full md:w-80 border-r border-white/10 bg-black/10 flex flex-col shrink-0 h-64 md:h-full">
        <div className="p-4 border-b border-border/10 shrink-0 space-y-3">
          <div className="flex justify-between items-center">
             <span className="font-semibold text-sm text-foreground truncate max-w-[200px]">
               {selectedFolder || 'All Notes'} {selectedSubfolder && `> ${selectedSubfolder}`}
             </span>
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
          <AnimatePresence>
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
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => { setSelectedNoteId(note.id); setIsEditing(false); }}
                          className={`p-3 rounded-xl cursor-pointer transition-all border ${
                            selectedNoteId === note.id 
                              ? 'bg-lime-500/20 border-lime-500/30 text-lime-50 shadow-inner' 
                              : 'bg-white/5 border-transparent hover:bg-white/10 text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h4 className={`font-semibold text-sm truncate pr-2 ${selectedNoteId === note.id ? 'text-lime-300' : 'text-foreground'}`}>{note.title}</h4>
                            {note.isPinned && <Pin className="w-3 h-3 text-amber-500 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                          </div>
                          <p className={`text-xs line-clamp-2 leading-relaxed mb-2 transition-opacity ${selectedNoteId === note.id ? 'opacity-90' : 'opacity-60'}`}>
                            {note.content.substring(0, 80) || 'Empty note'}
                          </p>
                          <div className="flex items-center justify-between text-[10px] opacity-60">
                            <span className="font-medium">{formatDate(note.updatedAt)}</span>
                            {(!selectedFolder || selectedFolder === 'All Notes') && (
                              <span className="truncate max-w-[100px] border border-white/10 rounded px-1.5 py-0.5">{note.folder}{note.subfolder ? `/${note.subfolder}` : ''}</span>
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
        </ScrollArea>
      </div>

      {/* Pane 3: Editor */}
      <div className="flex-1 flex flex-col h-full bg-background/50 relative">
        {selectedNote || isEditing ? (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/10 shrink-0 glass-header">
              <div className="flex items-center gap-2 flex-1">
                {isEditing ? (
                  <div className="flex gap-2 w-full max-w-sm">
                    <Input 
                      value={editFolder}
                      onChange={(e) => setEditFolder(e.target.value)}
                      className="h-8 text-xs bg-black/40 border-border/50 focus-visible:ring-lime-500/50"
                      placeholder="Folder"
                    />
                    <Input 
                      value={editSubfolder}
                      onChange={(e) => setEditSubfolder(e.target.value)}
                      className="h-8 text-xs bg-black/40 border-border/50 focus-visible:ring-lime-500/50"
                      placeholder="Subfolder (optional)"
                    />
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-muted-foreground px-2 py-1 rounded-md bg-white/5 border border-white/5">
                    <Folder className="w-3 h-3 mr-1.5 opacity-70 text-lime-400" />
                    <span className="hover:text-foreground cursor-pointer transition-colors" onClick={() => setSelectedFolder(selectedNote?.folder || null)}>{selectedNote?.folder}</span>
                    {selectedNote?.subfolder && (
                      <>
                        <ChevronRight className="w-3 h-3 mx-1 opacity-50" />
                        <span className="hover:text-foreground cursor-pointer transition-colors" onClick={() => { setSelectedFolder(selectedNote?.folder || null); setSelectedSubfolder(selectedNote?.subfolder || null) }}>{selectedNote.subfolder}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`text-[10px] font-medium uppercase tracking-wider ${saveStatus === 'saving' ? 'text-amber-500 animate-pulse' : saveStatus === 'unsaved' ? 'text-muted-foreground' : 'text-emerald-400'}`}>
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved changes' : 'Saved'}
                </span>

                {!isEditing ? (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-8 shadow-sm transition-all hover:border-lime-500/50 hover:bg-lime-500/10 hover:text-lime-400">
                    <Edit3 className="w-3.5 h-3.5 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => { debouncedSave(editTitle, editContent, editFolder, editSubfolder); setIsEditing(false) }} className="h-8 bg-lime-500 hover:bg-lime-600 text-black shadow-[0_0_15px_rgba(132,204,22,0.4)]">
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
                      <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-500/20 cursor-pointer" onClick={() => handleDelete(selectedNote.id)}>
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
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Note Title"
                      className="w-full bg-transparent text-3xl md:text-5xl font-bold tracking-tight border-none outline-none placeholder:text-muted-foreground/30 text-foreground transition-all focus:placeholder:opacity-0"
                    />
                    
                    {/* AI Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-lg bg-black/40 border border-white/5 w-fit">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs text-purple-400 hover:bg-purple-500/20 hover:text-purple-300"
                        onClick={() => handleAiAction('summarize')}
                        disabled={isAiProcessing || !editContent.trim()}
                      >
                        <Wand2 className={`w-3 h-3 mr-1.5 ${isAiProcessing ? 'animate-spin' : ''}`} />
                        Summarize
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs text-sky-400 hover:bg-sky-500/20 hover:text-sky-300"
                        onClick={() => handleAiAction('key_points')}
                        disabled={isAiProcessing || !editContent.trim()}
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
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
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

