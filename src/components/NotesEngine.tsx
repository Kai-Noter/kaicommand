'use client'

import React, { useState, useEffect } from 'react';

interface Note {
  id: string;
  content: string;
  subfolderId: string;
}

interface NotesEngineProps {
  selectedSubfolderId: string | null;
}

export function NotesEngine({ selectedSubfolderId }: NotesEngineProps) {
  // 1. INTERNAL STATE (INSIDE COMPONENT ONLY)
  // notes = []
  // selectedNoteId = null
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // When subfolder changes, clear note selection so we don't bleed states across folders
  useEffect(() => {
    // Defer to avoid eslint "setState in effect body" cascading-render warnings.
    const t = setTimeout(() => setSelectedNoteId(null), 0)
    return () => clearTimeout(t)
  }, [selectedSubfolderId]);

  // 3. NOTES LIST
  // Display: notes filtered by subfolderId
  const filteredNotes = notes.filter((n) => n.subfolderId === selectedSubfolderId);

  // The active content that should be in the editor right now
  const currentContent = selectedNoteId
    ? notes.find((n) => n.id === selectedNoteId)?.content || ''
    : '';

  // 4. EDITOR (CRITICAL LOGIC)
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;

    // IF selectedSubfolderId is null: -> do nothing (disable editor)
    if (!selectedSubfolderId) return;

    // IF selectedNoteId is null:
    if (!selectedNoteId) {
      // -> create new note
      const newId = Math.random().toString(36).substring(2, 9);
      const newNote: Note = {
        id: newId,
        content: text,
        subfolderId: selectedSubfolderId,
      };
      // -> add to notes array
      setNotes((prev) => [...prev, newNote]);
      // -> set selectedNoteId
      setSelectedNoteId(newId);
    } else {
      // ELSE: -> update existing note content
      setNotes((prev) =>
        prev.map((n) => (n.id === selectedNoteId ? { ...n, content: text } : n))
      );
    }
  };

  // 5. NOTE SELECTION
  // Clicking a note -> sets selectedNoteId -> loads content into editor
  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
  };

  return (
    <div className="flex h-full min-h-[500px] border border-border/50 rounded-xl overflow-hidden bg-background">
      {/* Sidebar: Notes List */}
      <div className="w-1/3 lg:w-1/4 flex flex-col border-r border-border/50 bg-accent/5">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Notes</h3>
          {selectedSubfolderId && (
            <button
              onClick={() => setSelectedNoteId(null)}
              className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              + New Note
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {!selectedSubfolderId && (
            <p className="text-xs text-muted-foreground text-center p-4">
              Select a subfolder
            </p>
          )}
          {selectedSubfolderId && filteredNotes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center p-4">
              No notes in this subfolder. Start typing to create one.
            </p>
          )}
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleSelectNote(note.id)}
              className={`p-3 rounded-lg cursor-pointer text-sm border transition-colors ${
                selectedNoteId === note.id
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-card border-border/50 hover:border-primary/50'
              }`}
            >
              <div className="font-medium truncate mb-1 text-foreground">
                {note.content.split('\n')[0] || 'Empty Note'}
              </div>
              <div className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-2">
                {note.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area: Editor */}
      <div className="flex-1 flex flex-col bg-card">
        <div className="flex-1 p-6">
          <textarea
            value={currentContent}
            onChange={handleEditorChange}
            disabled={!selectedSubfolderId}
            placeholder={
              !selectedSubfolderId
                ? 'Select a subfolder to enable the editor...'
                : 'Start typing to create a new note...'
            }
            className="w-full h-full resize-none outline-none bg-transparent text-sm disabled:opacity-50 text-foreground"
          />
        </div>
      </div>
    </div>
  );
}
