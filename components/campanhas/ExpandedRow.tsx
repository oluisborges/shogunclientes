import { ImageIcon } from "lucide-react"
import { formatBRL, formatNumber, formatPercent } from "@/lib/utils/currency"
import type { ParsedCampaignMetrics } from "@/lib/meta/types"

interface ExpandedRowProps {
  campaign: ParsedCampaignMetrics
  thumbnailUrl?: string | null
}

export function ExpandedRow({ campaign, thumbnailUrl }: ExpandedRowProps) {
  const metrics = [
    { label: "IMPRESSÕES", value: formatNumber(campaign.impressions) },
    { label: "ALCANCE", value: formatNumber(campaign.impressions) },
    { label: "FREQUÊNCIA", value: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions * 100).toFixed(1) : "0" },
    { label: "CLIQUES", value: formatNumber(campaign.clicks) },
    { label: "CPM", value: campaign.impressions > 0 ? formatBRL((campaign.spend / campaign.impressions) * 1000) : "—" },
    { label: "RESULTADOS", value: formatNumber(campaign.conversions) },
  ]

  return (
    <div className="flex gap-6">
      <div className="w-[240px] shrink-0">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt="Criativo"
            className="w-full rounded-md object-cover"
          />
        ) : (
          <div className="w-full h-[180px] bg-shogun-bg-elevated rounded-md flex items-center justify-center">
            <ImageIcon size={40} className="text-shogun-text-muted" />
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="text-label">{m.label}</p>
            <p className="font-[var(--font-data)] text-lg font-bold text-shogun-text-primary mt-1">
              {m.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
