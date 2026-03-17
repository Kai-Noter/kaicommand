'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface EmergencyProtocolType {
  id: string
  title: string
  type: string
  description: string | null
  steps: string
  contacts: string
  isQuickAccess: boolean
  priority: number
}

interface EmergencyViewProps {
  emergencyProtocols: EmergencyProtocolType[]
  setSelectedProtocol: (protocol: EmergencyProtocolType | null) => void
  setEmergencyModalOpen: (open: boolean) => void
}

export function EmergencyView({
  emergencyProtocols,
  setSelectedProtocol,
  setEmergencyModalOpen
}: EmergencyViewProps) {
  return (
    <motion.div
      key="emergency"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Emergency Protocols</h3>
          <p className="text-muted-foreground">Quick reference for high-stress scenarios</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {emergencyProtocols.map((protocol) => (
          <Card
            key={protocol.id}
            className="glass-card cursor-pointer hover:glow-sm transition-all"
            onClick={() => {
              setSelectedProtocol(protocol)
              setEmergencyModalOpen(true)
            }}
          >
            <CardHeader className="pb-2">
              <Badge className={protocol.type === 'electrical' ? 'bg-amber-500/20 text-amber-400' :
                protocol.type === 'healthcare' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-purple-500/20 text-purple-400'
              }>
                {protocol.type}
              </Badge>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base">{protocol.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{protocol.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
