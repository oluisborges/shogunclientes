"use client"

import { ShogunCard, ShogunCardSkeleton } from "@/components/ui/ShogunCard"
import { useMetaData } from "@/lib/hooks/useMetaData"
import { formatBRL, formatMultiplier, formatNumber } from "@/lib/utils/currency"
import { TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiItem {
  label: string
  value: string
  comparison?: { value: string; isPositive: boolean }
  note: string
}

export function ResumoExecutivo() {
  const { aggregated, loading, error } = useMetaData()

  const kpis: KpiItem[] = aggregated
    ? [
        {
          label: "VALOR INVESTIDO (PERÍODO)",
          value: formatBRL(aggregated.totalSpend),
          comparison: { value: "-7.3% vs anterior", isPositive: false },
          note: "Período atual",
        },
        {
          label: "VALOR DA CONVERSÃO DA COMPRA",
          value: formatBRL(aggregated.totalRevenue),
          comparison: { value: "+15.9% vs anterior", isPositive: true },
          note: "Baseado no ROAS",
        },
        {
          label: "ROAS DE COMPRAS NO SITE",
          value: aggregated.avgRoas.toFixed(2),
          comparison: { value: "+25.0% vs anterior", isPositive: true },
          note: "",
        },
      ]
    : [
        { label: "VALOR INVESTIDO (PERÍODO)", value: "—", note: "" },
        { label: "VALOR DA CONVERSÃO DA COMPRA", value: "—", note: "" },
        { label: "ROAS DE COMPRAS NO SITE", value: "—", note: "" },
      ]

  return (
    <ShogunCard>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={18} className="text-shogun-text-secondary" />
        <h2 className="font-[var(--font-display)] font-semibold text-shogun-text-primary text-base">
          Resumo executivo
        </h2>
      </div>
      <p className="text-shogun-text-secondary text-xs font-[var(--font-display)] mb-5">
        Leitura rápida das métricas principais.
      </p>

      {/* KPI Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ShogunCardSkeleton key={i} className="h-[130px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {kpis.map((kpi) => (
            <KpiTile key={kpi.label} {...kpi} />
          ))}
        </div>
      )}
    </ShogunCard>
  )
}

function KpiTile({ label, value, comparison, note }: KpiItem) {
  return (
    <div className="bg-shogun-bg-elevated/50 border border-shogun-border/60 rounded-md p-5">
      <p className="text-label mb-3">{label}</p>
      <p className="font-[var(--font-data)] text-2xl md:text-3xl font-bold text-shogun-text-primary leading-none">
        {value}
      </p>
      <div className="flex items-center justify-between mt-3">
        {comparison ? (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-[var(--font-data)] font-medium",
              comparison.isPositive
                ? "bg-shogun-accent/12 text-shogun-accent"
                : "bg-shogun-danger/12 text-shogun-danger"
            )}
          >
            {comparison.value}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-[var(--font-display)] text-shogun-text-muted bg-shogun-bg-elevated border border-shogun-border/50">
            Sem base anterior
          </span>
        )}
        {note && (
          <span className="text-shogun-text-muted text-[11px] font-[var(--font-display)]">
            {note}
          </span>
        )}
      </div>
    </div>
  )
}
