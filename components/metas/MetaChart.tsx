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
      name: `S${w.weekNumber}`,
      Meta: w.meta,
      Faturamento: w.faturamento,
      Tráfego: w.trafego,
    }))

  const progress = Math.min(data.percentAtingido, 100)

  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-5 flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        {/* Left: labels + values */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-widest mb-2">
            Performance do Mês
          </p>

          {/* Faturado */}
          <p className="text-[11px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider">
            Faturado
          </p>
          <p className="text-2xl font-[var(--font-data)] font-bold text-shogun-text-primary leading-tight truncate">
            {formatCurrency(data.totalFaturamento)}
          </p>

          {/* Meta */}
          <p className="text-xs font-[var(--font-display)] text-shogun-text-muted mt-0.5">
            Meta: {formatCurrency(data.totalMeta)}
          </p>

          {/* Tráfego */}
          {data.totalTrafego > 0 && (
            <p className="text-xs font-[var(--font-display)] mt-0.5" style={{ color: "#f97316" }}>
              {formatCurrency(data.totalTrafego)} via Meta Ads
            </p>
          )}
        </div>

        {/* Right: % badge */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-full"
          style={{
            border: "2px solid rgba(149,214,0,0.35)",
            background: "rgba(149,214,0,0.08)",
          }}
        >
          <span className="text-base font-[var(--font-data)] font-bold text-shogun-accent leading-none">
            {data.percentAtingido.toFixed(0)}%
          </span>
          <span className="text-[9px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wide mt-0.5">
            meta
          </span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="space-y-1">
        <div className="h-1.5 bg-shogun-bg-base rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #95D600 0%, #f97316 100%)",
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-[var(--font-display)] text-shogun-text-muted">
          <span>R$ 0</span>
          <span>{formatCurrency(data.totalMeta)}</span>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {LEGEND.map(({ label, color, dashed }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[var(--font-display)]"
            style={{
              border: `1px solid ${color}50`,
              background: `${color}14`,
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
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
            width={38}
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
            strokeDasharray="6 3" dot={{ fill: "#8b5cf6", r: 3 }} activeDot={{ r: 5 }}
          />
          <Line
            type="linear" dataKey="Faturamento" stroke="#95D600" strokeWidth={2}
            dot={{ fill: "#95D600", r: 3 }} activeDot={{ r: 5 }}
          />
          <Line
            type="linear" dataKey="Tráfego" stroke="#f97316" strokeWidth={2}
            strokeDasharray="6 3" dot={{ fill: "#f97316", r: 3 }} activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
