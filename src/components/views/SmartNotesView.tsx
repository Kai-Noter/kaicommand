'use client'

import { useState, useEffect, useRef } from 'react'
import { Folder, FileText, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
}

export function SmartNotesView() {
  const [subfolders, setSubfolders] = useState<SmartSubfolder[]>([])
  const [notes, setNotes] = useState<SmartNote[]>([])
  const [selectedSubfolderId, setSelectedSubfolderId] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  
  const [isTyping, setIsTyping] = useState(false)
  const typeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/smart-notes')
      const data = await res.json()
      if (data.success) {
        const allSubfolders: SmartSubfolder[] = []
        const allNotes: SmartNote[] = []
        
        data.folders.forEach((f: SmartFolder) => {
          f.subfolders.forEach(s => {
            allSubfolders.push({ id: s.id, name: s.name, folderId: s.folderId, notes: s.notes })
            allNotes.push(...s.notes)
          })
        })
        
        setSubfolders(allSubfolders)
        setNotes(allNotes)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubfolderClick = (subfolderId: string) => {
    setSelectedSubfolderId(subfolderId)
    setSelectedNoteId(null)
  }

  const visibleNotes = notes.filter(n => n.subfolderId === selectedSubfolderId)
  const selectedNote = notes.find(n => n.id === selectedNoteId)
  
  const handleEditorChange = async (title: string, content: string) => {
    setIsTyping(true)
    if (typeTimeoutRef.current) clearTimeout(typeTimeoutRef.current)
    if (!selectedSubfolderId) return

    if (!selectedNoteId) {
      const tempId = 'temp-' + Date.now()
      const newNote = {
         id: tempId,
         title: title || 'Untitled Note',
         content,
         subfolderId: selectedSubfolderId,
         updatedAt: new Date().toISOString()
      }
      setNotes(prev => [newNote, ...prev])
      setSelectedNoteId(tempId)

      try {
        const res = await fetch('/api/smart-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CREATE_NOTE',
            payload: { title: title || 'Untitled Note', content, subfolderId: selectedSubfolderId, tags: '[]' }
          })
        })
        const data = await res.json()
        if (data.success) {
          setNotes(prev => prev.map(n => n.id === tempId ? data.data : n))
          setSelectedNoteId(data.data.id)
        }
      } finally {
        setIsTyping(false)
      }
    } else {
      setNotes(prev => prev.map(n => n.id === selectedNoteId ? { ...n, title, content, updatedAt: new Date().toISOString() } : n))
      
      typeTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch('/api/smart-notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'UPDATE_NOTE',
              payload: { id: selectedNoteId, title, content, subfolderId: selectedSubfolderId }
            })
          })
        } finally {
          setIsTyping(false)
        }
      }, 1000)
    }
  }

  const handleDeleteSubfolder = async (id: string) => {
    await fetch(`/api/smart-notes?id=${id}&type=subfolder`, { method: 'DELETE' })
    if (selectedSubfolderId === id) {
       setSelectedSubfolderId(null)
       setSelectedNoteId(null)
    }
    fetchData()
  }

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/smart-notes?id=${id}&type=note`, { method: 'DELETE' })
    if (selectedNoteId === id) setSelectedNoteId(null)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-black/90 text-white overflow-hidden">
      
      <div className="w-64 border-r border-[#333] flex flex-col bg-zinc-950">
        <div className="p-4 border-b border-[#333] flex items-center justify-between">
          <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
            <Folder size={16} className="text-blue-400" /> Folders
          </h2>
        </div>
        <ScrollArea className="flex-1 p-2">
          {subfolders.map((sub, i) => (
            <div key={sub.id || i} className="group flex items-center justify-between px-2">
              <button 
                onClick={() => handleSubfolderClick(sub.id)}
                className={`flex-1 text-left p-2 rounded-md text-sm transition-colors ${selectedSubfolderId === sub.id ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
              >
                {sub.name}
              </button>
              <button onClick={() => handleDeleteSubfolder(sub.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-400/20 rounded">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </ScrollArea>
      </div>

      <div className="w-80 border-r border-[#333] flex flex-col bg-zinc-900/50">
        <div className="p-4 border-b border-[#333]">
          <h2 className="font-semibold text-zinc-100 mb-2">Notes</h2>
          {!selectedSubfolderId && <p className="text-xs text-zinc-500">Select a folder to view notes</p>}
        </div>
        <ScrollArea className="flex-1 p-2">
          {visibleNotes.map((note) => (
            <div 
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              className={`p-3 mb-2 rounded-lg cursor-pointer border transition-all ${selectedNoteId === note.id ? 'bg-zinc-800 border-zinc-600' : 'bg-transparent border-transparent hover:bg-zinc-800/50'}`}
            >
              <div className="flex items-start justify-between">
                 <h3 className="font-medium text-sm text-zinc-200 truncate pr-2">{note.title || 'Untitled Note'}</h3>
                 <button onClick={(e) => handleDeleteNote(note.id, e)} className="text-red-400/50 hover:text-red-400"><Trash2 size={12}/></button>
              </div>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{note.content || 'No content...'}</p>
            </div>
          ))}
        </ScrollArea>
      </div>

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
                 {isTyping ? 'Saving changes...' : 'All changes saved locally.'}
               </span>
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
          </div>
        )}
      </div>
    </div>
  )
}
