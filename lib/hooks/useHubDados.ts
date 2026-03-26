"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "./useClientContext"
import type { ParsedCampaignMetrics, ParsedAdSetMetrics, ParsedAdMetrics } from "@/lib/meta/types"
import { parseCampaign, parseAdSet, parseAd } from "@/lib/meta/formatters"
import type { MetaCampaign, MetaAdSet, MetaAd, MetaApiResponse } from "@/types/meta"
import type { DateRange } from "@/types/date"

interface UseHubDadosReturn {
  campaigns: ParsedCampaignMetrics[]
  adsets: ParsedAdSetMetrics[]
  ads: ParsedAdMetrics[]
  loading: boolean
  error: string | null
}

export function useHubDados(period?: DateRange): UseHubDadosReturn {
  const { selectedClientId } = useClientContext()
  const [campaigns, setCampaigns] = useState<ParsedCampaignMetrics[]>([])
  const [adsets, setAdsets] = useState<ParsedAdSetMetrics[]>([])
  const [ads, setAds] = useState<ParsedAdMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedClientId || !period) {
      setLoading(false)
      return
    }

    async function fetchAllData() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.append("client_id", selectedClientId!)
        params.append("date_start", period!.start.toISOString().split('T')[0])
        params.append("date_end", period!.end.toISOString().split('T')[0])

        // Buscar campanhas, conjuntos e anúncios em paralelo
        const [campaignsRes, adsetsRes, adsRes] = await Promise.all([
          fetch(`/api/meta/campaigns?${params}`),
          fetch(`/api/meta/adsets?${params}`),
          fetch(`/api/meta/ads?${params}`)
        ])

        // Processar campanhas
        if (campaignsRes.ok) {
          const campaignsData = await campaignsRes.json()
          const parsedCampaigns = (campaignsData as MetaApiResponse<MetaCampaign>).data.map(parseCampaign)
          setCampaigns(parsedCampaigns.filter(c => c.spend > 0))
        } else {
          const body = await campaignsRes.json()
          throw new Error(body.error ?? "Erro ao carregar campanhas")
        }

        // Processar conjuntos
        if (adsetsRes.ok) {
          const adsetsData = await adsetsRes.json()
          const parsedAdsets = (adsetsData as MetaApiResponse<MetaAdSet>).data.map(parseAdSet)
          setAdsets(parsedAdsets.filter(a => a.spend > 0))
        }

        // Processar anúncios
        if (adsRes.ok) {
          const adsData = await adsRes.json()
          const parsedAds = (adsData as MetaApiResponse<MetaAd>).data.map(parseAd)
          setAds(parsedAds.filter(a => a.spend > 0))
        }

      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido"
        
        if (message.includes("Sessão Meta expirada") || message.includes("requiresReauth")) {
          setError("Sua sessão Meta expirou. Por favor, reconecte sua conta nas Configurações.")
        } else {
          setError(message)
        }
        
        setCampaigns([])
        setAdsets([])
        setAds([])
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [selectedClientId, period])

  return { campaigns, adsets, ads, loading, error }
}
