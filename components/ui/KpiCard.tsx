import { cn } from "@/lib/utils"
import type { KpiCardProps } from "@/types/app"
import { TrendIndicator } from "./TrendIndicator"

export function KpiCard({
  label,
  value,
  trend,
  subtitle,
  topAccent = true,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-shogun-bg-surface border border-shogun-border rounded-md p-6 relative",
        topAccent && "border-t-2 border-t-shogun-accent"
      )}
    >
      <p className="text-label">{label}</p>
      <p className="font-[var(--font-data)] text-3xl font-extrabold text-shogun-accent mt-2 leading-none">
        {value}
      </p>
      {trend && (
        <div className="mt-2">
          <TrendIndicator
            value={trend.value}
            direction={trend.direction}
            isGood={trend.isGood}
          />
        </div>
      )}
      {subtitle && (
        <p className="text-shogun-text-muted text-xs font-[var(--font-display)] mt-2">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-shogun-bg-surface border border-shogun-border rounded-md p-6 border-t-2 border-t-shogun-bg-elevated">
      <div className="h-3 w-20 bg-shogun-bg-elevated rounded skeleton-pulse" />
      <div className="h-9 w-32 bg-shogun-bg-elevated rounded mt-3 skeleton-pulse" />
      <div className="h-3 w-16 bg-shogun-bg-elevated rounded mt-3 skeleton-pulse" />
    </div>
  )
}
