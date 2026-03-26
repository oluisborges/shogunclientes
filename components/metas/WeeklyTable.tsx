"use client"

import { RefreshCw, Lock } from "lucide-react"
import { formatCurrency } from "@/lib/metas/utils"
import type { WeekData } from "@/lib/metas/utils"

interface WeeklyTableProps {
  weeks: WeekData[]
  onSyncTrafego?: () => void
  syncing?: boolean
}

function Cell({
  value,
  color,
  isFuture,
}: {
  value: number
  color: string
  isFuture: boolean
}) {
  return (
    <td className="py-2.5 text-right">
      <div className="flex items-center justify-end gap-1">
        {isFuture || value === 0 ? (
          <>
            <span style={{ fontSize: 12, fontFamily: "var(--font-data)", color: "#3A6A5A" }}>
              —
            </span>
            <Lock size={9} style={{ color: "#3A6A5A", flexShrink: 0 }} />
          </>
        ) : (
          <>
            <span style={{ fontSize: 12, fontFamily: "var(--font-data)", color }}>
              {formatCurrency(value)}
            </span>
            <Lock size={9} style={{ color: `${color}80`, flexShrink: 0 }} />
          </>
        )}
      </div>
    </td>
  )
}

export function WeeklyTable({ weeks, onSyncTrafego, syncing }: WeeklyTableProps) {
  const now = new Date()
  const editedAt =
    now.toLocaleDateString("pt-BR") +
    " às " +
    now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  return (
    <div
      className="rounded-xl flex flex-col gap-4"
      style={{ background: "#0F1E2A", border: "1px solid #1e3a4a", padding: "20px 20px" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 22, height: 22, background: "rgba(149,214,0,0.15)", border: "1px solid rgba(149,214,0,0.4)" }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#95D600" }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontFamily: "var(--font-display)", fontWeight: 600, color: "#E8F0EB" }}>
            Entradas Semanais
          </p>
          <p style={{ fontSize: 11, fontFamily: "var(--font-display)", color: "#4A6A5A" }}>
            Editado {editedAt}
          </p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="pb-2 text-left" style={{ width: 24 }} />
            <th
              className="pb-2 text-right"
              style={{ fontSize: 10, fontFamily: "var(--font-display)", color: "#4A6A5A", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}
            >
              Meta
            </th>
            <th
              className="pb-2 text-right"
              style={{ fontSize: 10, fontFamily: "var(--font-display)", color: "#4A6A5A", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}
            >
              Fat.
            </th>
            <th
              className="pb-2 text-right"
              style={{ fontSize: 10, fontFamily: "var(--font-display)", color: "#4A6A5A", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}
            >
              Tráf.
            </th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.weekNumber} style={{ borderTop: "1px solid #1a3040" }}>
              {/* Label */}
              <td className="py-2.5">
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    color: "#4A6A5A",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  S{week.weekNumber}
                </span>
              </td>

              {/* Meta — always purple */}
              <Cell value={week.meta} color="#8b5cf6" isFuture={week.isFuture && week.meta === 0} />

              {/* Faturamento — green */}
              <Cell value={week.faturamento} color="#95D600" isFuture={week.isFuture} />

              {/* Tráfego — orange */}
              <Cell value={week.trafego} color="#f97316" isFuture={week.isFuture} />
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sync button */}
      {onSyncTrafego && (
        <button
          onClick={onSyncTrafego}
          disabled={syncing}
          className="w-full flex items-center justify-center gap-2 rounded-lg font-semibold transition-all disabled:opacity-50"
          style={{
            padding: "10px 0",
            fontSize: 13,
            fontFamily: "var(--font-display)",
            border: "1px solid rgba(249,115,22,0.45)",
            background: "rgba(249,115,22,0.1)",
            color: "#f97316",
          }}
        >
          <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Sincronizando…" : "Sincronizar Tráfego"}
        </button>
      )}
    </div>
  )
}
