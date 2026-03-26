"use client"

import { ProgressBar } from "@/components/ui/ProgressBar"
import { formatNumber } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import type { WeeklyProgress } from "@/types/app"

interface MetasTableProps {
  weeks: WeeklyProgress[]
}

export function MetasTable({ weeks }: MetasTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-shogun-bg-base border-b border-shogun-border">
            <th className="text-label px-4 py-3 text-left">SEMANA</th>
            <th className="text-label px-4 py-3 text-right">VENDAS</th>
            <th className="text-label px-4 py-3 text-right">META</th>
            <th className="text-label px-4 py-3 text-right">% ATINGIDO</th>
            <th className="text-label px-4 py-3 w-40">PROGRESSO</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, index) => {
            const percent = week.target > 0
              ? Math.round((week.unitsSold / week.target) * 100)
              : 0
            const isOnTrack = week.unitsSold >= week.target * 0.95

            return (
              <tr
                key={week.weekNumber}
                className={cn(
                  "border-b border-shogun-border/50",
                  index % 2 === 0 ? "bg-shogun-bg-surface" : "bg-shogun-bg-base"
                )}
              >
                <td className="px-4 py-3 text-sm text-shogun-text-primary font-[var(--font-display)]">
                  {week.label}
                </td>
                <td className="px-4 py-3 text-right font-[var(--font-data)] text-sm text-shogun-text-primary">
                  {formatNumber(week.unitsSold)}
                </td>
                <td className="px-4 py-3 text-right font-[var(--font-data)] text-sm text-shogun-text-secondary">
                  {formatNumber(week.target)}
                </td>
                <td className={cn(
                  "px-4 py-3 text-right font-[var(--font-data)] text-sm font-medium",
                  isOnTrack ? "text-shogun-accent" : "text-shogun-danger"
                )}>
                  {percent}%
                </td>
                <td className="px-4 py-3">
                  <ProgressBar
                    value={week.unitsSold}
                    max={week.target}
                    variant={isOnTrack ? "accent" : "danger"}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
