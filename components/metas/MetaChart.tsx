"use client"

import { formatCurrency } from "@/lib/metas/utils"
import type { MonthData } from "@/lib/metas/utils"

interface MetaChartProps {
  data: MonthData
}

export function MetaChart({ data }: MetaChartProps) {
  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
      <h3 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
        Evolução Mensal
      </h3>
      
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-shogun-border rounded-lg">
        <div className="text-center">
          <p className="text-shogun-text-secondary mb-2">Gráfico de linhas</p>
          <p className="text-xs text-shogun-text-muted">Instale recharts para visualização completa</p>
          <div className="mt-4 space-y-2">
            {data.weeks.map((week) => (
              <div key={week.weekNumber} className="text-xs text-shogun-text-secondary">
                Sem {week.weekNumber}: Meta {formatCurrency(week.meta)} | 
                Faturado {formatCurrency(week.faturamento)} | 
                Tráfego {formatCurrency(week.trafego)}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legenda */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-purple-500" style={{ borderTop: '2px dashed #8b5cf6' }}></div>
          <span className="text-xs text-shogun-text-secondary">Meta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span className="text-xs text-shogun-text-secondary">Faturamento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-orange-500" style={{ borderTop: '2px dashed #f97316' }}></div>
          <span className="text-xs text-shogun-text-secondary">Tráfego Meta Ads</span>
        </div>
      </div>
    </div>
  )
}
