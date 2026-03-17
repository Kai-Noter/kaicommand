'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  AppWindow,
  Mail,
  DollarSign,
  Shield,
  Clock,
  Zap,
  Siren
} from 'lucide-react'

// Types (simplified for props, ideally we extract these to an external file later)
type DashboardStatsProps = {
  tasks: any[]
  apps: any[]
  emails: any[]
  financeSummary: any
}

type DigestProps = {
  digest: any
}

interface DashboardViewProps extends DashboardStatsProps, DigestProps {
  handleTabChange: (tabId: string) => void
  setEmergencyModalOpen: (open: boolean) => void
}

export function DashboardView({
  tasks,
  apps,
  emails,
  financeSummary,
  digest,
  handleTabChange,
  setEmergencyModalOpen
}: DashboardViewProps) {
  // Dashboard stats
  const dashboardStats = [
    { label: 'Active Tasks', value: tasks.filter(t => t.status === 'active').length, icon: Activity, color: 'text-emerald-400' },
    { label: 'Apps Monitored', value: apps.length, icon: AppWindow, color: 'text-purple-400' },
    { label: 'Unread Emails', value: emails.filter(e => !e.isRead).length, icon: Mail, color: 'text-blue-400' },
    { label: 'Total Balance', value: `£${(financeSummary.balance || 0).toLocaleString()}`, icon: DollarSign, color: 'text-amber-400' }
  ]

  // Quick actions
  const quickActions = [
    { label: 'Scan Apps', icon: Shield, action: () => handleTabChange('apps') },
    { label: 'Check Emails', icon: Mail, action: () => handleTabChange('emails') },
    { label: 'Emergency', icon: Siren, action: () => setEmergencyModalOpen(true) }
  ]

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Welcome to <span className="gradient-text">KaiCommand</span>
              </h3>
              <p className="text-muted-foreground">
                Your AI Command Center for managing apps, emails, tasks, and finances.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center">
                <Shield className="w-10 h-10 text-sky-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guard panel – focus & wellbeing summary */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            Guard – Focus & wellbeing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Use the AI assistant (⌘⇧K) for focus tips, breathing prompts, and wellbeing suggestions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* While you were away + Proactive suggestions */}
      {(digest?.whileYouWereAway || (digest?.suggestions && digest.suggestions.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {digest?.whileYouWereAway && (
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  While you were away
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{digest.whileYouWereAway}</p>
              </CardContent>
            </Card>
          )}
          {digest?.suggestions && digest.suggestions.length > 0 && (
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Suggested actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {digest.suggestions.map((s: any, i: number) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="border-border/50 hover:bg-accent"
                      onClick={() => handleTabChange(s.tabId)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card hover:glow-sm transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex-col gap-2 border-border/50 hover:bg-accent"
                onClick={action.action}
              >
                <action.icon className="w-5 h-5" />
                <span>{action.label}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity (from audit log when available, else static) */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {(digest?.recentActivity && digest.recentActivity.length > 0
                  ? digest.recentActivity.map((activity: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate capitalize">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No recent activity. Switch context, add a task, or use the vault to see actions here.
                      </p>
                    )
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
