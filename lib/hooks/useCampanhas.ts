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

export function useCampanhas(): UseCampanhasReturn {
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

        const res = await fetch(
          `/api/meta/${endpoint}?client_id=${selectedClientId}`
        )

        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? "Erro ao carregar dados")
        }

        const data = await res.json()

        if (activeTab === "campaigns") {
          setCampaigns((data as MetaApiResponse<MetaCampaign>).data.map(parseCampaign))
        } else if (activeTab === "adsets") {
          setAdsets((data as MetaApiResponse<MetaAdSet>).data.map(parseAdSet))
        } else {
          setAds((data as MetaApiResponse<MetaAd>).data.map(parseAd))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedClientId, activeTab])

  return { campaigns, adsets, ads, loading, error, activeTab, setActiveTab }
}
