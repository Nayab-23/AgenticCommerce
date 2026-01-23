import { Badge } from '@/components/ui/badge'

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high'
}

const riskConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200' },
  high: { label: 'High', className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' },
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const config = riskConfig[level]
  return <Badge className={`font-medium ${config.className}`}>{config.label}</Badge>
}
