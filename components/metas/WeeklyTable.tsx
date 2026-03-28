"use client"

import { formatCurrency, formatCurrencyInt } from "@/lib/metas/utils"
import type { WeekData } from "@/lib/metas/utils"

interface WeeklyTableProps {
  weeks: WeekData[]
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
      {show && value > 0 ? (
        <span style={{ fontSize: 11, fontFamily: "var(--font-data)", color, whiteSpace: "nowrap" }}>
          {formatted}
        </span>
      ) : (
        <span style={{ fontSize: 12, fontFamily: "var(--font-data)", color: "#606060" }}>—</span>
      )}
    </td>
  )
}

export function WeeklyTable({ weeks }: WeeklyTableProps) {
  const now = new Date()
  const editedAt =
    now.toLocaleDateString("pt-BR") +
    " às " +
    now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  return (
    <div
      className="rounded-xl flex flex-col gap-4"
      style={{ background: "#1A3A31", border: "1px solid #2A5040", padding: "20px" }}
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
        <p style={{ fontSize: 14, fontFamily: "var(--font-display)", fontWeight: 600, color: "#E8F0EB" }}>
          Entradas Semanais
        </p>
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
            <tr style={{ borderBottom: "1px solid #223A32" }}>
              <th />
              {(["Meta", "Fat.", "Tráf."] as const).map((h) => (
                <th
                  key={h}
                  style={{
                    paddingBottom: 8,
                    textAlign: "right",
                    fontSize: 10,
                    fontFamily: "var(--font-display)",
                    color: "#808080",
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
              <tr key={week.weekNumber} style={{ borderTop: "1px solid #1A3028" }}>
                <td className="py-2 align-middle">
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      color: "#808080",
                      textTransform: "uppercase",
                    }}
                  >
                    S{week.weekNumber}
                  </span>
                </td>

                <Val value={week.meta} color="#8b5cf6" show={week.meta > 0} decimals={false} />
                <Val value={week.faturamento} color="#95D600" show={!week.isFuture} />
                <Val value={week.trafego} color="#f97316" show={!week.isFuture && week.trafego > 0} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer — editado */}
      <p style={{ fontSize: 11, fontFamily: "var(--font-display)", color: "#808080", textAlign: "center" }}>
        Editado {editedAt}
      </p>
    </div>
  )
}
