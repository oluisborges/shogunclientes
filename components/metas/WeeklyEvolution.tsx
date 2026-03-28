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
import { formatCurrency } from "@/lib/metas/utils"
import type { MonthData } from "@/lib/metas/utils"

interface WeeklyEvolutionProps {
  data: MonthData
}

function formatYAxis(value: number): string {
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`
  return `R$${value}`
}

export function WeeklyEvolution({ data }: WeeklyEvolutionProps) {
  const chartData = data.weeks
    .filter((w) => !w.isFuture)
    .map((week) => ({
      name: `Sem ${week.weekNumber}`,
      Meta: week.meta,
      Faturamento: week.faturamento,
      Tráfego: week.trafego,
    }))

  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6 flex flex-col gap-5">
      {/* Título + legenda */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-[var(--font-display)] font-semibold text-shogun-text-primary">
          Evolução Semanal
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0" style={{ borderTop: "2px dashed #8b5cf6" }} />
            <span className="text-xs font-[var(--font-display)] text-shogun-text-muted">Meta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0" style={{ borderTop: "2px solid #95D600" }} />
            <span className="text-xs font-[var(--font-display)] text-shogun-text-muted">Faturamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0" style={{ borderTop: "2px dashed #f97316" }} />
            <span className="text-xs font-[var(--font-display)] text-shogun-text-muted">Tráfego</span>
          </div>
        </div>
      </div>

      {/* Gráfico compacto */}
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F4438" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#7A9E8E", fontSize: 11, fontFamily: "var(--font-display)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: "#7A9E8E", fontSize: 10, fontFamily: "var(--font-display)" }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0D2B1E",
              border: "1px solid #1F4438",
              borderRadius: 6,
              fontFamily: "var(--font-display)",
              fontSize: 12,
            }}
            labelStyle={{ color: "#E8F5EE", marginBottom: 4 }}
            formatter={(value, name) => [formatCurrency(Number(value ?? 0)), String(name)]}
          />
          <Line type="linear" dataKey="Meta" stroke="#8b5cf6" strokeWidth={2}
            strokeDasharray="6 3" dot={{ fill: "#8b5cf6", r: 3 }} activeDot={{ r: 5 }} />
          <Line type="linear" dataKey="Faturamento" stroke="#95D600" strokeWidth={2}
            dot={{ fill: "#95D600", r: 3 }} activeDot={{ r: 5 }} />
          <Line type="linear" dataKey="Tráfego" stroke="#f97316" strokeWidth={2}
            strokeDasharray="6 3" dot={{ fill: "#f97316", r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>

      {/* Divisor */}
      <div className="border-t border-shogun-border" />

      {/* Tabela semanal */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-shogun-border">
              {["Semana", "Período", "Meta", "Faturamento", "Tráfego"].map((h) => (
                <th
                  key={h}
                  className="text-center pb-2 px-2 text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.weeks.map((week) => (
              <tr
                key={week.weekNumber}
                className="border-b border-shogun-border/40 hover:bg-shogun-bg-base/40 transition-colors"
              >
                <td className="py-2.5 px-2 text-sm text-center font-[var(--font-display)] text-shogun-text-primary">
                  Sem {week.weekNumber}
                </td>
                <td className="py-2.5 px-2 text-sm text-center text-shogun-text-secondary">
                  {week.period}
                </td>
                <td className="py-2.5 px-2 text-sm text-center font-[var(--font-display)] text-shogun-text-primary">
                  {week.isFuture ? <span className="text-shogun-text-muted">—</span> : formatCurrency(week.meta)}
                </td>
                <td className="py-2.5 px-2 text-sm text-center font-[var(--font-display)]">
                  {week.isFuture ? (
                    <span className="text-shogun-text-muted">—</span>
                  ) : (
                    <span className={week.faturamento >= week.meta ? "text-green-500" : "text-shogun-text-primary"}>
                      {formatCurrency(week.faturamento)}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-2 text-sm text-center font-[var(--font-display)]">
                  {week.isFuture ? (
                    <span className="text-shogun-text-muted">—</span>
                  ) : (
                    <span className="text-orange-500">{formatCurrency(week.trafego)}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
