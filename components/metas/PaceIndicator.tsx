"use client"

import { ShogunCard } from "@/components/ui/ShogunCard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { cn } from "@/lib/utils"
import type { PaceData } from "@/types/app"

interface PaceIndicatorProps {
  paceData: PaceData
}

export function PaceIndicator({ paceData }: PaceIndicatorProps) {
  const { currentPace, requiredPace, isOnTrack } = paceData

  return (
    <ShogunCard>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-label">RITMO ATUAL DE VENDAS</p>
          <div className="flex items-baseline gap-3 mt-2">
            <span
              className={cn(
                "font-[var(--font-data)] text-[40px] font-bold leading-none",
                isOnTrack ? "text-shogun-accent" : "text-shogun-danger"
              )}
            >
              {currentPace}
            </span>
            <span className="text-shogun-text-secondary text-sm font-[var(--font-display)]">
              marmitas / dia
            </span>
          </div>
        </div>
        <StatusBadge status={isOnTrack ? "on-track" : "behind"} />
      </div>

      <p className="text-shogun-text-secondary text-sm font-[var(--font-display)] mt-4">
        Para atingir a meta, o ritmo necessário é:{" "}
        <span className="font-[var(--font-data)] text-shogun-text-primary font-medium">
          {requiredPace}/dia
        </span>
      </p>
    </ShogunCard>
  )
}
