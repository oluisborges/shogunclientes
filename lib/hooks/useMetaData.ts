"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "./useClientContext"
import type { ParsedCampaignMetrics, AggregatedMetrics } from "@/lib/meta/types"
import { parseCampaign, aggregateMetrics } from "@/lib/meta/formatters"
import type { MetaCampaign, MetaApiResponse } from "@/types/meta"

interface UseMetaDataReturn {
  campaigns: ParsedCampaignMetrics[]
  aggregated: AggregatedMetrics | null
  loading: boolean
  error: string | null
}

export function useMetaData(): UseMetaDataReturn {
  const { selectedClientId } = useClientContext()
  const [campaigns, setCampaigns] = useState<ParsedCampaignMetrics[]>([])
  const [aggregated, setAggregated] = useState<AggregatedMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedClientId) {
      setLoading(false)
      return
    }

    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/meta/campaigns?client_id=${selectedClientId}`
        )

        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? "Erro ao carregar dados")
        }

        const data: MetaApiResponse<MetaCampaign> = await res.json()
        const parsed = data.data.map(parseCampaign)
        setCampaigns(parsed)
        setAggregated(aggregateMetrics(parsed))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
        setCampaigns([])
        setAggregated(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedClientId])

  return { campaigns, aggregated, loading, error }
}
