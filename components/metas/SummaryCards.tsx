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
      sub: null,
      icon: Target,
      accent: "#8b5cf6",
      valueColor: "text-purple-400",
    },
    {
      label: "Faturado",
      value: formatCurrency(data.totalFaturamento),
      sub: `${formatPercent(data.percentAtingido)} da meta concluída`,
      icon: DollarSign,
      accent: "#95D600",
      valueColor: "text-shogun-accent",
    },
    {
      label: "Restante",
      value: formatCurrency(restante),
      sub: atingido ? "Meta atingida!" : null,
      icon: Award,
      accent: "#f97316",
      valueColor: "text-orange-400",
    },
    {
      label: "Tráfego Meta Ads",
      value: formatCurrency(data.totalTrafego),
      sub: clientName
        ? `${clientName} · ${formatPercent(trafegoPercentual)} do fat.`
        : `${formatPercent(trafegoPercentual)} do faturamento`,
      icon: TrendingUp,
      accent: "#f97316",
      valueColor: "text-orange-400",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, icon: Icon, accent, valueColor }) => (
        <div
          key={label}
          className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-5 relative overflow-hidden"
          style={{ borderTop: `2px solid ${accent}` }}
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider">
              {label}
            </p>
            <Icon size={16} style={{ color: accent }} className="opacity-60 shrink-0" />
          </div>
          <p className={`text-2xl font-[var(--font-data)] font-bold ${valueColor}`}>
            {value}
          </p>
          {sub && (
            <p className="text-xs font-[var(--font-display)] mt-1.5" style={{ color: accent }}>
              {sub}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
