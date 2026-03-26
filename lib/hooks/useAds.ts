"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "./useClientContext"
import { useDateRangeContext } from "./useDateRangeContext"
import type { ParsedAdMetrics } from "@/lib/meta/types"
import { parseAd } from "@/lib/meta/formatters"
import type { MetaAd, MetaApiResponse } from "@/types/meta"

interface UseAdsReturn {
  ads: ParsedAdMetrics[]
  loading: boolean
  error: string | null
}

export function useAds(): UseAdsReturn {
  const { selectedClientId } = useClientContext()
  const { dateRange } = useDateRangeContext()
  const [ads, setAds] = useState<ParsedAdMetrics[]>([])
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

        const res = await fetch(`/api/meta/ads?${params}`)

        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? "Erro ao carregar anúncios")
        }

        const data: MetaApiResponse<MetaAd> = await res.json()
        const parsed = data.data.map(parseAd)
        setAds(parsed)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
        setAds([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedClientId, dateRange])

  return { ads, loading, error }
}
