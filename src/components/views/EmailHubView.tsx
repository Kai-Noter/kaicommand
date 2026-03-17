'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Star } from 'lucide-react'

interface EmailType {
  id: string
  subject: string
  sender: string
  senderEmail: string
  preview: string | null
  content: string | null
  provider: string
  category: string
  priority: string
  isRead: boolean
  isStarred: boolean
  createdAt: Date
}

interface EmailHubViewProps {
  emails: EmailType[]
  emailStats: any
  markEmailRead: (id: string) => Promise<void>
  getProviderIcon: (provider: string) => string
  formatDate: (date: Date | string | null) => string
}

export function EmailHubView({
  emails,
  emailStats,
  markEmailRead,
  getProviderIcon,
  formatDate
}: EmailHubViewProps) {
  const [selectedEmail, setSelectedEmail] = useState<EmailType | null>(null)

  return (
    <motion.div
      key="emails"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Email Hub</h3>
          <p className="text-muted-foreground">Unified email management</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{emailStats.total || 0}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{emailStats.unread || 0}</p>
            <p className="text-sm text-muted-foreground">Unread</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{emailStats.starred || 0}</p>
            <p className="text-sm text-muted-foreground">Starred</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">By Provider</p>
            <div className="flex gap-1 flex-wrap">
              {Object.entries(emailStats.byProvider || {}).map(([provider, count]) => (
                <Badge key={provider} className={`${getProviderIcon(provider)} text-white text-xs`}>
                  {provider}: {count as number}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {emails.map((email) => (
              <div
                key={email.id}
                className={`p-4 border-b border-border/50 hover:bg-white/5 cursor-pointer ${!email.isRead ? 'bg-purple-500/5' : ''}`}
                onClick={() => { setSelectedEmail(email); markEmailRead(email.id) }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getProviderIcon(email.provider)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${!email.isRead ? '' : 'text-muted-foreground'}`}>{email.sender}</p>
                      <div className="flex items-center gap-2">
                        {email.isStarred && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                        <span className="text-xs text-muted-foreground">{formatDate(email.createdAt)}</span>
                      </div>
                    </div>
                    <p className={`text-sm truncate ${!email.isRead ? 'font-medium' : 'text-muted-foreground'}`}>{email.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{email.preview}</p>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  )
}
