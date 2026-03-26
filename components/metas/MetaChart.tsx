"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { formatCurrency } from "@/lib/metas/utils"
import type { MonthData } from "@/lib/metas/utils"

interface MetaChartProps {
  data: MonthData
}

function formatYAxis(value: number): string {
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`
  return `R$${value}`
}

export function MetaChart({ data }: MetaChartProps) {
  const chartData = data.weeks
    .filter((w) => !w.isFuture)
    .map((week) => ({
      name: `Sem ${week.weekNumber}`,
      Meta: week.meta,
      Faturamento: week.faturamento,
    }))

  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
      <h3 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-6">
        Evolução Mensal
      </h3>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F4438" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#7A9E8E", fontSize: 12, fontFamily: "var(--font-display)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: "#7A9E8E", fontSize: 11, fontFamily: "var(--font-display)" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0D2B1E",
              border: "1px solid #1F4438",
              borderRadius: 6,
              fontFamily: "var(--font-display)",
            }}
            labelStyle={{ color: "#E8F5EE", marginBottom: 4 }}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name,
            ]}
          />
          <Line
            type="monotone"
            dataKey="Meta"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ fill: "#8b5cf6", r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Faturamento"
            stroke="#95D600"
            strokeWidth={2}
            dot={{ fill: "#95D600", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-purple-500" style={{ borderTop: "2px dashed #8b5cf6" }} />
          <span className="text-xs font-[var(--font-display)] text-shogun-text-secondary">Meta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-shogun-accent" />
          <span className="text-xs font-[var(--font-display)] text-shogun-text-secondary">Faturamento</span>
        </div>
      </div>
    </div>
  )
}
