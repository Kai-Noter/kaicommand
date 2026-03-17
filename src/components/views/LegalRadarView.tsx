'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Scale, Search, ShieldAlert, AlertCircle, ChevronDown, CheckCircle2, ChevronRight, RefreshCw, FileText } from 'lucide-react'
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

export function LegalRadarView({ alerts: initialAlerts }: LegalRadarViewProps) {
  const [alerts, setAlerts] = useState<LegalAlert[]>(initialAlerts)
  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'policies'>('active')
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const activeAlerts = alerts.filter(a => a.status === 'active')
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved')
  const highRiskCount = activeAlerts.filter(a => a.severity === 'high').length

  const fakeHealthScore = Math.max(0, 100 - (highRiskCount * 15) - (activeAlerts.filter(a => a.severity === 'medium').length * 5))

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({...prev, [id]: !prev[id]}))
  }

  const markResolved = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a))
  }

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'medium': return <AlertCircle className="w-4 h-4 text-amber-500" />
      default: return <ShieldAlert className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto">
      
      {/* 1. Hero Summary Metrics */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-start justify-between gap-6 px-2"
      >
        <div>
          <h2 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 pb-2 flex items-center gap-3">
            <Scale className="w-10 h-10 text-red-500" />
            Compliance Portal
          </h2>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">
            Enterprise Regulatory Tracking & Risk Dashboard
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-black/40 border border-white/5 p-4 rounded-2xl glass-card">
           <div className="text-center px-4 border-r border-white/10">
             <div className="text-3xl font-black text-white">{fakeHealthScore}%</div>
             <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Health Score</div>
           </div>
           <div className="text-center px-4 border-r border-white/10">
             <div className={`text-3xl font-black ${highRiskCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{highRiskCount}</div>
             <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Critical Risks</div>
           </div>
           <div className="text-center px-4">
             <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-9">
               <RefreshCw className="w-4 h-4 mr-2" />
               Run Audit
             </Button>
           </div>
        </div>
      </motion.div>

      {/* 2. Intelligent Tabs */}
      <div className="px-2">
        <div className="flex items-center gap-2 border-b border-border/10 pb-4">
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('active')}
            className={`rounded-full px-6 transition-all ${activeTab === 'active' ? 'bg-amber-500/10 text-amber-500 font-bold' : 'text-muted-foreground hover:text-white'}`}
          >
            Active Alerts <span className="ml-2 bg-amber-500/20 px-2 py-0.5 rounded-full text-[10px]">{activeAlerts.length}</span>
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('resolved')}
            className={`rounded-full px-6 transition-all ${activeTab === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 font-bold' : 'text-muted-foreground hover:text-white'}`}
          >
            Resolved <span className="ml-2 bg-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">{resolvedAlerts.length}</span>
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('policies')}
            className={`rounded-full px-6 transition-all ${activeTab === 'policies' ? 'bg-blue-500/10 text-blue-500 font-bold' : 'text-muted-foreground hover:text-white'}`}
          >
            Policies Database
          </Button>
        </div>
      </div>

      {/* 3. Data Table (Structured List) */}
      <motion.div 
        layout
        className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden glass-card mx-2 shadow-2xl"
      >
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-4 border-b border-white/5 bg-white/5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <div className="w-24">Severity</div>
          <div>Risk Description</div>
          <div className="w-32 hidden sm:block">Date Detected</div>
          <div className="w-10"></div>
        </div>

        <div className="divide-y divide-white/5">
          <AnimatePresence mode="popLayout">
            {(activeTab === 'active' ? activeAlerts : activeTab === 'resolved' ? resolvedAlerts : []).length === 0 ? (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center flex flex-col items-center">
                 <ShieldAlert className="w-12 h-12 text-emerald-500/50 mb-4" />
                 <h3 className="text-lg font-bold text-foreground">All Clear</h3>
                 <p className="text-sm text-muted-foreground">No records to display in this view.</p>
               </motion.div>
            ) : (
              (activeTab === 'active' ? activeAlerts : activeTab === 'resolved' ? resolvedAlerts : []).map(alert => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, backgroundColor: "rgba(0,0,0,0)" }}
                  animate={{ opacity: 1, backgroundColor: expandedRows[alert.id] ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0)" }}
                  exit={{ opacity: 0, height: 0 }}
                  key={alert.id}
                  className="group transition-colors"
                >
                  <div 
                    className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-4 cursor-pointer hover:bg-white/5 items-center"
                    onClick={() => toggleRow(alert.id)}
                  >
                    <div className="w-24 flex items-center">
                      <div className={`px-2.5 py-1 rounded-md border text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 ${getSeverityColor(alert.severity)}`}>
                        {getSeverityIcon(alert.severity)}
                        {alert.severity}
                      </div>
                    </div>
                    
                    <div className="font-semibold text-sm text-foreground truncate pr-4">
                      {alert.title}
                    </div>
                    
                    <div className="w-32 hidden sm:block text-xs text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div className="w-10 flex justify-end">
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${expandedRows[alert.id] ? 'rotate-180 text-white' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Row Content */}
                  <AnimatePresence>
                    {expandedRows[alert.id] && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-black/50 border-t border-white/5"
                      >
                        <div className="p-6 pl-[136px] pr-6 flex flex-col gap-4">
                          <p className="text-sm leading-relaxed text-gray-300 max-w-3xl">
                            {alert.description}
                          </p>
                          
                          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                            {activeTab === 'active' && (
                              <>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                                  <FileText className="w-3 h-3 mr-2" />
                                  Generate Mitigation Plan
                                </Button>
                                <Button size="sm" onClick={() => markResolved(alert.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                  <CheckCircle2 className="w-3 h-3 mr-2" />
                                  Mark as Resolved
                                </Button>
                              </>
                            )}
                            {activeTab === 'resolved' && (
                               <div className="text-xs text-emerald-500 flex items-center bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
                                 <CheckCircle2 className="w-4 h-4 mr-2" />
                                 Risk Mitigated
                               </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>

    </div>
  )
}
