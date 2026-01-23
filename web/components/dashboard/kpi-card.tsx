import React from "react"
import { Card } from '@/components/ui/card'
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface KpiCardProps {
  title: string
  value: string | number
  unit?: string
  tooltip?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  children?: React.ReactNode
}

export function KpiCard({ title, value, unit, tooltip, trend, children }: KpiCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {unit && <div className="text-sm text-muted-foreground mb-1">{unit}</div>}
      </div>
      {trend && (
        <div className={`text-xs mt-2 ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last period
        </div>
      )}
      {children}
    </Card>
  )
}
