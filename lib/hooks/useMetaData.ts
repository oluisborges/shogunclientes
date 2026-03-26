"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "./useClientContext"
import { useDateRangeContext } from "./useDateRangeContext"
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
  const { dateRange } = useDateRangeContext()
  const [campaigns, setCampaigns] = useState<ParsedCampaignMetrics[]>([])
  const [aggregated, setAggregated] = useState<AggregatedMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedClientId || !dateRange) {
      setLoading(false)
      return
    }

    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          client_id: selectedClientId!,
          date_start: dateRange!.start.toISOString().split('T')[0],
          date_end: dateRange!.end.toISOString().split('T')[0],
        })

        const res = await fetch(`/api/meta/campaigns?${params}`)

        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? "Erro ao carregar dados")
        }

        const data: MetaApiResponse<MetaCampaign> = await res.json()
        const parsed = data.data.map(parseCampaign)
        // Filtrar apenas campanhas com gasto no período
        const withSpend = parsed.filter(c => c.spend > 0)
        setCampaigns(withSpend)
        setAggregated(aggregateMetrics(withSpend))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
        setCampaigns([])
        setAggregated(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedClientId, dateRange])

  return { campaigns, aggregated, loading, error }
}
