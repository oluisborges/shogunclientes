"use client"

import { useState, useRef } from "react"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatBRL, formatNumber } from "@/lib/utils/currency"
import { calcROI } from "@/lib/utils/pace"
import type { SalesHistory } from "@/types/database"

// Mock data for demonstration
const MOCK_RECORDS: SalesHistory[] = [
  {
    id: "1",
    client_id: "c1",
    week_ref: "2024-W48",
    period_start: "2024-11-25",
    period_end: "2024-12-01",
    units_sold: 342,
    revenue: 17100,
    avg_ticket: 50,
    meta_spend: 2840,
    meta_synced_at: "2024-12-01T12:00:00Z",
    notes: null,
    created_at: "2024-12-01T12:00:00Z",
  },
  {
    id: "2",
    client_id: "c1",
    week_ref: "2024-W47",
    period_start: "2024-11-18",
    period_end: "2024-11-24",
    units_sold: 298,
    revenue: 14900,
    avg_ticket: 50,
    meta_spend: 2560,
    meta_synced_at: "2024-11-24T12:00:00Z",
    notes: "Promoção Black Friday",
    created_at: "2024-11-24T12:00:00Z",
  },
  {
    id: "3",
    client_id: "c1",
    week_ref: "2024-W46",
    period_start: "2024-11-11",
    period_end: "2024-11-17",
    units_sold: 275,
    revenue: 13750,
    avg_ticket: 50,
    meta_spend: 2180,
    meta_synced_at: "2024-11-17T12:00:00Z",
    notes: null,
    created_at: "2024-11-17T12:00:00Z",
  },
]

interface HistoricoTableProps {
  records?: SalesHistory[]
  onUpdate?: (id: string, field: string, value: string | number | null) => Promise<void>
  loading?: boolean
}

export function HistoricoTable({
  records,
  onUpdate,
  loading,
}: HistoricoTableProps) {
  const data = records ?? MOCK_RECORDS

  if (loading) {
    return (
      <div className="space-y-px">
        <div className="h-10 bg-shogun-bg-base rounded skeleton-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-shogun-bg-elevated rounded skeleton-pulse" style={{ opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    )
  }

  const totals = data.reduce(
    (acc, r) => ({
      units: acc.units + (r.units_sold ?? 0),
      revenue: acc.revenue + (r.revenue ? Number(r.revenue) : 0),
      spend: acc.spend + (r.meta_spend ? Number(r.meta_spend) : 0),
    }),
    { units: 0, revenue: 0, spend: 0 }
  )
  const avgTicket = totals.units > 0 ? totals.revenue / totals.units : 0
  const totalROI = calcROI(totals.revenue, totals.spend)

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="sticky top-0 z-10">
          <tr className="bg-shogun-bg-base border-b border-shogun-border">
            <th className="text-label px-4 py-3 text-left">SEMANA</th>
            <th className="text-label px-4 py-3 text-left">PERÍODO</th>
            <th className="text-label px-4 py-3 text-right">
              <span className="flex items-center justify-end gap-1">
                GASTO ADS <Lock size={10} className="text-shogun-text-muted" />
              </span>
            </th>
            <th className="text-label px-4 py-3 text-right">MARMITAS</th>
            <th className="text-label px-4 py-3 text-right">FATURAMENTO</th>
            <th className="text-label px-4 py-3 text-right">TICKET MÉDIO</th>
            <th className="text-label px-4 py-3 text-right">ROI</th>
            <th className="text-label px-4 py-3 text-left">OBS.</th>
          </tr>
        </thead>
        <tbody>
          {data.map((record, index) => (
            <HistoricoRow
              key={record.id}
              record={record}
              index={index}
              onUpdate={onUpdate}
            />
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-shogun-bg-base border-t-2 border-shogun-border sticky bottom-0">
            <td className="px-4 py-3 font-[var(--font-display)] font-semibold text-sm text-shogun-text-primary" colSpan={2}>
              TOTAL
            </td>
            <td className="px-4 py-3 text-right font-[var(--font-data)] text-sm text-shogun-text-primary font-bold">
              {formatBRL(totals.spend)}
            </td>
            <td className="px-4 py-3 text-right font-[var(--font-data)] text-sm text-shogun-text-primary font-bold">
              {formatNumber(totals.units)}
            </td>
            <td className="px-4 py-3 text-right font-[var(--font-data)] text-sm text-shogun-text-primary font-bold">
              {formatBRL(totals.revenue)}
            </td>
            <td className="px-4 py-3 text-right font-[var(--font-data)] text-sm text-shogun-text-primary font-bold">
              {formatBRL(avgTicket)}
            </td>
            <td className="px-4 py-3 text-right font-[var(--font-data)] text-sm text-shogun-accent font-bold">
              {totalROI.toFixed(0)}%
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function HistoricoRow({
  record,
  index,
  onUpdate,
}: {
  record: SalesHistory
  index: number
  onUpdate?: (id: string, field: string, value: string | number | null) => Promise<void>
}) {
  const revenue = record.revenue ? Number(record.revenue) : 0
  const spend = record.meta_spend ? Number(record.meta_spend) : 0
  const roi = calcROI(revenue, spend)

  return (
    <tr
      className={cn(
        "border-b border-shogun-border/50 transition-colors duration-[120ms]",
        index % 2 === 0 ? "bg-shogun-bg-surface" : "bg-shogun-bg-base",
        "hover:bg-shogun-bg-elevated"
      )}
    >
      <td className="px-4 py-3 font-[var(--font-data)] text-xs text-shogun-text-secondary">
        {record.week_ref}
      </td>
      <td className="px-4 py-3 text-sm text-shogun-text-secondary font-[var(--font-display)]">
        {record.period_start} — {record.period_end}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-[var(--font-data)] text-sm text-shogun-text-primary">
          {formatBRL(spend)}
        </span>
        <span className="ml-1.5 text-[9px] font-[var(--font-display)] text-shogun-text-muted bg-shogun-bg-elevated px-1.5 py-0.5 rounded">
          API
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <EditableCell
          value={record.units_sold ?? 0}
          onSave={(val) => { onUpdate?.(record.id, "units_sold", Number(val)) }}
          format={(v) => formatNumber(Number(v))}
        />
      </td>
      <td className="px-4 py-3 text-right">
        <EditableCell
          value={revenue}
          onSave={(val) => { onUpdate?.(record.id, "revenue", Number(val)) }}
          format={(v) => formatBRL(Number(v))}
        />
      </td>
      <td className="px-4 py-3 text-right font-[var(--font-data)] text-sm text-shogun-text-primary">
        {record.units_sold && record.units_sold > 0
          ? formatBRL(revenue / record.units_sold)
          : "—"}
      </td>
      <td className={cn(
        "px-4 py-3 text-right font-[var(--font-data)] text-sm font-medium",
        roi > 0 ? "text-shogun-accent" : "text-shogun-danger"
      )}>
        {roi.toFixed(0)}%
      </td>
      <td className="px-4 py-3">
        <EditableCell
          value={record.notes ?? ""}
          onSave={(val) => { onUpdate?.(record.id, "notes", val || null) }}
          format={(v) => String(v)}
          isText
        />
      </td>
    </tr>
  )
}

function EditableCell({
  value,
  onSave,
  format,
  isText = false,
}: {
  value: string | number
  onSave?: (val: string | number) => void
  format: (v: string | number) => string
  isText?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    setEditValue(String(value))
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleBlur = async () => {
    setEditing(false)
    if (editValue !== String(value)) {
      await onSave?.(isText ? editValue : Number(editValue))
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={isText ? "text" : "number"}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.blur()}
        className="bg-transparent border border-shogun-accent rounded px-2 py-1 text-sm font-[var(--font-data)] text-shogun-text-primary w-full text-right focus:outline-none"
      />
    )
  }

  return (
    <span
      onClick={handleClick}
      className={cn(
        "font-[var(--font-data)] text-sm text-shogun-text-primary cursor-pointer hover:text-shogun-accent transition-colors",
        isText && "font-[var(--font-display)] text-shogun-text-secondary text-left"
      )}
    >
      {format(value) || "—"}
    </span>
  )
}
