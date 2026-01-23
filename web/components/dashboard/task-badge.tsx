import { Badge } from '@/components/ui/badge'

interface TaskBadgeProps {
  taskType: 'math' | 'qa' | 'summarize' | 'writing' | 'reasoning' | 'code' | 'other'
}

const taskConfig: Record<string, { label: string; className: string }> = {
  math: { label: '∑ Math', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' },
  qa: { label: 'Q&A', className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' },
  summarize: { label: 'Summarize', className: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200' },
  writing: { label: 'Writing', className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200' },
  reasoning: { label: 'Reasoning', className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' },
  code: { label: 'Code', className: 'bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-200' },
  other: { label: 'Other', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
}

export function TaskBadge({ taskType }: TaskBadgeProps) {
  const config = taskConfig[taskType] || taskConfig.other
  return <Badge className={`font-medium ${config.className}`}>{config.label}</Badge>
}
