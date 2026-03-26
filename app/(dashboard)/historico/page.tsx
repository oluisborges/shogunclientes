"use client"

import { HistoricoTable } from "@/components/historico/HistoricoTable"
import { HistoricoChart } from "@/components/historico/HistoricoChart"

export default function HistoricoPage() {
  return (
    <div className="flex gap-4 h-full">
      <div className="w-[62%] overflow-auto">
        <HistoricoTable />
      </div>
      <div className="w-[38%]">
        <HistoricoChart />
      </div>
    </div>
  )
}
