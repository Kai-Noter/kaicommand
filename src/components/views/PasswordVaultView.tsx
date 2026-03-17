'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ShieldCheck, PlusCircle, Key, RefreshCw, ClipboardCheck, Copy, Loader2, EyeOff, Eye, Trash } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface PasswordEntryType {
  id: string
  website: string
  username: string
  password: string
  url: string | null
  notes: string | null
  category: string
  createdAt: Date
  lastUsed: Date | null
}

interface PasswordVaultViewProps {
  passwords: PasswordEntryType[]
  passwordsLoading: boolean
  addPasswordEntry: (entry: any) => Promise<void>
  deletePasswordEntry: (id: string) => Promise<void>
}

export function PasswordVaultView({
  passwords,
  passwordsLoading,
  addPasswordEntry,
  deletePasswordEntry
}: PasswordVaultViewProps) {
  const [showPassword, setShowPassword] = useState<string | null>(null)
  const [addPasswordOpen, setAddPasswordOpen] = useState(false)
  const [newPassword, setNewPassword] = useState({ website: '', username: '', password: '', url: '', notes: '', category: 'Personal' })
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null)
  
  // Password Generator states
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [passwordLength, setPasswordLength] = useState(16)
  const [passwordOptions, setPasswordOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  })

  // Calculate password strength
  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (password.length >= 16) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    
    if (strength <= 2) return { label: 'Weak', color: 'text-red-500', bg: 'bg-red-500' }
    if (strength <= 4) return { label: 'Fair', color: 'text-amber-500', bg: 'bg-amber-500' }
    if (strength <= 6) return { label: 'Strong', color: 'text-lime-500', bg: 'bg-lime-500' }
    return { label: 'Very Strong', color: 'text-emerald-500', bg: 'bg-emerald-500' }
  }

  const generatePassword = () => {
    let chars = ''
    if (passwordOptions.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (passwordOptions.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (passwordOptions.numbers) chars += '0123456789'
    if (passwordOptions.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    if (chars === '') chars = 'abcdefghijklmnopqrstuvwxyz'
    let password = ''
    for (let i = 0; i < passwordLength; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedPassword(password)
  }

  const copyPasswordToClipboard = async (password: string, id: string) => {
    try {
      await navigator.clipboard.writeText(password)
      setCopiedPassword(id)
      setTimeout(() => setCopiedPassword(null), 2000)
    } catch (error) {
      console.error('Failed to copy password:', error)
    }
  }

  const handleAddPassword = async () => {
    if (!newPassword.website || !newPassword.username || !newPassword.password) return
    await addPasswordEntry(newPassword)
    setNewPassword({ website: '', username: '', password: '', url: '', notes: '', category: 'Personal' })
    setAddPasswordOpen(false)
  }

  return (
    <motion.div
      key="passwords"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-lime-500" />
            Password Vault
          </h3>
          <p className="text-muted-foreground">Securely manage your passwords</p>
        </div>
        
        <Dialog open={addPasswordOpen} onOpenChange={setAddPasswordOpen}>
          <DialogTrigger asChild>
            <Button className="bg-lime-500 hover:bg-lime-600 text-black tap-target">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Password
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>Add Password Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Website/Service</Label>
                <Input value={newPassword.website} onChange={(e) => setNewPassword({ ...newPassword, website: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username/Email</Label>
                  <Input value={newPassword.username} onChange={(e) => setNewPassword({ ...newPassword, username: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={newPassword.category} onValueChange={(v) => setNewPassword({ ...newPassword, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Password</Label>
                <div className="flex gap-2">
                    <Input type="password" value={newPassword.password} onChange={(e) => setNewPassword({ ...newPassword, password: e.target.value })} />
                    <Button variant="outline" onClick={() => { generatePassword(); setNewPassword({ ...newPassword, password: generatedPassword }) }}>Generate</Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddPasswordOpen(false)}>Cancel</Button>
              <Button onClick={handleAddPassword}>Save Password</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4" />
            Password Generator
          </CardTitle>
          <CardDescription>Generate secure random passwords</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={generatedPassword}
                readOnly
                placeholder="Click generate to create password"
                className="pr-10 font-mono"
              />
              {generatedPassword && (
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => copyPasswordToClipboard(generatedPassword, 'generated')}>
                  {copiedPassword === 'generated' ? <ClipboardCheck className="w-4 h-4 text-lime-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              )}
            </div>
            <Button onClick={generatePassword} className="bg-lime-500 hover:bg-lime-600 text-black">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          {generatedPassword && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className={`h-full transition-all ${getPasswordStrength(generatedPassword).bg}`}
                  style={{ width: `${Math.min(getPasswordStrength(generatedPassword).label === 'Weak' ? 25 : getPasswordStrength(generatedPassword).label === 'Fair' ? 50 : getPasswordStrength(generatedPassword).label === 'Strong' ? 75 : 100, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${getPasswordStrength(generatedPassword).color}`}>
                {getPasswordStrength(generatedPassword).label}
              </span>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Length</Label>
              <span className="text-sm font-mono text-lime-500">{passwordLength}</span>
            </div>
            <Input type="range" min={8} max={32} value={passwordLength} onChange={(e) => setPasswordLength(parseInt(e.target.value))} className="w-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={passwordOptions.uppercase} onCheckedChange={(checked) => setPasswordOptions(prev => ({ ...prev, uppercase: checked }))} />
              <span className="text-sm">ABC</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={passwordOptions.lowercase} onCheckedChange={(checked) => setPasswordOptions(prev => ({ ...prev, lowercase: checked }))} />
              <span className="text-sm">abc</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={passwordOptions.numbers} onCheckedChange={(checked) => setPasswordOptions(prev => ({ ...prev, numbers: checked }))} />
              <span className="text-sm">123</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={passwordOptions.symbols} onCheckedChange={(checked) => setPasswordOptions(prev => ({ ...prev, symbols: checked }))} />
              <span className="text-sm">@#$</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {passwordsLoading ? (
          <Card className="glass-card">
            <CardContent className="p-6 text-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading vault...
            </CardContent>
          </Card>
        ) : passwords.map((entry) => (
          <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-card hover:glow-sm transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-500/20 to-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-lime-500">{entry.website.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{entry.website}</h4>
                      <Badge variant="outline" className="text-[10px] shrink-0">{entry.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">{entry.username}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-1.5 bg-white/5 dark:bg-white/5 rounded-lg text-sm font-mono truncate">
                        {showPassword === entry.id ? entry.password : '••••••••••••'}
                      </code>
                      <Button variant="ghost" size="icon" className="shrink-0 tap-target" onClick={() => setShowPassword(showPassword === entry.id ? null : entry.id)}>
                        {showPassword === entry.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="shrink-0 tap-target" onClick={() => copyPasswordToClipboard(entry.password, entry.id)}>
                        {copiedPassword === entry.id ? <ClipboardCheck className="w-4 h-4 text-lime-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="shrink-0 text-red-400 hover:text-red-500 tap-target" onClick={() => deletePasswordEntry(entry.id)}>
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {!passwordsLoading && passwords.length === 0 && (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-semibold mb-2">No passwords saved</h4>
            <p className="text-sm text-muted-foreground mb-4">Add your first password to get started</p>
            <Button onClick={() => setAddPasswordOpen(true)} className="bg-lime-500 hover:bg-lime-600 text-black">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Password
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
