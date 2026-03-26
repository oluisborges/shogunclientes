"use client"

import { ContextoLeitura } from "@/components/metricas/ContextoLeitura"
import { ResumoExecutivo } from "@/components/metricas/ResumoExecutivo"
import { InvestimentoChart } from "@/components/metricas/InvestimentoChart"
import { CpaMarmitaChart } from "@/components/metricas/CpaMarmitaChart"
import { InsightsPanel } from "@/components/metricas/InsightsPanel"

export default function MetricasPage() {
  return (
    <div className="space-y-6">
      <ContextoLeitura />
      <ResumoExecutivo />

      <div className="grid grid-cols-5 gap-4">
        <InvestimentoChart className="col-span-3" />
        <CpaMarmitaChart className="col-span-2" />
      </div>

      <InsightsPanel />
    </div>
  )
}
