import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
  variant?: "spinner" | "skeleton" | "overlay"
}

export function LoadingState({ 
  size = "md", 
  text, 
  className,
  variant = "spinner"
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (variant === "overlay") {
    return (
      <div className={cn(
        "fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center",
        className
      )}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
          {text && <p className="text-sm text-gray-600">{text}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  )
}

export function TableLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse flex space-x-4">
          <div className="rounded bg-gray-200 h-4 w-4"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CardLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  )
}