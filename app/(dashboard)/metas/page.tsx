"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useClientContext } from "@/lib/hooks/useClientContext"
import { MonthSelector } from "@/components/metas/MonthSelector"
import { MetaChart } from "@/components/metas/MetaChart"
import { WeeklyTable } from "@/components/metas/WeeklyTable"
import { SummaryCards } from "@/components/metas/SummaryCards"
import { calculateWeeks, type WeekData, type MonthData } from "@/lib/metas/utils"

export default function MetasPage() {
  const { selectedClientId } = useClientContext()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [monthData, setMonthData] = useState<MonthData | null>(null)
  const [loading, setLoading] = useState(false)

  // Buscar dados do mês selecionado
  useEffect(() => {
    if (!selectedClientId) return

    const fetchMonthData = async () => {
      setLoading(true)
      try {
        // Calcular semanas do mês
        const weeks = calculateWeeks(selectedDate)
        
        // Buscar dados do Google Sheets
        const sheetsResponse = await fetch(`/api/metas/sheets?clientId=${selectedClientId}&year=${selectedDate.getFullYear()}&month=${selectedDate.getMonth() + 1}`)
        const sheetsData = await sheetsResponse.json()
        
        // Buscar dados do Meta Ads
        const metaResponse = await fetch(`/api/metas/meta?clientId=${selectedClientId}&year=${selectedDate.getFullYear()}&month=${selectedDate.getMonth() + 1}`)
        const metaData = await metaResponse.json()
        
        // Combinar dados
        const weekData: WeekData[] = weeks.map((week, index) => ({
          weekNumber: index + 1,
          startDate: week.start,
          endDate: week.end,
          period: `${week.start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} → ${week.end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
          meta: sheetsData?.[index]?.meta || 0,
          faturamento: sheetsData?.[index]?.faturamento || 0,
          trafego: metaData?.[index]?.trafego || 0,
          isFuture: week.end > new Date()
        }))
        
        const totalMeta = weekData.reduce((sum, week) => sum + week.meta, 0)
        const totalFaturamento = weekData.reduce((sum, week) => sum + week.faturamento, 0)
        const totalTrafego = weekData.reduce((sum, week) => sum + week.trafego, 0)
        
        setMonthData({
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
          weeks: weekData,
          totalMeta,
          totalFaturamento,
          totalTrafego,
          percentAtingido: totalMeta > 0 ? (totalFaturamento / totalMeta) * 100 : 0
        })
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMonthData()
  }, [selectedClientId, selectedDate])

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    
    // Bloquear meses futuros
    const now = new Date()
    if (newDate <= now) {
      setSelectedDate(newDate)
    }
  }

  const canGoNext = () => {
    const nextMonth = new Date(selectedDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return nextMonth <= new Date()
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
        
        <div className="flex items-center gap-4">
          {monthData && (
            <div className="px-3 py-1 bg-shogun-accent/20 border border-shogun-accent/30 rounded-full">
              <span className="text-shogun-accent text-sm font-[var(--font-display)] font-semibold">
                {monthData.percentAtingido.toFixed(0)}% da meta atingida
              </span>
            </div>
          )}
          
          <MonthSelector
            date={selectedDate}
            onNavigate={navigateMonth}
            canGoNext={canGoNext()}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shogun-accent"></div>
        </div>
      ) : monthData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de linhas */}
          <div className="lg:col-span-2">
            <MetaChart data={monthData} />
          </div>
          
          {/* Tabela de semanas */}
          <WeeklyTable weeks={monthData.weeks} />
          
          {/* Cards de resumo */}
          <SummaryCards data={monthData} />
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-shogun-text-secondary">Nenhum dado encontrado para o período selecionado</p>
        </div>
      )}
    </div>
  )
}
