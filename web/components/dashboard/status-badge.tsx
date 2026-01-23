import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'success' | 'failed' | 'pending' | 'escalated'
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusConfig = {
    success: {
      className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
      defaultLabel: 'Success',
    },
    failed: {
      className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
      defaultLabel: 'Failed',
    },
    pending: {
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
      defaultLabel: 'Pending',
    },
    escalated: {
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
      defaultLabel: 'Escalated',
    },
  }

  const config = statusConfig[status]

  return (
    <Badge className={cn('font-medium', config.className)}>
      {label || config.defaultLabel}
    </Badge>
  )
}
