"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "./useClientContext"
import { useDateRangeContext } from "./useDateRangeContext"
import type { ParsedAdSetMetrics } from "@/lib/meta/types"
import { parseAdSet } from "@/lib/meta/formatters"
import type { MetaAdSet, MetaApiResponse } from "@/types/meta"

interface UseAdSetsReturn {
  adSets: ParsedAdSetMetrics[]
  loading: boolean
  error: string | null
}

export function useAdSets(): UseAdSetsReturn {
  const { selectedClientId } = useClientContext()
  const { dateRange } = useDateRangeContext()
  const [adSets, setAdSets] = useState<ParsedAdSetMetrics[]>([])
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

        const res = await fetch(`/api/meta/adsets?${params}`)

        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? "Erro ao carregar conjuntos")
        }

        const data: MetaApiResponse<MetaAdSet> = await res.json()
        const parsed = data.data.map(parseAdSet)
        setAdSets(parsed)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
        setAdSets([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedClientId, dateRange])

  return { adSets, loading, error }
}
