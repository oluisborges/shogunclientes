"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency, formatPercent } from "@/lib/metas/utils"
import type { MonthData } from "@/lib/metas/utils"

interface MetaChartProps {
  data: MonthData
}

function fmt(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
  return `${v}`
}

export function MetaChart({ data }: MetaChartProps) {
  const chartData = data.weeks
    .filter((w) => !w.isFuture)
    .map((w) => ({
      name: `Sem ${w.weekNumber}`,
      Meta: w.meta,
      Faturamento: w.faturamento,
      Tráfego: w.trafego,
    }))

  const progress = Math.min(data.percentAtingido, 100)

  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-[var(--font-display)] text-shogun-text-muted uppercase tracking-widest mb-1">
            Performance do Mês
          </p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl font-[var(--font-data)] font-bold text-shogun-text-primary">
              {formatCurrency(data.totalFaturamento)}
            </span>
            <span className="text-sm text-shogun-text-muted font-[var(--font-display)]">
              de {formatCurrency(data.totalMeta)}
            </span>
          </div>
          {data.totalTrafego > 0 && (
            <p className="text-sm font-[var(--font-display)] text-orange-400 mt-0.5">
              {formatCurrency(data.totalTrafego)} via Meta Ads
            </p>
          )}
        </div>

        {/* Badge % */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-shogun-accent/40 bg-shogun-accent/10">
          <span className="text-lg font-[var(--font-data)] font-bold text-shogun-accent leading-none">
            {data.percentAtingido.toFixed(0)}%
          </span>
          <span className="text-[9px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wide">
            concluído
          </span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="space-y-1">
        <div className="h-2 bg-shogun-bg-base rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #95D600, #f97316)",
            }}
          />
        </div>
        <div className="flex justify-between text-xs font-[var(--font-display)] text-shogun-text-muted">
          <span>R$0</span>
          <span>{formatCurrency(data.totalMeta)}</span>
        </div>
      </div>

      {/* Legend pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: "Meta", color: "#8b5cf6", dashed: true },
          { label: "Faturamento", color: "#95D600", dashed: false },
          { label: "Tráfego", color: "#f97316", dashed: true },
        ].map(({ label, color, dashed }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-[var(--font-display)]"
            style={{ borderColor: `${color}40`, backgroundColor: `${color}12`, color }}
          >
            <svg width="16" height="6">
              <line
                x1="0" y1="3" x2="16" y2="3"
                stroke={color}
                strokeWidth="2"
                strokeDasharray={dashed ? "4 2" : "0"}
              />
            </svg>
            {label}
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F4438" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#7A9E8E", fontSize: 11, fontFamily: "var(--font-display)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fill: "#7A9E8E", fontSize: 10, fontFamily: "var(--font-display)" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0D2B1E",
              border: "1px solid #1F4438",
              borderRadius: 8,
              fontFamily: "var(--font-display)",
              fontSize: 12,
            }}
            labelStyle={{ color: "#E8F5EE", marginBottom: 4 }}
            formatter={(v: number, name: string) => [formatCurrency(v), name]}
          />
          <Line type="linear" dataKey="Meta" stroke="#8b5cf6" strokeWidth={2}
            strokeDasharray="6 3" dot={{ fill: "#8b5cf6", r: 4 }} activeDot={{ r: 6 }} />
          <Line type="linear" dataKey="Faturamento" stroke="#95D600" strokeWidth={2}
            dot={{ fill: "#95D600", r: 4 }} activeDot={{ r: 6 }} />
          <Line type="linear" dataKey="Tráfego" stroke="#f97316" strokeWidth={2}
            strokeDasharray="6 3" dot={{ fill: "#f97316", r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
