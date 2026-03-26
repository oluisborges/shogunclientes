"use client"

import { TrendingUp, TrendingDown, Target } from "lucide-react"
import { formatCurrency, formatPercent } from "@/lib/metas/utils"
import type { MonthData } from "@/lib/metas/utils"

interface SummaryCardsProps {
  data: MonthData
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const restante = Math.max(0, data.totalMeta - data.totalFaturamento)
  const trafegoPercentual = data.totalFaturamento > 0 ? (data.totalTrafego / data.totalFaturamento) * 100 : 0

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary">
        Resumo do Mês
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Meta Total */}
        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-purple-500" />
            <span className="text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">
              Meta Total
            </span>
          </div>
          <div className="text-xl font-[var(--font-display)] font-bold text-shogun-text-primary">
            {formatCurrency(data.totalMeta)}
          </div>
        </div>

        {/* Faturado */}
        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {data.totalFaturamento >= data.totalMeta ? (
              <TrendingUp size={16} className="text-green-500" />
            ) : (
              <TrendingDown size={16} className="text-orange-500" />
            )}
            <span className="text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">
              Faturado
            </span>
          </div>
          <div className="text-xl font-[var(--font-display)] font-bold text-shogun-text-primary">
            {formatCurrency(data.totalFaturamento)}
          </div>
          <div className={`text-xs mt-1 font-[var(--font-display)] ${
            data.totalFaturamento >= data.totalMeta ? "text-green-500" : "text-orange-500"
          }`}>
            {formatPercent(data.percentAtingido)} da meta
          </div>
        </div>

        {/* Restante */}
        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-shogun-text-secondary" />
            <span className="text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">
              Restante
            </span>
          </div>
          <div className="text-xl font-[var(--font-display)] font-bold text-shogun-text-primary">
            {formatCurrency(restante)}
          </div>
          <div className="text-xs mt-1 text-shogun-text-muted">
            {restante > 0 ? "Para atingir a meta" : "Meta atingida"}
          </div>
        </div>

        {/* Tráfego Meta Ads */}
        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-orange-500" />
            <span className="text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">
              Tráfego Meta Ads
            </span>
          </div>
          <div className="text-xl font-[var(--font-display)] font-bold text-orange-500">
            {formatCurrency(data.totalTrafego)}
          </div>
          <div className="text-xs mt-1 text-shogun-text-muted">
            {formatPercent(trafegoPercentual)} do faturamento
          </div>
        </div>
      </div>
    </div>
  )
}
