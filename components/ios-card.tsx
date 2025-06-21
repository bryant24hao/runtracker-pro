import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface IOSCardProps {
  children: ReactNode
  className?: string
}

export function IOSCard({ children, className }: IOSCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden",
        "backdrop-blur-sm bg-opacity-80",
        className,
      )}
    >
      {children}
    </div>
  )
}

interface IOSCardHeaderProps {
  children: ReactNode
  className?: string
}

export function IOSCardHeader({ children, className }: IOSCardHeaderProps) {
  return <div className={cn("px-4 py-3 border-b border-gray-100", className)}>{children}</div>
}

interface IOSCardContentProps {
  children: ReactNode
  className?: string
}

export function IOSCardContent({ children, className }: IOSCardContentProps) {
  return <div className={cn("px-4 py-3", className)}>{children}</div>
}

interface IOSCardFooterProps {
  children: ReactNode
  className?: string
}

export function IOSCardFooter({ children, className }: IOSCardFooterProps) {
  return <div className={cn("px-4 py-3 border-t border-gray-100", className)}>{children}</div>
}
