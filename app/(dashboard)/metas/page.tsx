"use client"

import { useState, useEffect, useCallback } from "react"
import { useClientContext } from "@/lib/hooks/useClientContext"
import { MonthSelector } from "@/components/metas/MonthSelector"
import { MetaChart } from "@/components/metas/MetaChart"
import { WeeklyTable } from "@/components/metas/WeeklyTable"
import { SummaryCards } from "@/components/metas/SummaryCards"
import { ShogunCardSkeleton } from "@/components/ui/ShogunCard"
import { calculateWeeks, type WeekData, type MonthData } from "@/lib/metas/utils"

export default function MetasPage() {
  const { selectedClientId, clients } = useClientContext()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [monthData, setMonthData] = useState<MonthData | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  const fetchMonthData = useCallback(async (syncTrafego = false) => {
    if (!selectedClientId) return
    syncTrafego ? setSyncing(true) : setLoading(true)
    setError(null)
    try {
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth() + 1
      const weeks = calculateWeeks(selectedDate)
      const base = `/api/metas`
      const qs = `clientId=${selectedClientId}&year=${year}&month=${month}`

      const [sheetsResponse, metaResponse] = await Promise.all([
        fetch(`${base}/sheets?${qs}`),
        fetch(`${base}/meta?${qs}`),
      ])

      if (!sheetsResponse.ok) {
        const { error: msg } = await sheetsResponse.json()
        throw new Error(msg ?? "Erro ao buscar dados da planilha")
      }

      const sheetsData: { meta: number; faturamento: number }[] = await sheetsResponse.json()
      const metaData: { trafego: number }[] = metaResponse.ok ? await metaResponse.json() : []

      const weekData: WeekData[] = weeks.map((week, index) => ({
        weekNumber: index + 1,
        startDate: week.start,
        endDate: week.end,
        period: `${week.start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} → ${week.end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`,
        meta: sheetsData?.[index]?.meta ?? 0,
        faturamento: sheetsData?.[index]?.faturamento ?? 0,
        trafego: metaData?.[index]?.trafego ?? 0,
        isFuture: week.end > new Date(),
      }))

      const totalMeta = weekData.reduce((sum, w) => sum + w.meta, 0)
      const totalFaturamento = weekData.reduce((sum, w) => sum + w.faturamento, 0)
      const totalTrafego = weekData.filter((w) => !w.isFuture).reduce((sum, w) => sum + w.trafego, 0)

      setMonthData({
        year, month, weeks: weekData,
        totalMeta, totalFaturamento, totalTrafego,
        percentAtingido: totalMeta > 0 ? (totalFaturamento / totalMeta) * 100 : 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [selectedClientId, selectedDate])

  useEffect(() => { fetchMonthData() }, [fetchMonthData])

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    if (newDate <= new Date()) setSelectedDate(newDate)
  }

  const canGoNext = () => {
    const next = new Date(selectedDate)
    next.setMonth(next.getMonth() + 1)
    return next <= new Date()
  }

  if (!selectedClientId) {
    return (
      <div className="text-center py-12">
        <p className="text-shogun-text-secondary">Selecione um cliente para visualizar as metas</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">
          Metas
        </h1>
        <MonthSelector date={selectedDate} onNavigate={navigateMonth} canGoNext={canGoNext()} />
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            <ShogunCardSkeleton className="h-[420px]" />
            <ShogunCardSkeleton className="h-[420px]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <ShogunCardSkeleton key={i} className="h-[100px]" />)}
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-shogun-danger text-sm">{error}</p>
        </div>
      ) : monthData ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 items-start">
            <MetaChart data={monthData} />
            <WeeklyTable
                weeks={monthData.weeks}
                onSyncTrafego={() => fetchMonthData(true)}
                syncing={syncing}
              />
          </div>
          <SummaryCards data={monthData} clientName={selectedClient?.business_name} />
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-shogun-text-secondary">Nenhum dado encontrado para o período selecionado</p>
        </div>
      )}
    </div>
  )
}
