"use client"

import { useState, useEffect } from "react"
import { Image, Video, Loader2 } from "lucide-react"
import { DataTable, DataTableSkeleton, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { ToggleSwitch } from "@/components/ui/ToggleSwitch"
import { AdPreviewModal, prefetchAdPreview } from "./AdPreviewModal"
import { useAds } from "@/lib/hooks/useAds"
import { useCreatives } from "@/lib/hooks/useCreatives"
import { useClientContext } from "@/lib/hooks/useClientContext"
import { formatBRL, formatPercent, formatNumber } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import type { ParsedAdMetrics } from "@/lib/meta/types"

export function AnunciosTable({ targetCpa = 18 }: { targetCpa?: number }) {
  const { ads, loading } = useAds()
  const { selectedClientId } = useClientContext()
  const { creatives, fetchCreatives, prefetchCreatives } = useCreatives()
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAd, setSelectedAd] = useState<ParsedAdMetrics | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch creatives for all ads when they load
  useEffect(() => {
    if (ads.length > 0 && selectedClientId) {
      const adIds = ads.map(ad => ad.id)
      fetchCreatives(adIds)
    }
  }, [ads, selectedClientId, fetchCreatives])

  if (loading) return <DataTableSkeleton />

  const filtered = ads.filter((c: ParsedAdMetrics) => {
    if (statusFilter && c.status !== statusFilter) return false
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      return false
    return true
  })

  // Prefetch previews for visible ads
  const handleAdClick = (ad: ParsedAdMetrics) => {
    setSelectedAd(ad)
    setIsModalOpen(true)
  }

  const hasMedia = (ad: ParsedAdMetrics) => {
    const creative = creatives[ad.id]
    return !!(creative?.thumbnailUrl || creative?.imageUrl || creative?.videoId || 
             ad.thumbnailUrl || ad.imageUrl || ad.videoId)
  }

  const isVideo = (ad: ParsedAdMetrics) => {
    const creative = creatives[ad.id]
    return !!(creative?.videoId || ad.videoId || creative?.objectType === "VIDEO" || ad.objectType === "VIDEO")
  }

  const ctrColor = (ctr: number) =>
    ctr > 2 ? "text-shogun-accent" : ctr >= 1 ? "text-shogun-text-primary" : "text-shogun-danger"

  const cpaColor = (cpa: number) =>
    cpa <= targetCpa ? "text-shogun-accent" : "text-shogun-danger"

  const columns: Column<ParsedAdMetrics>[] = [
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
      header: "ANÚNCIO",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-shogun-text-primary font-[var(--font-display)] font-medium text-sm">
              {row.name}
            </p>
            <p className="font-[var(--font-data)] text-xs text-shogun-text-muted">
              {row.id}
            </p>
          </div>
          
          {hasMedia(row) && (
            <button
              onClick={() => handleAdClick(row)}
              onMouseEnter={() => {
                if (selectedClientId) {
                  prefetchAdPreview(row.id, selectedClientId)
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-shogun-bg-base hover:bg-shogun-bg-hover transition-colors group"
              title={`Ver ${isVideo(row) ? 'vídeo' : 'imagem'} do anúncio`}
            >
              {isVideo(row) ? (
                <Video className="w-4 h-4 text-shogun-text-secondary group-hover:text-shogun-accent transition-colors" />
              ) : (
                <Image className="w-4 h-4 text-shogun-text-secondary group-hover:text-shogun-accent transition-colors" />
              )}
            </button>
          )}
        </div>
      ),
    },
    {
      key: "adset",
      header: "CONJUNTO",
      render: (row) => (
        <span className="text-shogun-text-secondary text-sm font-[var(--font-display)]">
          {row.adsetName}
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
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(row) => row.id}
      />
      
      <AdPreviewModal
        ad={selectedAd}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAd(null)
        }}
        clientId={selectedClientId}
      />
    </>
  )
}
