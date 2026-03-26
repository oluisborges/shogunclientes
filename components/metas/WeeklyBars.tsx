"use client"

import { ShogunCard } from "@/components/ui/ShogunCard"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { formatNumber } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import type { WeeklyProgress } from "@/types/app"
import { getDayOfMonth, getDaysInMonth } from "@/lib/utils/dates"

interface WeeklyBarsProps {
  weeks: WeeklyProgress[]
}

export function WeeklyBars({ weeks }: WeeklyBarsProps) {
  const now = new Date()
  const dayOfMonth = getDayOfMonth()
  const totalDays = getDaysInMonth(now.getFullYear(), now.getMonth() + 1)
  const todayPercent = (dayOfMonth / totalDays) * 100

  return (
    <ShogunCard>
      <p className="text-label mb-4">PROGRESSO SEMANAL</p>

      <div className="relative">
        {/* TODAY line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-shogun-danger/60 z-10"
          style={{ left: `${todayPercent}%` }}
        >
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-[var(--font-data)] text-shogun-danger whitespace-nowrap">
            HOJE
          </span>
        </div>

        <div className="space-y-4 py-2">
          {weeks.map((week) => {
            const isOnTrack = week.unitsSold >= week.target * 0.95

            return (
              <div key={week.weekNumber} className="flex items-center gap-4">
                <span className="text-shogun-text-secondary text-xs font-[var(--font-display)] w-20 shrink-0">
                  {week.label}
                </span>
                <div className="flex-1">
                  <ProgressBar
                    value={week.unitsSold}
                    max={week.target}
                    variant={isOnTrack ? "accent" : "danger"}
                  />
                </div>
                <span className="font-[var(--font-data)] text-xs text-shogun-text-secondary w-28 text-right shrink-0">
                  {formatNumber(week.unitsSold)} / {formatNumber(week.target)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </ShogunCard>
  )
}
