"use client"

import { useClientContext } from "@/lib/hooks/useClientContext"
import { useMetas } from "@/lib/hooks/useMetas"
import { MetasSummary } from "@/components/metas/MetasSummary"
import { PaceIndicator } from "@/components/metas/PaceIndicator"
import { WeeklyBars } from "@/components/metas/WeeklyBars"
import { MetasTable } from "@/components/metas/MetasTable"
import { ShogunCard, ShogunCardSkeleton } from "@/components/ui/ShogunCard"

export default function MetasPage() {
  const { selectedClientId } = useClientContext()
  const { goal, weeklyProgress, paceData, loading } = useMetas()

  if (!selectedClientId) {
    return (
      <div className="text-center py-12">
        <p className="text-shogun-text-secondary">Selecione um cliente para visualizar as metas</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ShogunCardSkeleton key={i} className="h-[160px]" />
          ))}
        </div>
        <ShogunCardSkeleton className="h-[120px]" />
        <ShogunCardSkeleton className="h-[200px]" />
        <ShogunCardSkeleton className="h-[200px]" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="text-center py-12">
        <p className="text-shogun-text-secondary">Nenhuma meta cadastrada para este mês</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">
        Metas
      </h1>

      <MetasSummary
        paceData={paceData}
        targetUnits={goal.target_units}
      />

      {paceData && <PaceIndicator paceData={paceData} />}

      <WeeklyBars weeks={weeklyProgress} />

      <ShogunCard className="p-0 overflow-hidden">
        <MetasTable weeks={weeklyProgress} />
      </ShogunCard>
    </div>
  )
}
