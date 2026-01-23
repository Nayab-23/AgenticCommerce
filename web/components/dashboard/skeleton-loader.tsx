import { Card } from '@/components/ui/card'

interface SkeletonLoaderProps {
  rows?: number
  variant?: 'card' | 'table' | 'chart'
}

export function SkeletonLoader({ rows = 3, variant = 'card' }: SkeletonLoaderProps) {
  if (variant === 'table') {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 border-b border-border last:border-b-0">
            <div className="flex gap-4">
              <div className="h-6 w-24 bg-muted rounded animate-pulse" />
              <div className="h-6 flex-1 bg-muted rounded animate-pulse" />
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'chart') {
    return (
      <Card className="p-6">
        <div className="h-8 w-32 bg-muted rounded animate-pulse mb-6" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="h-4 w-24 bg-muted rounded animate-pulse mb-4" />
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
        </Card>
      ))}
    </div>
  )
}
