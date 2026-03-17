'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

// App type definition (can be extracted to external types later)
export interface AppType {
  id: string
  name: string
  description: string | null
  category: string | null
  status: string
  version: string | null
  uptime: number
  responseTime: number | null
  aiSuggestion?: string
}

interface AppManagerViewProps {
  apps: AppType[]
  addAppParent: (newApp: any) => Promise<void>
  deleteApp: (id: string) => Promise<void>
  getStatusColor: (status: string) => string
  getStatusBadge: (status: string) => string
}

export function AppManagerView({
  apps,
  addAppParent,
  deleteApp,
  getStatusColor,
  getStatusBadge
}: AppManagerViewProps) {
  const [addAppOpen, setAddAppOpen] = useState(false)
  const [newApp, setNewApp] = useState({ name: '', description: '', category: 'Other' })
  const [selectedApp, setSelectedApp] = useState<AppType | null>(null)

  const handleAddApp = async () => {
    await addAppParent(newApp)
    setAddAppOpen(false)
    setNewApp({ name: '', description: '', category: 'Other' })
  }

  return (
    <motion.div
      key="apps"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">App Manager</h3>
          <p className="text-muted-foreground">Monitor and manage your applications</p>
        </div>
        <Dialog open={addAppOpen} onOpenChange={setAddAppOpen}>
          <DialogTrigger asChild>
            <Button className="glass-button">
              <Plus className="w-4 h-4 mr-2" />
              Add App
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>Add New App</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>App Name</Label>
                <Input value={newApp.name} onChange={(e) => setNewApp({ ...newApp, name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={newApp.description} onChange={(e) => setNewApp({ ...newApp, description: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newApp.category} onValueChange={(v) => setNewApp({ ...newApp, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E-Commerce">E-Commerce</SelectItem>
                    <SelectItem value="Analytics">Analytics</SelectItem>
                    <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddAppOpen(false)}>Cancel</Button>
              <Button onClick={handleAddApp}>Add App</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app, index) => (
          <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className="glass-card hover:glow-sm transition-all cursor-pointer" onClick={() => setSelectedApp(app)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(app.status)}`} />
                    <div>
                      <CardTitle className="text-base">{app.name}</CardTitle>
                      <CardDescription>{app.category}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusBadge(app.status)} variant="outline">{app.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Uptime</p>
                    <p className="font-medium">{app.uptime}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Response</p>
                    <p className="font-medium">{app.responseTime}ms</p>
                  </div>
                </div>
                {app.aiSuggestion && (
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 mt-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">{app.aiSuggestion}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <p className="text-xs text-muted-foreground">v{app.version}</p>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); deleteApp(app.id) }}>
                  <Trash2 className="w-3 h-3 mr-1" />Remove
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
