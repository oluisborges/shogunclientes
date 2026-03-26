"use client"

import { KpiCard, KpiCardSkeleton } from "@/components/ui/KpiCard"
import { useMetaData } from "@/lib/hooks/useMetaData"
import { formatBRL, formatPercent, formatMultiplier, formatNumber } from "@/lib/utils/currency"

export function KpiStrip() {
  const { aggregated, loading, error } = useMetaData()

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error || !aggregated) {
    return (
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="INVESTIMENTO" value="—" topAccent />
        <KpiCard label="CONVERSÕES" value="—" topAccent />
        <KpiCard label="CPA" value="—" topAccent />
        <KpiCard label="ROAS" value="—" topAccent />
      </div>
    )
  }

  const { totalSpend, totalConversions, avgCpa, avgRoas } = aggregated

  return (
    <div className="grid grid-cols-4 gap-4">
      <KpiCard
        label="INVESTIMENTO"
        value={formatBRL(totalSpend)}
        topAccent
      />
      <KpiCard
        label="CONVERSÕES"
        value={formatNumber(totalConversions)}
        topAccent
      />
      <KpiCard
        label="CPA"
        value={formatBRL(avgCpa)}
        topAccent
      />
      <KpiCard
        label="ROAS"
        value={formatMultiplier(avgRoas)}
        topAccent
      />
    </div>
  )
}
