"use client"

import { ShogunCard, ShogunCardSkeleton } from "@/components/ui/ShogunCard"
import { CircularProgress } from "@/components/charts/CircularProgress"
import { formatNumber } from "@/lib/utils/currency"
import type { PaceData } from "@/types/app"

interface MetasSummaryProps {
  paceData: PaceData | null
  targetUnits: number
  loading?: boolean
}

export function MetasSummary({ paceData, targetUnits, loading }: MetasSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <ShogunCardSkeleton key={i} className="h-[160px]" />
        ))}
      </div>
    )
  }

  const totalSold = paceData?.totalSold ?? 0
  const remaining = Math.max(targetUnits - totalSold, 0)

  return (
    <div className="grid grid-cols-3 gap-4">
      <ShogunCard>
        <p className="text-label">META MENSAL</p>
        <p className="font-[var(--font-data)] text-3xl font-extrabold text-shogun-text-primary mt-3">
          {formatNumber(targetUnits)}
        </p>
        <p className="text-shogun-text-muted text-xs font-[var(--font-display)] mt-1">
          marmitas
        </p>
      </ShogunCard>

      <ShogunCard className="flex items-center gap-4">
        <CircularProgress value={totalSold} max={targetUnits} label="atingido" />
        <div>
          <p className="text-label">REALIZADO</p>
          <p className="font-[var(--font-data)] text-2xl font-bold text-shogun-accent mt-1">
            {formatNumber(totalSold)}
          </p>
          <p className="text-shogun-text-muted text-xs font-[var(--font-display)]">
            marmitas
          </p>
        </div>
      </ShogunCard>

      <ShogunCard>
        <p className="text-label">RESTANTE</p>
        <p className="font-[var(--font-data)] text-3xl font-extrabold text-shogun-text-primary mt-3">
          {formatNumber(remaining)}
        </p>
        <p className="text-shogun-text-muted text-xs font-[var(--font-display)] mt-1">
          marmitas para a meta
        </p>
      </ShogunCard>
    </div>
  )
}
