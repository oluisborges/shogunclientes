"use client"

import { formatCurrency } from "@/lib/metas/utils"
import type { WeekData } from "@/lib/metas/utils"

interface WeeklyTableProps {
  weeks: WeekData[]
}

export function WeeklyTable({ weeks }: WeeklyTableProps) {
  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
      <h3 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
        Detalhe Semanal
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-shogun-border">
              <th className="text-center py-2 px-3 text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">
                Semana
              </th>
              <th className="text-center py-2 px-3 text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">
                Período
              </th>
              <th className="text-center py-2 px-3 text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">
                Meta
              </th>
              <th className="text-center py-2 px-3 text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">
                Faturamento
              </th>
              <th className="text-center py-2 px-3 text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">
                Tráfego
              </th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr
                key={week.weekNumber}
                className="border-b border-shogun-border/50 hover:bg-shogun-bg-base/50 transition-colors"
              >
                <td className="py-3 px-3 text-sm text-center font-[var(--font-display)] text-shogun-text-primary">
                  Sem {week.weekNumber}
                </td>
                <td className="py-3 px-3 text-sm text-center text-shogun-text-secondary">
                  {week.period}
                </td>
                <td className="py-3 px-3 text-sm text-center font-[var(--font-display)] text-shogun-text-primary">
                  {week.isFuture ? (
                    <span className="text-shogun-text-muted">—</span>
                  ) : (
                    formatCurrency(week.meta)
                  )}
                </td>
                <td className="py-3 px-3 text-sm text-center font-[var(--font-display)] text-shogun-text-primary">
                  {week.isFuture ? (
                    <span className="text-shogun-text-muted">—</span>
                  ) : (
                    <span className={week.faturamento >= week.meta ? "text-green-500" : "text-shogun-text-primary"}>
                      {formatCurrency(week.faturamento)}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-sm text-center font-[var(--font-display)] text-shogun-text-primary">
                  {week.isFuture ? (
                    <span className="text-shogun-text-muted">—</span>
                  ) : (
                    <span className="text-orange-500">
                      {formatCurrency(week.trafego)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Nota sobre semanas futuras */}
      <div className="mt-4 pt-4 border-t border-shogun-border">
        <p className="text-xs text-shogun-text-muted">
          Semanas futuras ou em andamento exibem "—" até que sejam concluídas.
        </p>
      </div>
    </div>
  )
}
