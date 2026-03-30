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

export interface MetricasGender {
  gender: string
  purchases: number
  purchaseValue: number
  lpViews: number
}

export interface MetricasDaily {
  date: string
  spend: number
  purchases: number
  purchaseValue: number
}

export interface MetricasAge {
  age: string
  purchases: number
  lpViews: number
}

export interface MetricasData {
  balance: number
  current: MetricasPeriod
  previous: MetricasPeriod
  campaigns: MetricasCampaign[]
  genderStats: MetricasGender[]
  dailyData: MetricasDaily[]
  ageStats: MetricasAge[]
}

interface UseMetricasReturn {
  data: MetricasData | null
  loading: boolean
  error: string | null
  refetch: () => void // Função para forçar atualização
}

function toIso(date: Date): string {
  return date.toISOString().split("T")[0]
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

// Cache removido permanentemente - sempre buscar dados frescos do Meta
// O Meta pode atualizar dados com atraso, então cache pode mostrar dados desatualizados

export function useMetricas(): UseMetricasReturn {
  const { selectedClientId } = useClientContext()
  const { dateRange, compareRange } = useDateRangeContext()
  const [data, setData] = useState<MetricasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0) // Para forçar refresh

  useEffect(() => {
    if (!selectedClientId || !dateRange) {
      setData(null)
      setLoading(false)
      return
    }

    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const dateStart = toIso(dateRange!.start)
        const dateEnd = toIso(dateRange!.end)
        const prevStartDate = new Date(dateRange!.start)
        prevStartDate.setMonth(prevStartDate.getMonth() - 1)
        prevStartDate.setDate(Math.min(prevStartDate.getDate(), getDaysInMonth(prevStartDate.getFullYear(), prevStartDate.getMonth() + 1)))
        const prevEndDate = new Date(dateRange!.end)
        prevEndDate.setMonth(prevEndDate.getMonth() - 1)
        prevEndDate.setDate(Math.min(prevEndDate.getDate(), getDaysInMonth(prevEndDate.getFullYear(), prevEndDate.getMonth() + 1)))

        const params = new URLSearchParams({
          client_id: selectedClientId!,
          date_start: dateStart,
          date_end: dateEnd,
          prev_start: toIso(prevStartDate),
          prev_end: toIso(prevEndDate),
          _t: Date.now().toString(), // Cache-buster para evitar cache do navegador
          _r: refreshKey.toString(), // Refresh key para forçar nova busca
        })

        const res = await fetch(`/api/meta/metricas?${params}`)
        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? "Erro ao carregar métricas")
        }
        const json: MetricasData = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar métricas")
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedClientId, dateRange, refreshKey]) // Removido compareRange das dependências

  const refetch = () => {
    setRefreshKey(prev => prev + 1)
  }

  return { data, loading, error, refetch }
}
