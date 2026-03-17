'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Mic, Volume2 } from 'lucide-react'

interface VoiceNotesViewProps {
  voiceNotes: any[]
  submitVoiceNoteParent: (text: string) => Promise<void>
}

export function VoiceNotesView({ voiceNotes, submitVoiceNoteParent }: VoiceNotesViewProps) {
  const [voiceInput, setVoiceInput] = useState('')

  const submitVoiceNote = async () => {
    if (!voiceInput.trim()) return
    await submitVoiceNoteParent(voiceInput)
    setVoiceInput('')
  }

  return (
    <motion.div
      key="voice-notes"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Voice Documentation</h3>
          <p className="text-muted-foreground">Hands-free note-taking with AI categorization</p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-purple-400" />
            Record Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Type or paste your voice transcript here..."
            value={voiceInput}
            onChange={(e) => setVoiceInput(e.target.value)}
            className="min-h-32 bg-white/5 border-white/10"
          />
          <Button onClick={submitVoiceNote} disabled={!voiceInput.trim()} className="glass-button">
            <Volume2 className="w-4 h-4 mr-2" />
            Process with AI
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {voiceNotes.map((note) => (
          <Card key={note.id} className="glass-card">
            <CardHeader className="pb-2">
              <Badge className={note.category === 'patient_obs' ? 'bg-emerald-500/20 text-emerald-400' :
                note.category === 'electrical' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-purple-500/20 text-purple-400'
              }>
                {note.category.replace('_', ' ')}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm line-clamp-3">{note.transcript}</p>
              {note.summary && (
                <div className="mt-2 p-2 rounded bg-white/5 text-xs text-muted-foreground">
                  <span className="text-purple-400">AI:</span> {note.summary}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
