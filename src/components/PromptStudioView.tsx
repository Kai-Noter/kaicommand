import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2, Sparkles, Copy, Loader2, Check, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function PromptStudioView() {
  const [inputText, setInputText] = useState('')
  const [outputPrompt, setOutputPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async (mode: 'enhance' | 'critique' = 'enhance') => {
    if (!inputText.trim()) return
    setIsLoading(true)
    setOutputPrompt('')
    
    try {
      const res = await fetch('/api/prompt-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawIdea: inputText, mode })
      })
      
      const data = await res.json()
      if (data.success && data.masterPrompt) {
        setOutputPrompt(data.masterPrompt)
      } else {
        setOutputPrompt('Error: Could not generate prompt. ' + (data.error || ''))
      }
    } catch (e: any) {
      setOutputPrompt('Error: ' + e.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (!outputPrompt) return
    navigator.clipboard.writeText(outputPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-purple-500" />
          Prompt Studio
        </h3>
        <p className="text-muted-foreground">Turn messy thoughts into highly structured Master Prompts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card className="glass-card shadow-lg border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-lime-500" />
              Raw Idea Input
            </CardTitle>
            <CardDescription>Paste your messy brainstorm, bullet points, or stream of consciousness here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Your Idea</Label>
              <Textarea
                placeholder="E.g., I want an AI that acts like a fierce critic for my agriculture business in Malawi..."
                className="min-h-[300px] resize-none border-white/10 bg-black/20 font-mono text-sm leading-relaxed"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-md"
                disabled={!inputText.trim() || isLoading}
                onClick={() => handleGenerate('enhance')}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                Generate Master Prompt
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-orange-500/50 text-orange-500 hover:bg-orange-500/10 hover:text-orange-400"
                disabled={!inputText.trim() || isLoading}
                onClick={() => handleGenerate('critique')}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Flame className="w-4 h-4 mr-2" />
                )}
                Fierce Critique
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Card */}
        <Card className="glass-card shadow-lg bg-gradient-to-b from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg text-emerald-400">Master Prompt Result</CardTitle>
              <CardDescription>Formatted, structured, and ready to use.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/5 hover:bg-white/10"
              onClick={handleCopy}
              disabled={!outputPrompt || isLoading}
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="min-h-[300px] flex items-center justify-center text-muted-foreground/50">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                    <Sparkles className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lime-400 animate-pulse" />
                  </div>
                  <p className="text-sm font-medium tracking-wider uppercase text-purple-400">Engineering structure...</p>
                </div>
              </div>
            ) : outputPrompt ? (
              <div className="relative group">
                <Textarea
                  readOnly
                  value={outputPrompt}
                  className="min-h-[350px] resize-none border-white/10 bg-black/40 font-mono text-[13px] leading-relaxed text-zinc-300 focus-visible:ring-emerald-500/50"
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              </div>
            ) : (
              <div className="min-h-[350px] flex items-center justify-center border border-dashed border-white/10 rounded-md bg-black/20 text-muted-foreground/50 text-sm text-center px-8">
                Your engineered Master Prompt will appear here. The structure will be optimized for role, context, task, and constraints.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
