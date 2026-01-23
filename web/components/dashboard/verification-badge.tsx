import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle } from 'lucide-react'

interface VerificationBadgeProps {
  passed: boolean
}

export function VerificationBadge({ passed }: VerificationBadgeProps) {
  return (
    <Badge className={passed ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'} variant="secondary">
      <div className="flex items-center gap-1">
        {passed ? (
          <>
            <CheckCircle className="h-3 w-3" />
            Pass
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3" />
            Fail
          </>
        )}
      </div>
    </Badge>
  )
}
