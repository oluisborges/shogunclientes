"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "./useClientContext"
import { useDateRangeContext } from "./useDateRangeContext"

export interface MetricasPeriod {
  spend: number
  impressions: number
  reach: number
  clicks: number
  ctr: number
  cpc: number
  cpp: number
  frequency: number
  purchaseRoas: number
  linkClicks: number
  lpViews: number
  addToCart: number
  initiateCheckout: number
  purchases: number
  purchaseValue: number
  costPerPurchase: number
}

export interface MetricasCampaign {
  id: string
  name: string
  status: string
}

export interface MetricasData {
  balance: number
  current: MetricasPeriod
  previous: MetricasPeriod
  campaigns: MetricasCampaign[]
}

interface UseMetricasReturn {
  data: MetricasData | null
  loading: boolean
  error: string | null
}

function toIso(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function useMetricas(): UseMetricasReturn {
  const { selectedClientId } = useClientContext()
  const { dateRange } = useDateRangeContext()
  const [data, setData] = useState<MetricasData | null>(null)
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
        const dateStart = toIso(dateRange!.start)
        const dateEnd = toIso(dateRange!.end)

        // Compute previous period: same number of days ending the day before date_start
        const periodMs =
          dateRange!.end.getTime() - dateRange!.start.getTime()
        const periodDays = Math.round(periodMs / (1000 * 60 * 60 * 24)) + 1
        const prevEndDate = new Date(dateRange!.start)
        prevEndDate.setDate(prevEndDate.getDate() - 1)
        const prevStartDate = new Date(prevEndDate)
        prevStartDate.setDate(prevStartDate.getDate() - (periodDays - 1))

        const params = new URLSearchParams({
          client_id: selectedClientId!,
          date_start: dateStart,
          date_end: dateEnd,
          prev_start: toIso(prevStartDate),
          prev_end: toIso(prevEndDate),
        })

        const res = await fetch(`/api/meta/metricas?${params}`)

        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? "Erro ao carregar métricas")
        }

        const json: MetricasData = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedClientId, dateRange])

  return { data, loading, error }
}
