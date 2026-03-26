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
import { formatCurrency, formatCurrencyInt } from "@/lib/metas/utils"
import type { MonthData } from "@/lib/metas/utils"

interface MetaChartProps {
  data: MonthData
}

function fmtAxis(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
  return `${v}`
}

const LEGEND = [
  { label: "Meta", color: "#8b5cf6", dashed: true },
  { label: "Faturamento", color: "#95D600", dashed: false },
  { label: "Tráfego", color: "#f97316", dashed: true },
]

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

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-widest mb-3">
            Performance do Mês
          </p>

          {/* Faturamento + meta inline */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl font-[var(--font-data)] font-bold text-shogun-text-primary leading-none">
              {formatCurrencyInt(data.totalFaturamento)}
            </span>
            <span className="text-sm font-[var(--font-display)] text-shogun-text-muted">
              de {formatCurrencyInt(data.totalMeta)}
            </span>
          </div>

          {/* Tráfego */}
          {data.totalTrafego > 0 && (
            <p className="text-sm font-[var(--font-display)] mt-1.5" style={{ color: "#f97316" }}>
              {formatCurrencyInt(data.totalTrafego)} via Meta Ads
            </p>
          )}
        </div>

        {/* Right: % badge */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(149,214,0,0.25) 0%, rgba(149,214,0,0.08) 100%)",
            border: "2px solid rgba(149,214,0,0.5)",
          }}
        >
          <span className="text-xl font-[var(--font-data)] font-bold text-shogun-accent leading-none">
            {data.percentAtingido.toFixed(0)}%
          </span>
          <span className="text-[9px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wide mt-0.5">
            concluído
          </span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="space-y-1.5">
        <div className="h-2 bg-shogun-bg-base rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #95D600 0%, #f97316 100%)",
            }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-[var(--font-display)] text-shogun-text-muted">
          <span>R$ 0</span>
          <span>{formatCurrencyInt(data.totalMeta)}</span>
        </div>
      </div>

      {/* ── Legend pills ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {LEGEND.map(({ label, color, dashed }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-[var(--font-display)] font-medium"
            style={{
              border: `1px solid ${color}55`,
              background: `${color}18`,
              color,
            }}
          >
            <svg width="14" height="6" className="shrink-0">
              <line
                x1="0" y1="3" x2="14" y2="3"
                stroke={color}
                strokeWidth="2"
                strokeDasharray={dashed ? "4 2" : "0"}
              />
            </svg>
            {label}
          </div>
        ))}
      </div>

      {/* ── Chart ── */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A5444" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#4A6A5A", fontSize: 11, fontFamily: "var(--font-display)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtAxis}
            tick={{ fill: "#4A6A5A", fontSize: 10, fontFamily: "var(--font-display)" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111F1A",
              border: "1px solid #2A5444",
              borderRadius: 8,
              fontFamily: "var(--font-display)",
              fontSize: 12,
            }}
            labelStyle={{ color: "#E8F0EB", marginBottom: 4, fontWeight: 600 }}
            formatter={(v: number, name: string) => [formatCurrency(v), name]}
          />
          <Line
            type="linear" dataKey="Meta" stroke="#8b5cf6" strokeWidth={2}
            strokeDasharray="6 3" dot={{ fill: "#8b5cf6", r: 4 }} activeDot={{ r: 6 }}
          />
          <Line
            type="linear" dataKey="Faturamento" stroke="#95D600" strokeWidth={2}
            dot={{ fill: "#95D600", r: 4 }} activeDot={{ r: 6 }}
          />
          <Line
            type="linear" dataKey="Tráfego" stroke="#f97316" strokeWidth={2}
            strokeDasharray="6 3" dot={{ fill: "#f97316", r: 4 }} activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
