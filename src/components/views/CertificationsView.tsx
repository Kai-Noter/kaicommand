'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, ExternalLink, ShieldCheck } from 'lucide-react'

interface CertificationsViewProps {
  certifications?: any[]
  formatDate?: (date: Date | string | null) => string
}

export function CertificationsView({ certifications, formatDate }: CertificationsViewProps) {
  return (
    <motion.div
      key="certifications"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4"
    >
      <div className="p-6 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
        <ShieldCheck className="w-16 h-16 text-emerald-500" />
      </div>
      <div>
        <h3 className="text-3xl font-bold tracking-tight mb-3">Certifications & Compliance</h3>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
          Manage your licenses, professional development hours, and compliance documents in our dedicated secure portal.
        </p>
      </div>

      <Card className="glass-card w-full max-w-md border-emerald-500/30 shadow-2xl mt-8">
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-3 mt-4">
            <Award className="w-8 h-8 text-emerald-400" />
            Compliance Center
          </CardTitle>
          <CardDescription className="text-sm mt-2">
            Secure tracking for Malawi agriculture, development, and electrical certifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pb-8">
          <Button 
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md text-base h-12"
            onClick={() => window.open('https://kaicommand.com/compliance', '_blank')}
          >
            Open Compliance Portal
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground border-t border-border/50 pt-4 mt-2">
            This module has been separated for enhanced security and specialized audit logging.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
