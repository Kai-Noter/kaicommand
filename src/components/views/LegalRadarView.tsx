'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Plus, Scale, Search, ShieldAlert, AlertCircle, ChevronRight, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LegalAlert {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  status: 'active' | 'resolved'
  createdAt: Date
}

interface LegalRadarViewProps {
  alerts: LegalAlert[]
}

export function LegalRadarView({ alerts }: LegalRadarViewProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  const getSeverityStyles = (severity: string) => {
    switch(severity) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'medium': return <AlertCircle className="w-5 h-5 text-amber-500" />
      default: return <ShieldAlert className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2"
      >
        <div>
          <h2 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 pb-2 flex items-center gap-3">
            <Scale className="w-10 h-10 text-red-500" />
            Legal Radar
          </h2>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">
            Real-time regulatory compliance & risk assessment
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <Button className="bg-white/5 hover:bg-white/10 text-foreground border border-white/10 shadow-sm rounded-xl px-6">
             <Search className="w-4 h-4 mr-2" /> Scan Now
           </Button>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4"
      >
        <AnimatePresence>
          {alerts.length === 0 ? (
            <motion.div variants={itemVariants} className="col-span-full">
               <Card className="glass-card rounded-[2rem] border-dashed border-2 border-white/10 bg-transparent flex flex-col items-center justify-center p-12 text-center h-[300px]">
                 <ShieldAlert className="w-12 h-12 text-emerald-500 mb-4 opacity-50" />
                 <h3 className="text-xl font-bold text-white mb-2">No Active Alerts</h3>
                 <p className="text-muted-foreground max-w-sm">Your systems and knowledge graph are currently compliant with known regulations.</p>
               </Card>
            </motion.div>
          ) : (
            alerts.map((alert) => (
              <motion.div
                 layout
                 variants={itemVariants}
                 key={alert.id}
                 className="glass-card rounded-[2rem] p-6 group relative overflow-hidden flex flex-col h-full hover:shadow-2xl transition-all duration-500 border border-white/5"
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  alert.severity === 'high' ? 'bg-red-500' :
                  alert.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                
                <div className="relative z-10 flex flex-col h-full pl-2">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(alert.severity)}
                      <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-wider uppercase ${getSeverityStyles(alert.severity)}`}>
                        {alert.severity} Risk
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-black/20 px-2 py-1 rounded-lg">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-3">
                    <h4 className="text-lg font-bold text-white leading-tight">
                      {alert.title}
                    </h4>
                    <p className="text-sm font-medium leading-relaxed text-gray-400 flex-1">
                      {alert.description}
                    </p>
                    
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <Button variant="ghost" className="w-full justify-between hover:bg-white/5 text-gray-300">
                        View Details
                        <ChevronRight className="w-4 h-4 ml-2 opacity-50" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
