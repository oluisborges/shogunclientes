"use client"

import { Target, DollarSign, Award, TrendingUp } from "lucide-react"
import { formatCurrency, formatPercent } from "@/lib/metas/utils"
import type { MonthData } from "@/lib/metas/utils"

interface SummaryCardsProps {
  data: MonthData
  clientName?: string
}

export function SummaryCards({ data, clientName }: SummaryCardsProps) {
  const restante = Math.max(0, data.totalMeta - data.totalFaturamento)
  const trafegoPercentual =
    data.totalFaturamento > 0 ? (data.totalTrafego / data.totalFaturamento) * 100 : 0
  const atingido = data.totalFaturamento >= data.totalMeta

  const cards = [
    {
      label: "Meta Total",
      value: formatCurrency(data.totalMeta),
      sub: null as string | null,
      icon: Target,
      accent: "#8b5cf6",
    },
    {
      label: "Faturado",
      value: formatCurrency(data.totalFaturamento),
      sub: `${formatPercent(data.percentAtingido)} da meta`,
      icon: DollarSign,
      accent: "#95D600",
    },
    {
      label: "Restante",
      value: atingido ? "Meta atingida!" : formatCurrency(restante),
      sub: atingido ? null : `${formatPercent(data.percentAtingido)} concluído`,
      icon: Award,
      accent: atingido ? "#95D600" : "#f97316",
    },
    {
      label: "Tráfego Meta Ads",
      value: formatCurrency(data.totalTrafego),
      sub: clientName
        ? `${clientName} · ${formatPercent(trafegoPercentual)} do fat.`
        : `${formatPercent(trafegoPercentual)} do faturamento`,
      icon: TrendingUp,
      accent: "#f97316",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, icon: Icon, accent }) => (
        <div
          key={label}
          className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-4 flex flex-col gap-2 overflow-hidden"
          style={{ borderTop: `2px solid ${accent}` }}
        >
          {/* Label + icon */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider leading-tight">
              {label}
            </p>
            <Icon size={14} style={{ color: accent }} className="opacity-70 shrink-0" />
          </div>

          {/* Value */}
          <p
            className="text-lg font-[var(--font-data)] font-bold leading-tight truncate"
            style={{ color: accent }}
          >
            {value}
          </p>

          {/* Sub */}
          {sub && (
            <p
              className="text-[11px] font-[var(--font-display)] leading-tight truncate"
              style={{ color: accent, opacity: 0.75 }}
            >
              {sub}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
