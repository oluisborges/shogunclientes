"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthSelectorProps {
  date: Date
  onNavigate: (direction: 'prev' | 'next') => void
  canGoNext: boolean
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export function MonthSelector({ date, onNavigate, canGoNext }: MonthSelectorProps) {
  const monthName = MONTHS[date.getMonth()]
  const year = date.getFullYear()

  return (
    <div className="flex items-center gap-2 bg-shogun-bg-elevated border border-shogun-border rounded-lg px-3 py-2">
      <button
        onClick={() => onNavigate('prev')}
        className="p-1 hover:bg-shogun-bg-base rounded transition-colors"
        title="Mês anterior"
      >
        <ChevronLeft size={16} className="text-shogun-text-secondary" />
      </button>
      
      <div className="min-w-[140px] text-center">
        <span className="text-sm font-[var(--font-display)] text-shogun-text-primary">
          {monthName} {year}
        </span>
      </div>
      
      <button
        onClick={() => onNavigate('next')}
        disabled={!canGoNext}
        className={cn(
          "p-1 hover:bg-shogun-bg-base rounded transition-colors",
          !canGoNext && "opacity-50 cursor-not-allowed"
        )}
        title={canGoNext ? "Próximo mês" : "Mês futuro bloqueado"}
      >
        <ChevronRight size={16} className="text-shogun-text-secondary" />
      </button>
    </div>
  )
}
