import React from "react"

interface TaskBadgeProps {
  taskType: 'math' | 'qa' | 'summarize' | 'writing' | 'reasoning' | 'code' | 'general'
}

export function TaskBadge({ taskType }: TaskBadgeProps) {
  const getTaskConfig = (type: string) => {
    switch (type) {
      case 'math':
        return { label: 'Math', color: 'bg-blue-100 text-blue-800' }
      case 'qa':
        return { label: 'Q&A', color: 'bg-green-100 text-green-800' }
      case 'summarize':
        return { label: 'Summarize', color: 'bg-yellow-100 text-yellow-800' }
      case 'writing':
        return { label: 'Writing', color: 'bg-purple-100 text-purple-800' }
      case 'reasoning':
        return { label: 'Reasoning', color: 'bg-red-100 text-red-800' }
      case 'code':
        return { label: 'Code', color: 'bg-gray-100 text-gray-800' }
      default:
        return { label: 'General', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const config = getTaskConfig(taskType)

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}