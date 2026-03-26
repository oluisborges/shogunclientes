"use client"

import { useState } from "react"
import { DataTable, DataTableSkeleton, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { ExpandedRow } from "./ExpandedRow"
import { CampanhaFilters } from "./CampanhaFilters"
import { useMetaData } from "@/lib/hooks/useMetaData"
import { formatBRL, formatPercent, formatNumber } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import type { ParsedCampaignMetrics } from "@/lib/meta/types"

interface CampanhasTableProps {
  campaigns?: ParsedCampaignMetrics[]
  loading?: boolean
  targetCpa?: number
}

export function CampanhasTable({
  campaigns,
  loading,
  targetCpa = 18,
}: CampanhasTableProps) {
  const { campaigns: realCampaigns, loading: realLoading, error } = useMetaData()
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const isLoading = loading ?? realLoading
  const data = campaigns ?? realCampaigns ?? []
  
  if (isLoading) return <DataTableSkeleton />
  
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-shogun-danger text-sm font-[var(--font-display)] mb-4">
          {error}
        </div>
        <a 
          href="/configuracoes" 
          className="text-shogun-accent text-sm font-[var(--font-display)] hover:underline"
        >
          Ir para Configurações →
        </a>
      </div>
    )
  }

  const filtered = data.filter((c: ParsedCampaignMetrics) => {
    if (statusFilter && c.status !== statusFilter) return false
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      return false
    return true
  })

  const ctrColor = (ctr: number) =>
    ctr > 2 ? "text-shogun-accent" : ctr >= 1 ? "text-shogun-text-primary" : "text-shogun-danger"

  const cpaColor = (cpa: number) =>
    cpa <= targetCpa ? "text-shogun-accent" : "text-shogun-danger"

  const columns: Column<ParsedCampaignMetrics>[] = [
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
      header: "CAMPANHA",
      render: (row) => (
        <p className="text-shogun-text-primary font-[var(--font-display)] font-medium text-sm">
          {row.name}
        </p>
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
    <>
      <CampanhaFilters
        onSearchChange={setSearchQuery}
        onStatusFilter={setStatusFilter}
        activeStatus={statusFilter}
      />
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(row) => row.id}
        expandedContent={(row) => <ExpandedRow campaign={row} />}
      />
    </>
  )
}
