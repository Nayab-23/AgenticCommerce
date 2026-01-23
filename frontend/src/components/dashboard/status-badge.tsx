import React from "react"

interface StatusBadgeProps {
  status: 'success' | 'failed' | 'pending'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success':
        return { label: '✓ Success', color: 'bg-green-100 text-green-800' }
      case 'failed':
        return { label: '✗ Failed', color: 'bg-red-100 text-red-800' }
      case 'pending':
        return { label: '● Pending', color: 'bg-yellow-100 text-yellow-800' }
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' }
    }
  }

  const config = getStatusConfig(status)

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}