import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface ShogunCardProps {
  children: ReactNode
  className?: string
}

export function ShogunCard({ children, className }: ShogunCardProps) {
  return (
    <div
      className={cn(
        "bg-shogun-bg-surface border border-shogun-border rounded-md p-6",
        className
      )}
    >
      {children}
    </div>
  )
}

export function ShogunCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-shogun-bg-elevated border border-shogun-border rounded-md p-6 skeleton-pulse",
        className
      )}
    />
  )
}
