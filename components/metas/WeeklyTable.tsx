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
  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-5 flex flex-col gap-4">

      {/* Header */}
      <div>
        <p className="text-sm font-[var(--font-display)] font-semibold text-shogun-text-primary">
          Semanas
        </p>
        <p className="text-[11px] text-shogun-text-muted font-[var(--font-display)] mt-0.5 uppercase tracking-wider">
          Meta · Faturamento · Tráfego
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-shogun-border" />

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {weeks.map((week) => (
          <div key={week.weekNumber}>
            {/* Week label + period */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-[var(--font-display)] font-semibold text-shogun-text-muted uppercase tracking-wider">
                Semana {week.weekNumber}
              </span>
              <span className="text-[10px] font-[var(--font-display)] text-shogun-text-muted">
                {week.period}
              </span>
            </div>

            {week.isFuture ? (
              <p className="text-xs font-[var(--font-display)] text-shogun-text-muted italic">
                — período futuro —
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {/* Meta */}
                <div className="bg-shogun-bg-base rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[9px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider mb-0.5">
                    Meta
                  </p>
                  <p className="text-[11px] font-[var(--font-data)] text-shogun-text-secondary leading-tight">
                    {formatCurrency(week.meta)}
                  </p>
                </div>

                {/* Faturamento */}
                <div className="bg-shogun-bg-base rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[9px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider mb-0.5">
                    Fat.
                  </p>
                  <p
                    className="text-[11px] font-[var(--font-data)] leading-tight"
                    style={{ color: week.faturamento >= week.meta ? "#95D600" : "#E8F0EB" }}
                  >
                    {formatCurrency(week.faturamento)}
                  </p>
                </div>

                {/* Tráfego */}
                <div className="bg-shogun-bg-base rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[9px] font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider mb-0.5">
                    Tráf.
                  </p>
                  <p
                    className="text-[11px] font-[var(--font-data)] leading-tight"
                    style={{ color: week.trafego > 0 ? "#f97316" : "#4A6A5A" }}
                  >
                    {week.trafego > 0 ? formatCurrency(week.trafego) : "—"}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sync button */}
      {onSyncTrafego && (
        <button
          onClick={onSyncTrafego}
          disabled={syncing}
          className="w-full flex items-center justify-center gap-2 py-2.5 mt-1 rounded-lg text-xs font-[var(--font-display)] font-semibold transition-colors disabled:opacity-50"
          style={{
            border: "1px solid rgba(249,115,22,0.4)",
            background: "rgba(249,115,22,0.08)",
            color: "#f97316",
          }}
        >
          <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Sincronizando…" : "Sincronizar Tráfego"}
        </button>
      )}
    </div>
  )
}
