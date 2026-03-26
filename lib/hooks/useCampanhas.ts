"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "./useClientContext"
import type { ParsedCampaignMetrics, ParsedAdSetMetrics, ParsedAdMetrics } from "@/lib/meta/types"
import { parseCampaign, parseAdSet, parseAd } from "@/lib/meta/formatters"
import type { MetaCampaign, MetaAdSet, MetaAd, MetaApiResponse } from "@/types/meta"

type TabType = "campaigns" | "adsets" | "ads"

interface UseCampanhasReturn {
  campaigns: ParsedCampaignMetrics[]
  adsets: ParsedAdSetMetrics[]
  ads: ParsedAdMetrics[]
  loading: boolean
  error: string | null
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

interface DateRange {
  start: Date
  end: Date
}

export function useCampanhas(campaignPeriod?: DateRange): UseCampanhasReturn {
  const { selectedClientId } = useClientContext()
  const [campaigns, setCampaigns] = useState<ParsedCampaignMetrics[]>([])
  const [adsets, setAdsets] = useState<ParsedAdSetMetrics[]>([])
  const [ads, setAds] = useState<ParsedAdMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("campaigns")

  useEffect(() => {
    if (!selectedClientId) {
      setLoading(false)
      return
    }

    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const endpoint =
          activeTab === "campaigns"
            ? "campaigns"
            : activeTab === "adsets"
              ? "adsets"
              : "ads"

        const params = new URLSearchParams()
        params.append("client_id", selectedClientId!)

        // Adicionar período se fornecido
        if (campaignPeriod) {
          params.append("date_start", campaignPeriod.start.toISOString().split('T')[0])
          params.append("date_end", campaignPeriod.end.toISOString().split('T')[0])
        }

        const res = await fetch(`/api/meta/${endpoint}?${params}`)

        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? "Erro ao carregar dados")
        }

        const data = await res.json()

        if (activeTab === "campaigns") {
          const parsedCampaigns = (data as MetaApiResponse<MetaCampaign>).data.map(parseCampaign)
          // Mostrar apenas campanhas com gasto no período
          setCampaigns(parsedCampaigns.filter(c => c.spend > 0))
        } else if (activeTab === "adsets") {
          const parsedAdsets = (data as MetaApiResponse<MetaAdSet>).data.map(parseAdSet)
          // Mostrar apenas conjuntos com gasto no período
          setAdsets(parsedAdsets.filter(a => a.spend > 0))
        } else {
          const parsedAds = (data as MetaApiResponse<MetaAd>).data.map(parseAd)
          // Mostrar apenas anúncios com gasto no período
          setAds(parsedAds.filter(a => a.spend > 0))
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido"
        
        // Verificar se é erro de autenticação
        if (message.includes("Sessão Meta expirada") || message.includes("requiresReauth")) {
          setError("Sua sessão Meta expirou. Por favor, reconecte sua conta nas Configurações.")
        } else {
          setError(message)
        }
        
        setCampaigns([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedClientId, activeTab, campaignPeriod])

  return { campaigns, adsets, ads, loading, error, activeTab, setActiveTab }
}
