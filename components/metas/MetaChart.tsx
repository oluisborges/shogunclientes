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
import { Lock } from "lucide-react"
import { formatCurrency, formatCurrencyInt } from "@/lib/metas/utils"
import type { MonthData } from "@/lib/metas/utils"

interface MetaChartProps {
  data: MonthData
}

function fmtAxis(v: number) {
  if (v === 0) return "R$0"
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
  // Include ALL weeks — future weeks have Meta value but no fat/tráfego
  const chartData = data.weeks.map((w) => ({
    name: `Sem ${w.weekNumber}`,
    Meta: w.meta,
    Faturamento: w.isFuture ? undefined : w.faturamento,
    Tráfego: w.isFuture || w.trafego === 0 ? undefined : w.trafego,
  }))

  const progress = Math.min(data.percentAtingido, 100)

  return (
    <div
      className="rounded-xl flex flex-col gap-5 overflow-hidden"
      style={{ background: "#1A3A31", border: "1px solid #2A5040", padding: "28px 32px" }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <p
            className="uppercase tracking-widest mb-4"
            style={{ fontSize: 11, fontFamily: "var(--font-display)", color: "#808080" }}
          >
            Performance do Mês
          </p>

          {/* Big value + "de R$..." inline */}
          <div className="flex items-baseline gap-4 flex-wrap">
            <span
              className="font-bold leading-none"
              style={{
                fontSize: 52,
                fontFamily: "var(--font-data)",
                color: "#E8F0EB",
                lineHeight: 1,
              }}
            >
              {formatCurrencyInt(data.totalFaturamento)}
            </span>
            <span
              style={{
                fontSize: 16,
                fontFamily: "var(--font-display)",
                color: "#808080",
                whiteSpace: "nowrap",
              }}
            >
              de {formatCurrencyInt(data.totalMeta)}
            </span>
          </div>

          {/* Tráfego */}
          {data.totalTrafego > 0 && (
            <p
              className="mt-2 font-medium"
              style={{ fontSize: 15, fontFamily: "var(--font-display)", color: "#f97316" }}
            >
              {formatCurrencyInt(data.totalTrafego)} via Meta Ads
            </p>
          )}
        </div>

        {/* Badge */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-center"
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,158,11,0.3) 0%, rgba(245,158,11,0.06) 100%)",
            border: "2px solid rgba(245,158,11,0.6)",
          }}
        >
          <Lock size={12} style={{ color: "#f59e0b", marginBottom: 2 }} />
          <span
            className="font-bold leading-none"
            style={{ fontSize: 22, fontFamily: "var(--font-data)", color: "#f59e0b" }}
          >
            {data.percentAtingido.toFixed(0)}%
          </span>
          <span
            className="uppercase tracking-wide mt-0.5"
            style={{ fontSize: 8, fontFamily: "var(--font-display)", color: "#b45309" }}
          >
            concluído
          </span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="space-y-1.5">
        <div
          className="rounded-full overflow-hidden"
          style={{ height: 6, background: "#223A32" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #95D600 0%, #f97316 100%)",
            }}
          />
        </div>
        <div
          className="flex justify-between"
          style={{ fontSize: 11, fontFamily: "var(--font-display)", color: "#808080" }}
        >
          <span>R$ 0</span>
          <span>{formatCurrencyInt(data.totalMeta)}</span>
        </div>
      </div>

      {/* ── Legend pills ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {LEGEND.map(({ label, color, dashed }) => (
          <div
            key={label}
            className="flex items-center gap-1.5"
            style={{
              border: `1px solid ${color}55`,
              background: `${color}18`,
              color,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 11,
              fontFamily: "var(--font-display)",
              fontWeight: 500,
            }}
          >
            <svg width="14" height="6" style={{ flexShrink: 0 }}>
              <line
                x1="0" y1="3" x2="14" y2="3"
                stroke={color}
                strokeWidth={2}
                strokeDasharray={dashed ? "4 2" : "0"}
              />
            </svg>
            {label}
          </div>
        ))}
      </div>

      {/* ── Chart ── */}
      <div style={{ background: "#122920", borderRadius: 10, padding: "16px 8px 8px" }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#223A32" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#808080", fontSize: 11, fontFamily: "var(--font-display)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtAxis}
              tick={{ fill: "#808080", fontSize: 10, fontFamily: "var(--font-display)" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A3A31",
                border: "1px solid #2A5040",
                borderRadius: 8,
                fontFamily: "var(--font-display)",
                fontSize: 12,
              }}
              labelStyle={{ color: "#E8F0EB", marginBottom: 4, fontWeight: 600 }}
              formatter={(v: number, name: string) => [formatCurrency(v), name]}
            />
            <Line
              type="linear" dataKey="Meta" stroke="#8b5cf6" strokeWidth={2}
              strokeDasharray="6 3" connectNulls={false}
              dot={{ fill: "#8b5cf6", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="linear" dataKey="Faturamento" stroke="#95D600" strokeWidth={2}
              connectNulls={false}
              dot={{ fill: "#95D600", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="linear" dataKey="Tráfego" stroke="#f97316" strokeWidth={2}
              strokeDasharray="6 3" connectNulls={false}
              dot={{ fill: "#f97316", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
