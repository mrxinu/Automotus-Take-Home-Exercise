import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'Something went wrong loading this data.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
      <AlertTriangle size={48} className="text-status-violation" aria-hidden="true" />
      <h2 className="text-lg font-semibold">Failed to load</h2>
      <p className="text-muted-foreground text-sm">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  )
}
