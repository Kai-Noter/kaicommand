'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface CertificationType {
  id: string
  name: string
  type: string
  licenseNumber: string | null
  issueDate: Date | null
  expiryDate: Date | null
  status: string
  cpdHours: number
  requiredHours: number | null
}

interface CertificationsViewProps {
  certifications: CertificationType[]
  formatDate: (date: Date | string | null) => string
}

export function CertificationsView({ certifications, formatDate }: CertificationsViewProps) {
  return (
    <motion.div
      key="certifications"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Certifications & Compliance</h3>
          <p className="text-muted-foreground">Track licenses and CPD hours</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {certifications.map((cert) => {
          const daysUntilExpiry = cert.expiryDate
            ? Math.ceil((new Date(cert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null
          const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry < 90

          return (
            <Card key={cert.id} className={`glass-card ${isExpiringSoon ? 'border-amber-500/50' : ''}`}>
              <CardHeader className="pb-2">
                <Badge className={cert.type === 'electrical' ? 'bg-amber-500/20 text-amber-400' :
                  cert.type === 'healthcare' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-purple-500/20 text-purple-400'
                }>
                  {cert.type}
                </Badge>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-sm">{cert.name}</CardTitle>
                <div className="mt-2 text-xs text-muted-foreground">
                  Expires: {cert.expiryDate ? formatDate(cert.expiryDate) : 'N/A'}
                </div>
                {cert.requiredHours && cert.requiredHours > 0 && (
                  <Progress value={(cert.cpdHours / cert.requiredHours) * 100} className="h-1 mt-2" />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </motion.div>
  )
}
