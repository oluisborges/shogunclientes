"use client"

import { Target, DollarSign, Award, TrendingUp } from "lucide-react"
import { formatCurrencyInt, formatPercent } from "@/lib/metas/utils"
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
      value: formatCurrencyInt(data.totalMeta),
      sub: null as string | null,
      icon: Target,
      color: "#8b5cf6",
    },
    {
      label: "Faturado",
      value: formatCurrencyInt(data.totalFaturamento),
      sub: `${formatPercent(data.percentAtingido)} da meta concluída`,
      icon: DollarSign,
      color: "#95D600",
    },
    {
      label: "Restante",
      value: atingido ? "Meta atingida!" : formatCurrencyInt(restante),
      sub: atingido ? null : `${formatPercent(data.percentAtingido)} concluído`,
      icon: Award,
      color: atingido ? "#95D600" : "#f97316",
    },
    {
      label: "Tráfego Meta Ads",
      value: formatCurrencyInt(data.totalTrafego),
      sub: clientName
        ? `${clientName} · ${formatPercent(trafegoPercentual)} do fat.`
        : `${formatPercent(trafegoPercentual)} do faturamento`,
      icon: TrendingUp,
      color: "#f97316",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, icon: Icon, color }) => (
        <div
          key={label}
          className="bg-shogun-bg-elevated rounded-xl p-5 flex flex-col gap-3"
          style={{ border: `1px solid ${color}55` }}
        >
          {/* Label + icon */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider">
              {label}
            </p>
            <Icon size={15} style={{ color, opacity: 0.7 }} className="shrink-0" />
          </div>

          {/* Value */}
          <p
            className="text-2xl font-[var(--font-data)] font-bold leading-none truncate"
            style={{ color }}
          >
            {value}
          </p>

          {/* Sub */}
          {sub && (
            <p
              className="text-[11px] font-[var(--font-display)] leading-tight truncate"
              style={{ color, opacity: 0.7 }}
            >
              {sub}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
