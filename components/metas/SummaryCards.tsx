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
          className="rounded-xl flex flex-col gap-3"
          style={{
            background: "#0F1E2A",
            border: `1px solid ${color}55`,
            padding: "20px 22px",
          }}
        >
          {/* Label + icon */}
          <div className="flex items-center justify-between gap-2">
            <p
              className="uppercase tracking-wider"
              style={{ fontSize: 11, fontFamily: "var(--font-display)", color: "#4A6A5A" }}
            >
              {label}
            </p>
            <Icon size={15} style={{ color, opacity: 0.65, flexShrink: 0 }} />
          </div>

          {/* Value */}
          <p
            className="font-bold leading-none truncate"
            style={{ fontSize: 28, fontFamily: "var(--font-data)", color }}
          >
            {value}
          </p>

          {/* Sub */}
          {sub && (
            <p
              className="leading-tight truncate"
              style={{ fontSize: 11, fontFamily: "var(--font-display)", color, opacity: 0.65 }}
            >
              {sub}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
