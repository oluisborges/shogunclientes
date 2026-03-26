"use client"

import { KpiStrip } from "@/components/metricas/KpiStrip"
import { InvestimentoChart } from "@/components/metricas/InvestimentoChart"
import { CpaMarmitaChart } from "@/components/metricas/CpaMarmitaChart"
import { InsightsPanel } from "@/components/metricas/InsightsPanel"

export default function MetricasPage() {
  return (
    <div className="space-y-8">
      <KpiStrip />

      <div className="grid grid-cols-5 gap-4">
        <InvestimentoChart className="col-span-3" />
        <CpaMarmitaChart className="col-span-2" />
      </div>

      <InsightsPanel />
    </div>
  )
}
