'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Mic, Volume2, Square, Loader2, Play, Pause, ChevronRight, Activity, Trash2 } from 'lucide-react'

// Adding global types for SpeechRecognition since it's an experimental API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceNotesViewProps {
  voiceNotes: any[]
  submitVoiceNoteParent: (text: string, audioUrl?: string) => Promise<void>
  deleteVoiceNoteParent?: (id: string) => Promise<void>
}

export function VoiceNotesView({ voiceNotes, submitVoiceNoteParent, deleteVoiceNoteParent }: VoiceNotesViewProps) {
  const [voiceInput, setVoiceInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript
          }
          setVoiceInput(prev => {
             const isFinal = event.results[event.results.length - 1].isFinal
             return prev + (isFinal ? currentTranscript + ' ' : '')
          })
          
          if(!event.results[0].isFinal){
             setVoiceInput(currentTranscript)
          }
        }
        
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error)
        }
      } else {
        setSpeechSupported(false)
      }
    }
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(100) // Collect data chunk every 100ms
      setIsRecording(true)
      setVoiceInput('')

      if (recognitionRef.current) {
         try {
           recognitionRef.current.start()
         } catch(e) { /* Ignore if already started */ }
      }

    } catch (err) {
      console.error('Error accessing microphone', err)
      alert("Could not access microphone. Please ensure permissions are granted.")
    }
  }

  const stopRecordingAndSubmit = async () => {
    if (!mediaRecorderRef.current) return
    
    return new Promise<void>((resolve) => {
      if (recognitionRef.current) {
         try {
           recognitionRef.current.stop()
         } catch(e){}
      }

      mediaRecorderRef.current!.onstop = async () => {
        setIsUploading(true)
        setIsRecording(false)
        
        // Stop all audio tracks
        const tracks = mediaRecorderRef.current!.stream.getTracks()
        tracks.forEach(track => track.stop())

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        // Final transcript might need a moment to settle, we rely on the state `voiceInput`
        let currentText = voiceInput.trim()
        
        try {
           const formData = new FormData()
           formData.append("file", audioBlob, "recording.webm")

           const uploadRes = await fetch('/api/upload', {
             method: 'POST',
             body: formData
           })
           
           const uploadData = await uploadRes.json()
           
           if(uploadData.audioUrl) {
              const finalText = uploadData.transcript || currentText;
              await submitVoiceNoteParent(finalText || "Audio note", uploadData.audioUrl)
           } else {
              throw new Error("No URL returned from upload")
           }

        } catch (error) {
           console.error("Failed to upload audio:", error)
           // Fallback: submit text only if upload fails
           if (currentText) {
             await submitVoiceNoteParent(currentText)
           }
        } finally {
           setIsUploading(false)
           setVoiceInput('')
           resolve()
        }
      }
      
      mediaRecorderRef.current!.stop()
    })
  }

  const manuallySubmitText = async () => {
    if (!voiceInput.trim()) return
    setIsUploading(true)
    await submitVoiceNoteParent(voiceInput)
    setVoiceInput('')
    setIsUploading(false)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2"
      >
        <div>
          <h2 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 pb-2">
            Voice Documentation
          </h2>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">
            Hands-free note-taking with AI categorization & transcription
          </p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`glass-card rounded-[2rem] p-1 relative overflow-hidden transition-all duration-700 ${isRecording ? 'shadow-[0_0_60px_rgba(236,72,153,0.3)] border-pink-500/50' : 'shadow-xl'}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent transition-opacity duration-700 ${isRecording ? 'opacity-100' : 'opacity-0'}`} />
        
        <div className="bg-black/40 backdrop-blur-xl rounded-[1.8rem] p-6 lg:p-8 relative z-10 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${isRecording ? 'bg-pink-500/20 border-pink-500/40' : 'bg-purple-500/10 border-purple-500/20'}`}>
                {isRecording ? <Activity className="w-6 h-6 text-pink-400 animate-pulse" /> : <Mic className="w-6 h-6 text-purple-400" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{isRecording ? 'Listening...' : 'Record Note'}</h3>
                {isRecording && (
                   <div className="flex items-center gap-2 mt-1">
                     <span className="flex gap-1">
                       {[1,2,3,4,5].map(i => (
                         <motion.span 
                           key={i} 
                           animate={{ height: ["8px", "24px", "8px"] }} 
                           transition={{ duration: 1, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                           className="w-1 bg-pink-500 rounded-full"
                         />
                       ))}
                     </span>
                     <span className="text-xs font-semibold text-pink-400 tracking-wider uppercase ml-2">Recording</span>
                   </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <Textarea
              placeholder={isRecording ? "" : "Type or paste your voice transcript here, or hit record..."}
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              className="min-h-32 bg-white/5 border-white/10 rounded-2xl p-4 text-lg md:text-xl font-medium placeholder:text-gray-600 focus-visible:ring-purple-500/50 transition-all resize-none shadow-inner"
            />
            
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
               {!speechSupported && (
                  <p className="text-xs font-medium text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full border border-red-500/20">
                    Speech recognition is not supported in this browser.
                  </p>
               )}
               {speechSupported && <div />} {/* Spacer */}

               <div className="flex gap-3 w-full sm:w-auto">
                 {isRecording ? (
                    <Button onClick={stopRecordingAndSubmit} disabled={isUploading} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl px-8 py-6 shadow-lg shadow-pink-500/25 w-full sm:w-auto transform transition-transform hover:scale-105">
                      {isUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Square className="w-5 h-5 mr-2 fill-current" />}
                      Stop & Save
                    </Button>
                 ) : (
                    <Button onClick={startRecording} disabled={isUploading || !speechSupported} className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl px-8 py-6 shadow-lg shadow-purple-500/25 w-full sm:w-auto transform transition-transform hover:scale-105">
                      <Mic className="w-5 h-5 mr-2" />
                      Start Recording
                    </Button>
                 )}
                 
                 {!isRecording && voiceInput.trim() && (
                   <Button onClick={manuallySubmitText} disabled={isUploading} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl px-6 py-6 transition-colors w-full sm:w-auto">
                     <Volume2 className="w-4 h-4 mr-2 text-gray-400" />
                     Save Text Only
                   </Button>
                 )}
               </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4"
      >
        <AnimatePresence>
          {voiceNotes.map((note) => (
            <motion.div
               layout
               variants={itemVariants}
               key={note.id}
               className="glass-card rounded-[2rem] p-6 group relative overflow-hidden flex flex-col h-full hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-shadow duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold tracking-wider uppercase backdrop-blur-md ${
                    note.category === 'patient_obs' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    note.category === 'electrical' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  }`}>
                    {note.category.replace('_', ' ')}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    {deleteVoiceNoteParent && (
                      <button 
                        onClick={() => deleteVoiceNoteParent(note.id)}
                        className="p-1 rounded-md hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                        title="Delete recording"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col gap-4">
                  <p className="text-sm font-medium leading-relaxed text-gray-300 line-clamp-4 flex-1">
                    "{note.transcript}"
                  </p>
                  
                  {note.audioUrl && (
                     <div className="shrink-0 mt-4 bg-black/40 p-2 rounded-2xl border border-white/5 shadow-inner">
                       <audio controls src={note.audioUrl} className="w-full h-10 [&::-webkit-media-controls-panel]:bg-white/10 [&::-webkit-media-controls-play-button]:bg-purple-500 rounded-xl" />
                     </div>
                  )}

                  {note.summary && (
                    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/10 text-xs font-medium text-gray-400 shrink-0 relative overflow-hidden group-hover:border-purple-500/20 transition-colors">
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50" />
                      <span className="text-purple-400 font-bold mb-1.5 flex items-center gap-1.5">
                        <Activity className="w-3 h-3" /> AI Insight
                      </span> 
                      <p className="leading-relaxed">{note.summary}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
