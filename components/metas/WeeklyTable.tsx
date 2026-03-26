"use client"

import { formatCurrency } from "@/lib/metas/utils"
import type { WeekData } from "@/lib/metas/utils"

interface WeeklyTableProps {
  weeks: WeekData[]
}

export function WeeklyTable({ weeks }: WeeklyTableProps) {
  const now = new Date()
  const editedAt =
    now.toLocaleDateString("pt-BR") +
    " às " +
    now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-5 flex flex-col gap-4">

      {/* Header */}
      <div>
        <p className="text-sm font-[var(--font-display)] font-semibold text-shogun-text-primary">
          Entradas Semanais
        </p>
        <p className="text-[11px] text-shogun-text-muted font-[var(--font-display)] mt-0.5">
          Editado {editedAt}
        </p>
      </div>

      {/* Tabela */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-shogun-border">
            <th className="pb-2 text-left text-[10px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider w-6" />
            <th className="pb-2 text-right text-[10px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider">
              Meta
            </th>
            <th className="pb-2 text-right text-[10px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider">
              Fat.
            </th>
            <th className="pb-2 text-right text-[10px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider">
              Tráf.
            </th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.weekNumber} className="border-b border-shogun-border/30">
              {/* Semana label */}
              <td className="py-2.5 text-[11px] font-[var(--font-display)] font-bold text-shogun-text-muted">
                S{week.weekNumber}
              </td>

              {/* Meta */}
              <td className="py-2.5 text-right text-[11px] font-[var(--font-data)] text-shogun-text-secondary">
                {week.isFuture && week.meta === 0 ? (
                  <span className="text-shogun-text-muted">—</span>
                ) : (
                  formatCurrency(week.meta)
                )}
              </td>

              {/* Faturamento */}
              <td className="py-2.5 text-right text-[11px] font-[var(--font-data)]">
                {week.isFuture ? (
                  <span className="text-shogun-text-muted">—</span>
                ) : (
                  <span style={{ color: week.faturamento >= week.meta && week.meta > 0 ? "#95D600" : "#E8F0EB" }}>
                    {formatCurrency(week.faturamento)}
                  </span>
                )}
              </td>

              {/* Tráfego */}
              <td className="py-2.5 text-right text-[11px] font-[var(--font-data)]">
                {week.isFuture ? (
                  <span className="text-shogun-text-muted">—</span>
                ) : week.trafego > 0 ? (
                  <span style={{ color: "#f97316" }}>{formatCurrency(week.trafego)}</span>
                ) : (
                  <span className="text-shogun-text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
