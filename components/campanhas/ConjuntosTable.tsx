"use client"

import { useState } from "react"
import { DataTable, DataTableSkeleton, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { ToggleSwitch } from "@/components/ui/ToggleSwitch"
import { useAdSets } from "@/lib/hooks/useAdSets"
import { formatBRL, formatPercent, formatNumber } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import type { ParsedAdSetMetrics } from "@/lib/meta/types"

export function ConjuntosTable({ targetCpa = 18 }: { targetCpa?: number }) {
  const { adSets, loading } = useAdSets()
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  if (loading) return <DataTableSkeleton />

  const filtered = adSets.filter((c: ParsedAdSetMetrics) => {
    if (statusFilter && c.status !== statusFilter) return false
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      return false
    return true
  })

  const ctrColor = (ctr: number) =>
    ctr > 2 ? "text-shogun-accent" : ctr >= 1 ? "text-shogun-text-primary" : "text-shogun-danger"

  const cpaColor = (cpa: number) =>
    cpa <= targetCpa ? "text-shogun-accent" : "text-shogun-danger"

  const columns: Column<ParsedAdSetMetrics>[] = [
    {
      key: "toggle",
      header: "",
      width: "52px",
      render: (row) => (
        <ToggleSwitch
          checked={row.status === "ACTIVE"}
          onChange={() => {}}
        />
      ),
    },
    {
      key: "status",
      header: "STATUS",
      width: "100px",
      render: (row) => (
        <StatusBadge
          status={row.status === "ACTIVE" ? "active" : "paused"}
        />
      ),
    },
    {
      key: "name",
      header: "CONJUNTO DE ANÚNCIOS",
      render: (row) => (
        <div>
          <p className="text-shogun-text-primary font-[var(--font-display)] font-medium text-sm">
            {row.name}
          </p>
          <p className="font-[var(--font-data)] text-xs text-shogun-text-muted">
            {row.id}
          </p>
        </div>
      ),
    },
    {
      key: "campaign",
      header: "CAMPANHA",
      render: (row) => (
        <span className="text-shogun-text-secondary text-sm font-[var(--font-display)]">
          {row.campaignName}
        </span>
      ),
    },
    {
      key: "spend",
      header: "GASTO",
      align: "right",
      render: (row) => (
        <span className="font-[var(--font-data)] text-sm text-shogun-text-primary">
          {formatBRL(row.spend)}
        </span>
      ),
    },
    {
      key: "ctr",
      header: "CTR",
      align: "right",
      render: (row) => (
        <span className={cn("font-[var(--font-data)] text-sm", ctrColor(row.ctr))}>
          {formatPercent(row.ctr)}
        </span>
      ),
    },
    {
      key: "conversions",
      header: "CONVERSÕES",
      align: "right",
      render: (row) => (
        <span className="font-[var(--font-data)] text-sm text-shogun-text-primary">
          {formatNumber(row.conversions)}
        </span>
      ),
    },
    {
      key: "cpa",
      header: "CPA",
      align: "right",
      render: (row) => (
        <span className={cn("font-[var(--font-data)] text-sm", cpaColor(row.cpa))}>
          {formatBRL(row.cpa)}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={filtered}
      rowKey={(row) => row.id}
    />
  )
}
