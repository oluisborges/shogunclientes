"use client"

import { useState } from "react"
import { DataTable, DataTableSkeleton, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { ToggleSwitch } from "@/components/ui/ToggleSwitch"
import { ExpandedRow } from "./ExpandedRow"
import { CampanhaFilters } from "./CampanhaFilters"
import { formatBRL, formatPercent, formatNumber } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import type { ParsedCampaignMetrics } from "@/lib/meta/types"

// Mock data for demonstration
const MOCK_CAMPAIGNS: ParsedCampaignMetrics[] = [
  {
    id: "1",
    name: "Marmitas Fitness - Conversão",
    status: "ACTIVE",
    objective: "CONVERSIONS",
    spend: 2450.8,
    impressions: 145200,
    clicks: 3280,
    ctr: 2.26,
    cpc: 0.75,
    conversions: 186,
    revenue: 9300,
    cpa: 13.18,
    roas: 3.8,
  },
  {
    id: "2",
    name: "Congelados Premium - Tráfego",
    status: "ACTIVE",
    objective: "TRAFFIC",
    spend: 1820.5,
    impressions: 98400,
    clicks: 1850,
    ctr: 1.88,
    cpc: 0.98,
    conversions: 95,
    revenue: 4750,
    cpa: 19.16,
    roas: 2.6,
  },
  {
    id: "3",
    name: "Promoção Semanal - Alcance",
    status: "PAUSED",
    objective: "REACH",
    spend: 680.0,
    impressions: 52100,
    clicks: 420,
    ctr: 0.81,
    cpc: 1.62,
    conversions: 18,
    revenue: 900,
    cpa: 37.78,
    roas: 1.3,
  },
]

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
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  if (loading) return <DataTableSkeleton />

  const data = campaigns ?? MOCK_CAMPAIGNS
  const filtered = data.filter((c) => {
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
      header: "CAMPANHA",
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
      key: "objective",
      header: "OBJETIVO",
      render: (row) => (
        <span className="text-shogun-text-secondary text-sm font-[var(--font-display)]">
          {row.objective}
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
