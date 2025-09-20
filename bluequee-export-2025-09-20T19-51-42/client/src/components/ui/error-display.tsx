import { AlertTriangle, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface ErrorDisplayProps {
  title?: string
  message: string
  variant?: "destructive" | "warning" | "info"
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  showIcon?: boolean
}

export function ErrorDisplay({
  title = "Error",
  message,
  variant = "destructive",
  onRetry,
  onDismiss,
  className,
  showIcon = true
}: ErrorDisplayProps) {
  const variantStyles = {
    destructive: "border-red-200 bg-red-50 text-red-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800", 
    info: "border-blue-200 bg-blue-50 text-blue-800"
  }

  return (
    <Alert className={cn(variantStyles[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          {showIcon && <AlertTriangle className="h-4 w-4 mt-0.5" />}
          <div>
            <AlertTitle className="mb-1">{title}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </Button>
            )}
          </div>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  )
}

export function InlineError({ message, className }: { message: string; className?: string }) {
  return (
    <p className={cn("text-sm text-red-600 flex items-center gap-1", className)}>
      <AlertTriangle className="h-3 w-3" />
      {message}
    </p>
  )
}

export function FormFieldError({ message }: { message?: string }) {
  if (!message) return null
  
  return (
    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" />
      {message}
    </p>
  )
}

interface ErrorBoundaryFallbackProps {
  error: Error
  resetError: () => void
}

export function ErrorBoundaryFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <h1 className="text-lg font-semibold text-gray-900">
            Something went wrong
          </h1>
        </div>
        <p className="text-gray-600 mb-4">
          An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
        </p>
        <div className="flex gap-2">
          <Button onClick={resetError} className="flex-1">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="text-sm text-gray-500 cursor-pointer">
              Error Details (Development)
            </summary>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}