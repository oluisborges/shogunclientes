"use client"

import { RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/metas/utils"
import type { WeekData } from "@/lib/metas/utils"

interface WeeklyTableProps {
  weeks: WeekData[]
  onSyncTrafego?: () => void
  syncing?: boolean
}

export function WeeklyTable({ weeks, onSyncTrafego, syncing }: WeeklyTableProps) {
  const now = new Date()
  const editedAt = now.toLocaleDateString("pt-BR") + " às " +
    now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div>
        <p className="text-sm font-[var(--font-display)] font-semibold text-shogun-text-primary">
          Entradas Semanais
        </p>
        <p className="text-xs text-shogun-text-muted font-[var(--font-display)] mt-0.5">
          Editado {editedAt}
        </p>
      </div>

      {/* Tabela */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-shogun-border">
            <th className="text-left pb-2 text-xs font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider w-8" />
            <th className="text-right pb-2 text-xs font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider">
              Meta
            </th>
            <th className="text-right pb-2 text-xs font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider">
              Fat.
            </th>
            <th className="text-right pb-2 text-xs font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider">
              Tráf.
            </th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.weekNumber} className="border-b border-shogun-border/30">
              <td className="py-3 text-xs font-[var(--font-display)] font-semibold text-shogun-text-muted">
                S{week.weekNumber}
              </td>
              <td className="py-3 text-right text-xs font-[var(--font-data)] text-shogun-text-secondary">
                {week.isFuture ? (
                  <span className="text-shogun-text-muted">—</span>
                ) : (
                  formatCurrency(week.meta)
                )}
              </td>
              <td className="py-3 text-right text-xs font-[var(--font-data)]">
                {week.isFuture ? (
                  <span className="text-shogun-text-muted">—</span>
                ) : (
                  <span className={week.faturamento >= week.meta ? "text-green-400" : "text-shogun-text-primary"}>
                    {formatCurrency(week.faturamento)}
                  </span>
                )}
              </td>
              <td className="py-3 text-right text-xs font-[var(--font-data)]">
                {week.isFuture ? (
                  <span className="text-shogun-text-muted">—</span>
                ) : week.trafego > 0 ? (
                  <span className="text-orange-400">{formatCurrency(week.trafego)}</span>
                ) : (
                  <span className="text-shogun-text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botão sincronizar */}
      {onSyncTrafego && (
        <button
          onClick={onSyncTrafego}
          disabled={syncing}
          className="w-full flex items-center justify-center gap-2 py-2.5 mt-1 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-400 text-xs font-[var(--font-display)] font-semibold hover:bg-orange-500/20 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Sincronizando…" : "Sincronizar Tráfego"}
        </button>
      )}
    </div>
  )
}
