"use client"

import { ShogunCard, ShogunCardSkeleton } from "@/components/ui/ShogunCard"
import { LineChartComponent } from "@/components/charts/LineChart"

// Mock data for demonstration
const MOCK_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  cpa: +(12 + Math.random() * 10).toFixed(2),
}))

interface CpaMarmitaChartProps {
  className?: string
  data?: Array<{ day: string; cpa: number }>
  targetCpa?: number
  loading?: boolean
}

export function CpaMarmitaChart({
  className,
  data,
  targetCpa = 18,
  loading,
}: CpaMarmitaChartProps) {
  if (loading) {
    return <ShogunCardSkeleton className={`h-[360px] ${className}`} />
  }

  const chartData = data ?? MOCK_DATA

  return (
    <ShogunCard className={className}>
      <p className="text-label mb-4">CPA / MARMITA</p>
      <LineChartComponent
        data={chartData}
        xAxisKey="day"
        dataSets={[
          { dataKey: "cpa", name: "CPA (R$)", color: "#95D600" },
        ]}
        referenceLine={{
          y: targetCpa,
          label: `Meta: R$ ${targetCpa}`,
          color: "#FF6B35",
        }}
        height={280}
      />
    </ShogunCard>
  )
}
