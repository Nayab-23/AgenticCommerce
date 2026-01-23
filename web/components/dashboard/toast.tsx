'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface ToastProps {
  type: 'success' | 'error' | 'info'
  message: string
  duration?: number
  onClose?: () => void
}

export function Toast({ type, message, duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!visible) return null

  const styles = {
    success: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  }

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-3 ${styles[type]}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setVisible(false)
          onClose?.()
        }}
        className="ml-2 hover:opacity-70"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
