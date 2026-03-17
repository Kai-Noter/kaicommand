'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Briefcase, HeartPulse, Zap, Code, Leaf } from 'lucide-react'

// Map of icons to render depending on context type
const CONTEXT_ICONS: Record<string, any> = {
  healthcare: HeartPulse,
  electrical: Zap,
  development: Code,
  farming: Leaf
}

interface WorkContextViewProps {
  workContexts: any[]
  switchContext: (id: string) => void
}

export function WorkContextView({ workContexts, switchContext }: WorkContextViewProps) {
  return (
    <motion.div
      key="context"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Work Context</h3>
          <p className="text-muted-foreground">Location-based context switching</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workContexts.map((ctx) => {
          const ContextIcon = CONTEXT_ICONS[ctx.type] || Briefcase
          return (
            <Card
              key={ctx.id}
              className={`glass-card cursor-pointer transition-all ${
                ctx.isActive ? 'ring-2 ring-offset-2 ring-offset-background' : ''
              }`}
              style={{ borderColor: ctx.isActive ? ctx.color : undefined }}
              onClick={() => switchContext(ctx.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${ctx.color}20` }}>
                    <ContextIcon className="w-6 h-6" style={{ color: ctx.color }} />
                  </div>
                  {ctx.isActive && (
                    <Badge className="bg-emerald-500/20 text-emerald-400">Active</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base">{ctx.name}</CardTitle>
                <CardDescription className="capitalize">{ctx.type}</CardDescription>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{ctx.location || 'No location set'}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </motion.div>
  )
}
