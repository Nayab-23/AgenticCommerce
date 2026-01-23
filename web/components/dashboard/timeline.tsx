'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimelineStep {
  id: string
  title: string
  timestamp: string
  status: 'completed' | 'pending' | 'failed'
  description: string
  details?: Record<string, any>
}

interface TimelineProps {
  steps: TimelineStep[]
}

export function Timeline({ steps }: TimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(steps[0]?.id)

  const getStatusIcon = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
    }
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.id}>
          <Card
            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setExpandedId(expandedId === step.id ? null : step.id)}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1">{getStatusIcon(step.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-foreground">{step.title}</h4>
                  <span className="text-xs text-muted-foreground">{step.timestamp}</span>
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-muted-foreground transition-transform flex-shrink-0',
                  expandedId === step.id && 'rotate-180'
                )}
              />
            </div>

            {expandedId === step.id && step.details && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  {Object.entries(step.details).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="text-muted-foreground capitalize">{key}:</span>
                      <div className="font-mono text-xs bg-muted p-2 rounded mt-1 overflow-auto break-all">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
          {index < steps.length - 1 && (
            <div className="h-3 border-l-2 border-border ml-2.5" />
          )}
        </div>
      ))}
    </div>
  )
}
