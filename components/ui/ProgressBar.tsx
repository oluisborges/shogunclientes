import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max?: number
  variant?: "accent" | "danger"
  showLabel?: boolean
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  variant = "accent",
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 h-2 bg-shogun-bg-elevated rounded-sm overflow-hidden">
        <div
          className={cn(
            "h-full rounded-sm transition-all duration-500",
            variant === "accent"
              ? "bg-shogun-accent"
              : "bg-shogun-danger"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-[var(--font-data)] text-xs text-shogun-text-secondary w-10 text-right">
          {Math.round(percent)}%
        </span>
      )}
    </div>
  )
}
