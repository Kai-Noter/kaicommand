'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

interface InventoryItemType {
  id: string
  name: string
  category: string
  partNumber: string | null
  quantity: number
  minQuantity: number
  unit: string
  cost: number | null
  needsRestock: boolean
}

interface InventoryViewProps {
  inventory: InventoryItemType[]
}

export function InventoryView({ inventory }: InventoryViewProps) {
  return (
    <motion.div
      key="inventory"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Smart Inventory</h3>
          <p className="text-muted-foreground">Unified parts and supplies tracking</p>
        </div>
      </div>

      {inventory.filter(i => i.needsRestock).length > 0 && (
        <Card className="glass-card border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-medium text-amber-400">Restock Needed</p>
                <p className="text-sm text-muted-foreground">
                  {inventory.filter(i => i.needsRestock).length} items below minimum
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['electrical_parts', 'medical_supplies', 'dev_equipment'].map((cat) => (
          <Card key={cat} className="glass-card">
            <CardHeader>
              <CardTitle className="text-base capitalize">{cat.replace('_', ' ')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inventory.filter(i => i.category === cat).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.partNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${item.needsRestock ? 'text-amber-400' : ''}`}>
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
