"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Lock, LockOpen, Trophy } from "lucide-react"
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

// 36 confetti pieces: varied sizes, colors, positions, delays
const COLORS = ["#95D600", "#f97316", "#8b5cf6", "#ec4899", "#f59e0b", "#3b82f6", "#10b981", "#ef4444"]
const CONFETTI_PIECES = Array.from({ length: 36 }, (_, i) => ({
  color: COLORS[i % COLORS.length],
  left: `${3 + i * 2.6}%`,
  delay: (i * 0.055) % 0.9,
  size: 7 + (i % 5) * 3,
  rotate: i % 2 === 0 ? 360 : -360,
}))

function getMotivationalText(pct: number): string | null {
  if (pct >= 100) return null
  if (pct === 0) return "Vamos começar com força total! 💪"
  if (pct < 25) return "Bom início! Continue empurrando! 🚀"
  if (pct < 50) return "Ótimo ritmo! Você está no caminho certo! 🔥"
  if (pct < 75) return "Na metade do caminho, não pare agora! ⚡"
  if (pct < 90) return "Quase lá! Acelera os últimos esforços! 💥"
  return "Falta pouquinho! Vai com tudo! 🎯"
}

export function MetaChart({ data }: MetaChartProps) {
  const chartData = data.weeks.map((w) => ({
    name: `Sem ${w.weekNumber}`,
    Meta: w.meta,
    Faturamento: w.isFuture ? undefined : w.faturamento,
    Tráfego: w.isFuture || w.trafego === 0 ? undefined : w.trafego,
  }))

  const progress = Math.min(data.percentAtingido, 100)
  const atingido = data.percentAtingido >= 100

  const [celebrating, setCelebrating] = useState(false)
  useEffect(() => {
    if (atingido) {
      setCelebrating(true)
      const t = setTimeout(() => setCelebrating(false), 3500)
      return () => clearTimeout(t)
    }
  }, [atingido])

  // Motivational text: only for current month
  const now = new Date()
  const isCurrentMonth =
    data.year === now.getFullYear() && data.month === now.getMonth() + 1
  const motivationalText =
    isCurrentMonth && !atingido ? getMotivationalText(data.percentAtingido) : null

  const trafegoPercent =
    data.totalFaturamento > 0
      ? ((data.totalTrafego / data.totalFaturamento) * 100).toFixed(0)
      : "0"

  return (
    <div
      className="rounded-xl flex flex-col gap-5 overflow-hidden relative"
      style={{ background: "#1A3A31", border: "1px solid #2A5040", padding: "28px 32px" }}
    >
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes confetti-burst {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          70%  { opacity: 0.9; }
          100% { transform: translateY(-260px) rotate(var(--rot)) scale(0.4); opacity: 0; }
        }
        @keyframes badge-glow-pulse {
          0%, 100% { box-shadow: 0 0 12px 3px rgba(149,214,0,0.35), 0 0 28px 6px rgba(149,214,0,0.15); }
          50%       { box-shadow: 0 0 22px 8px rgba(149,214,0,0.6),  0 0 48px 12px rgba(149,214,0,0.25); }
        }
        @keyframes badge-scale-in {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes motivational-glow {
          0%, 100% { box-shadow: 0 0 6px 1px rgba(149,214,0,0.2); opacity: 0.9; }
          50%       { box-shadow: 0 0 14px 3px rgba(149,214,0,0.45); opacity: 1; }
        }
      `}</style>

      {/* ── Confetti burst ── */}
      {celebrating && CONFETTI_PIECES.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: "30%",
            left: c.left,
            width: c.size,
            height: c.size,
            borderRadius: c.size > 12 ? "50%" : 2,
            background: c.color,
            "--rot": `${c.rotate}deg`,
            animation: `confetti-burst 2.2s ease-out ${c.delay}s forwards`,
            pointerEvents: "none",
            zIndex: 20,
          } as React.CSSProperties}
        />
      ))}

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">

          {/* "PERFORMANCE DO MÊS" + motivational text inline */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <p
              className="uppercase tracking-widest"
              style={{ fontSize: 11, fontFamily: "var(--font-display)", color: "#808080" }}
            >
              Performance do Mês
            </p>
            {motivationalText && (
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  color: "#95D600",
                  background: "rgba(149,214,0,0.08)",
                  border: "1px solid rgba(149,214,0,0.25)",
                  borderRadius: 999,
                  padding: "2px 10px",
                  animation: "motivational-glow 2.5s ease-in-out infinite",
                  whiteSpace: "nowrap",
                }}
              >
                {motivationalText}
              </span>
            )}
          </div>

          {/* Big value */}
          <div className="flex items-baseline gap-4 flex-wrap">
            <span
              className="font-bold leading-none"
              style={{ fontSize: 52, fontFamily: "var(--font-data)", color: "#E8F0EB", lineHeight: 1 }}
            >
              {formatCurrencyInt(data.totalFaturamento)}
            </span>
            <span style={{ fontSize: 16, fontFamily: "var(--font-display)", color: "#808080", whiteSpace: "nowrap" }}>
              de {formatCurrencyInt(data.totalMeta)}
            </span>
          </div>

          {data.totalTrafego > 0 && (
            <p
              className="mt-2 font-medium flex items-center gap-2 flex-wrap"
              style={{ fontSize: 15, fontFamily: "var(--font-display)", color: "#f97316" }}
            >
              {formatCurrencyInt(data.totalTrafego)} via Meta Ads
              <span style={{ fontSize: 12, color: "rgba(249,115,22,0.65)", fontWeight: 400 }}>
                ({trafegoPercent}% do faturamento)
              </span>
            </p>
          )}
        </div>

        {/* ── Badge ── */}
        {atingido ? (
          <div
            className="flex-shrink-0 flex flex-col items-center justify-center gap-0.5"
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(149,214,0,0.35) 0%, rgba(149,214,0,0.08) 100%)",
              border: "2.5px solid rgba(149,214,0,0.9)",
              animation: "badge-glow-pulse 1.8s ease-in-out infinite, badge-scale-in 0.5s ease-out both",
            }}
          >
            <Trophy size={18} style={{ color: "#95D600" }} />
            <span
              className="font-bold leading-none"
              style={{ fontSize: 11, fontFamily: "var(--font-display)", color: "#95D600", fontWeight: 800, letterSpacing: "0.04em" }}
            >
              META
            </span>
            <span
              className="font-bold leading-none"
              style={{ fontSize: 11, fontFamily: "var(--font-display)", color: "#95D600", fontWeight: 800, letterSpacing: "0.04em" }}
            >
              BATIDA!
            </span>
            <span
              style={{ fontSize: 16, fontFamily: "var(--font-data)", fontWeight: 700, color: "#95D600", lineHeight: 1 }}
            >
              {data.percentAtingido.toFixed(0)}%
            </span>
          </div>
        ) : (
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
        )}
      </div>

      {/* ── Progress bar ── */}
      <div className="space-y-1.5">
        <div className="rounded-full overflow-hidden" style={{ height: 6, background: "#223A32" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: atingido
                ? "#95D600"
                : "linear-gradient(90deg, #f97316 0%, #95D600 100%)",
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
              <line x1="0" y1="3" x2="14" y2="3" stroke={color} strokeWidth={2} strokeDasharray={dashed ? "4 2" : "0"} />
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
              dot={{ fill: "#8b5cf6", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }}
            />
            <Line
              type="linear" dataKey="Faturamento" stroke="#95D600" strokeWidth={2}
              connectNulls={false}
              dot={{ fill: "#95D600", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }}
            />
            <Line
              type="linear" dataKey="Tráfego" stroke="#f97316" strokeWidth={2}
              strokeDasharray="6 3" connectNulls={false}
              dot={{ fill: "#f97316", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
