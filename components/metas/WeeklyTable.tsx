"use client"

import { RefreshCw, Lock } from "lucide-react"
import { formatCurrency, formatCurrencyInt } from "@/lib/metas/utils"
import type { WeekData } from "@/lib/metas/utils"

interface WeeklyTableProps {
  weeks: WeekData[]
  onSyncTrafego?: () => void
  syncing?: boolean
}

function Val({
  value,
  color,
  show,
  decimals = true,
}: {
  value: number
  color: string
  show: boolean
  decimals?: boolean
}) {
  const formatted = decimals ? formatCurrency(value) : formatCurrencyInt(value)
  return (
    <td className="py-2 align-middle" style={{ textAlign: "right" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3 }}>
        {show && value > 0 ? (
          <>
            <span style={{ fontSize: 11, fontFamily: "var(--font-data)", color, whiteSpace: "nowrap" }}>
              {formatted}
            </span>
            <Lock size={8} style={{ color: `${color}90`, flexShrink: 0 }} />
          </>
        ) : (
          <>
            <span style={{ fontSize: 12, fontFamily: "var(--font-data)", color: "#3A5A4A" }}>—</span>
            <Lock size={8} style={{ color: "#3A5A4A", flexShrink: 0 }} />
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
      style={{ background: "#0F1E2A", border: "1px solid #1e3a4a", padding: "20px" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "rgba(149,214,0,0.15)",
            border: "1px solid rgba(149,214,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#95D600" }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontFamily: "var(--font-display)", fontWeight: 600, color: "#E8F0EB", lineHeight: 1.2 }}>
            Entradas Semanais
          </p>
          <p style={{ fontSize: 11, fontFamily: "var(--font-display)", color: "#4A6A5A", marginTop: 2 }}>
            Editado {editedAt}
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 28 }} />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: "1px solid #1a3040" }}>
              <th />
              {(["Meta", "Fat.", "Tráf."] as const).map((h) => (
                <th
                  key={h}
                  style={{
                    paddingBottom: 8,
                    textAlign: "right",
                    fontSize: 10,
                    fontFamily: "var(--font-display)",
                    color: "#4A6A5A",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 500,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week.weekNumber} style={{ borderTop: "1px solid #131f2a" }}>
                {/* S label */}
                <td className="py-2 align-middle">
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      color: "#4A6A5A",
                      textTransform: "uppercase",
                    }}
                  >
                    S{week.weekNumber}
                  </span>
                </td>

                {/* META — always show if > 0, purple */}
                <Val value={week.meta} color="#8b5cf6" show={week.meta > 0} decimals={false} />

                {/* FAT — hide if future */}
                <Val value={week.faturamento} color="#95D600" show={!week.isFuture} />

                {/* TRÁF — hide if future or zero */}
                <Val value={week.trafego} color="#f97316" show={!week.isFuture && week.trafego > 0} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sync button */}
      {onSyncTrafego && (
        <button
          onClick={onSyncTrafego}
          disabled={syncing}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 0",
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            border: "1px solid rgba(249,115,22,0.45)",
            background: "rgba(249,115,22,0.10)",
            color: "#f97316",
            cursor: syncing ? "not-allowed" : "pointer",
            opacity: syncing ? 0.5 : 1,
          }}
        >
          <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Sincronizando…" : "Sincronizar Tráfego"}
        </button>
      )}
    </div>
  )
}
