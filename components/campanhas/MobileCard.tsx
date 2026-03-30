"use client"

import { cn } from "@/lib/utils"
import { Play } from "lucide-react"
import type { ParsedCampaignMetrics, ParsedAdSetMetrics, ParsedAdMetrics } from "@/lib/meta/types"

interface MobileCardProps {
  type: "campaign" | "adset" | "ad"
  item: ParsedCampaignMetrics | ParsedAdSetMetrics | ParsedAdMetrics
  isSelected: boolean
  onSelect: () => void
  onPreview?: (e: React.MouseEvent) => void
  parentName?: string
  effectiveStatus?: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

const formatRoas = (value: number) => `${value.toFixed(2)}x`
const formatPercent = (value: number) => `${value.toFixed(2)}%`

export function MobileCard({ 
  type, 
  item, 
  isSelected, 
  onSelect, 
  onPreview,
  parentName,
  effectiveStatus 
}: MobileCardProps) {
  const status = effectiveStatus || item.status
  const isActive = status === "ACTIVE"

  const ad = type === "ad" ? item as ParsedAdMetrics : null

  return (
    <div
      onClick={onSelect}
      className={cn(
        "bg-shogun-bg-elevated border border-shogun-border rounded-xl p-4 cursor-pointer transition-all",
        isSelected && "border-shogun-accent bg-shogun-accent/5"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 mt-1 rounded border border-shogun-border text-shogun-accent focus:ring-1 focus:ring-shogun-accent cursor-pointer"
        />
        
        {/* Thumbnail for ads */}
        {ad?.thumbnailUrl && (
          <button
            type="button"
            className="relative w-14 h-14 rounded-lg overflow-hidden bg-shogun-bg-base flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              if (onPreview) onPreview(e)
            }}
          >
            <img src={ad.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            {(ad.videoId || ad.objectType === 'VIDEO') && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Play size={20} className="text-white" fill="white" />
              </div>
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              isActive ? "bg-shogun-accent" : "bg-gray-500"
            )} />
            <span className="text-sm font-[var(--font-display)] font-medium text-shogun-text-primary truncate">
              {item.name}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-shogun-text-secondary">
              {isActive ? "Ativo" : "Pausado"}
            </span>
            {parentName && (
              <span className="text-xs text-shogun-text-secondary truncate">
                • {parentName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2">
        <MetricItem label="Investido" value={formatCurrency(item.spend)} />
        <MetricItem label="Faturamento" value={formatCurrency(item.revenue)} highlight />
        <MetricItem label="ROAS" value={formatRoas(item.roas)} accent />
        <MetricItem label="Pedidos" value={item.conversions.toString()} />
        <MetricItem label="Custo/Pedido" value={formatCurrency(item.cpa)} />
        <MetricItem label="Taxa Conv." value={formatPercent(item.menuConversionRate)} />
      </div>
    </div>
  )
}

function MetricItem({ label, value, highlight, accent }: { 
  label: string
  value: string
  highlight?: boolean
  accent?: boolean
}) {
  return (
    <div className="bg-shogun-bg-base/50 rounded-lg px-2 py-1.5">
      <div className="text-[10px] text-shogun-text-secondary uppercase tracking-wider">{label}</div>
      <div className={cn(
        "text-sm font-[var(--font-data)] font-semibold",
        highlight && "text-green-400",
        accent && "text-shogun-accent",
        !highlight && !accent && "text-shogun-text-primary"
      )}>
        {value}
      </div>
    </div>
  )
}

// Totals card for mobile
interface MobileTotalsCardProps {
  label: string
  totals: {
    spend: number
    revenue: number
    conversions: number
    landingPageViews: number
  }
}

export function MobileTotalsCard({ label, totals }: MobileTotalsCardProps) {
  const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0
  const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0
  const menuConversionRate = totals.landingPageViews > 0 
    ? (totals.conversions / totals.landingPageViews) * 100 
    : 0

  return (
    <div className="bg-shogun-bg-elevated border-2 border-shogun-accent rounded-xl p-4">
      <div className="text-xs font-[var(--font-display)] font-bold text-shogun-accent uppercase mb-3">
        {label}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MetricItem label="Investido" value={formatCurrency(totals.spend)} />
        <MetricItem label="Faturamento" value={formatCurrency(totals.revenue)} highlight />
        <MetricItem label="ROAS" value={formatRoas(roas)} accent />
        <MetricItem label="Pedidos" value={totals.conversions.toString()} />
        <MetricItem label="Custo/Pedido" value={formatCurrency(cpa)} />
        <MetricItem label="Taxa Conv." value={formatPercent(menuConversionRate)} />
      </div>
    </div>
  )
}
