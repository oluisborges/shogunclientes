import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { TrendDirection } from "@/types/app"

interface TrendIndicatorProps {
  value: string
  direction: TrendDirection
  isGood?: boolean
}

export function TrendIndicator({
  value,
  direction,
  isGood,
}: TrendIndicatorProps) {
  const colorClass =
    isGood === true
      ? "text-shogun-accent"
      : isGood === false
        ? "text-shogun-danger"
        : "text-shogun-text-secondary"

  const Icon =
    direction === "up"
      ? TrendingUp
      : direction === "down"
        ? TrendingDown
        : Minus

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-[var(--font-data)] text-xs",
        colorClass
      )}
    >
      <Icon size={14} />
      {value}
    </span>
  )
}
