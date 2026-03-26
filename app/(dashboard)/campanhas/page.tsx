"use client"

import { useState, useEffect } from "react"
import { DatePicker } from "@/components/ui/DatePicker"
import { HubDadosCampanhas } from "@/components/campanhas/HubDadosCampanhas"
import { useHubDados } from "@/lib/hooks/useHubDados"
import type { DateRange } from "@/types/date"

export default function CampanhasPage() {
  const [campaignPeriod, setCampaignPeriod] = useState<DateRange>()
  
  const { campaigns, adsets, ads, loading, error } = useHubDados(campaignPeriod)

  // Definir mês atual como padrão
  useEffect(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setCampaignPeriod({ start: firstDay, end: lastDay })
  }, [])

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-shogun-danger text-sm font-[var(--font-display)] mb-4">
          {error}
        </div>
        <a 
          href="/configuracoes" 
          className="text-shogun-accent text-sm font-[var(--font-display)] hover:underline"
        >
          Ir para Configurações →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">
          Hub de Dados
        </h1>

        <div className="relative z-10">
          <DatePicker
            value={campaignPeriod}
            onChange={setCampaignPeriod}
            placeholder="Período das campanhas"
          />
        </div>
      </div>

      <HubDadosCampanhas
        campaigns={campaigns}
        adsets={adsets}
        ads={ads}
        loading={loading}
      />
    </div>
  )
}
