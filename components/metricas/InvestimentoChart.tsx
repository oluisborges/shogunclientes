"use client"

import { ShogunCard, ShogunCardSkeleton } from "@/components/ui/ShogunCard"
import { LineChartComponent } from "@/components/charts/LineChart"

// Mock data for demonstration when no API data is available
const MOCK_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  gasto: Math.round(300 + Math.random() * 400),
  faturamento: Math.round(800 + Math.random() * 1200),
}))

interface InvestimentoChartProps {
  className?: string
  data?: Array<{ day: string; gasto: number; faturamento: number }>
  loading?: boolean
}

export function InvestimentoChart({
  className,
  data,
  loading,
}: InvestimentoChartProps) {
  if (loading) {
    return <ShogunCardSkeleton className={`h-[360px] ${className}`} />
  }

  const chartData = data ?? MOCK_DATA

  return (
    <ShogunCard className={className}>
      <p className="text-label mb-4">INVESTIMENTO VS FATURAMENTO</p>
      <LineChartComponent
        data={chartData}
        xAxisKey="day"
        dataSets={[
          { dataKey: "gasto", name: "Gasto (R$)", color: "#808080" },
          {
            dataKey: "faturamento",
            name: "Faturamento (R$)",
            color: "#95D600",
          },
        ]}
        height={280}
      />
    </ShogunCard>
  )
}
