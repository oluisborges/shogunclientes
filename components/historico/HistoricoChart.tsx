"use client"

import { ShogunCard } from "@/components/ui/ShogunCard"
import { BarChartComponent } from "@/components/charts/BarChart"
import { formatBRL, formatPercent } from "@/lib/utils/currency"
import { calcROI } from "@/lib/utils/pace"
import type { SalesHistory } from "@/types/database"

// Mock chart data
const MOCK_CHART_DATA = [
  { semana: "S46", gasto: 2180, faturamento: 13750 },
  { semana: "S47", gasto: 2560, faturamento: 14900 },
  { semana: "S48", gasto: 2840, faturamento: 17100 },
]

interface HistoricoChartProps {
  records?: SalesHistory[]
}

export function HistoricoChart({ records }: HistoricoChartProps) {
  const chartData = records
    ? records
        .slice()
        .reverse()
        .map((r) => ({
          semana: r.week_ref.split("-")[1],
          gasto: Number(r.meta_spend ?? 0),
          faturamento: Number(r.revenue ?? 0),
        }))
    : MOCK_CHART_DATA

  const totalRevenue = chartData.reduce((sum, d) => sum + d.faturamento, 0)
  const totalSpend = chartData.reduce((sum, d) => sum + d.gasto, 0)
  const avgROI = calcROI(totalRevenue, totalSpend)

  return (
    <ShogunCard className="h-full flex flex-col">
      <div className="space-y-4 mb-6">
        <div>
          <p className="text-label">ROI MÉDIO</p>
          <p className="font-[var(--font-data)] text-[40px] font-bold text-shogun-accent leading-none mt-1">
            {avgROI.toFixed(0)}%
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-label">FATURAMENTO TOTAL</p>
            <p className="font-[var(--font-data)] text-lg font-bold text-shogun-text-primary mt-1">
              {formatBRL(totalRevenue)}
            </p>
          </div>
          <div>
            <p className="text-label">GASTO TOTAL</p>
            <p className="font-[var(--font-data)] text-lg font-bold text-shogun-text-primary mt-1">
              {formatBRL(totalSpend)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <BarChartComponent
          data={chartData}
          xAxisKey="semana"
          dataSets={[
            { dataKey: "gasto", name: "Gasto", color: "#1A6B4A" },
            { dataKey: "faturamento", name: "Faturamento", color: "#95D600" },
          ]}
          height={220}
        />
      </div>
    </ShogunCard>
  )
}
