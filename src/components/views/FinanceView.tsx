'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TrendingUp } from 'lucide-react'

interface TransactionType {
  id: string
  description: string
  amount: number
  type: string
  category: string
  date: Date
}

interface FinanceViewProps {
  financeSummary: any
  transactions: TransactionType[]
  formatDate: (date: Date | string | null) => string
}

export function FinanceView({
  financeSummary,
  transactions,
  formatDate
}: FinanceViewProps) {
  return (
    <motion.div
      key="finance"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Finance Dashboard</h3>
          <p className="text-muted-foreground">Track income, expenses, and budgets</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="text-2xl font-bold text-emerald-400">£{(financeSummary.income || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-red-400">£{(financeSummary.expenses || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className={`text-2xl font-bold ${(financeSummary.balance || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              £{(financeSummary.balance || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Transactions</p>
            <p className="text-2xl font-bold">{transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-80">
            {transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground capitalize">{tx.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}£{tx.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  )
}
