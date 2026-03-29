"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { ParsedAdMetrics } from "@/lib/meta/types"

// Module-level cache so repeated opens of the same ad are instant
const previewCache = new Map<string, string | null>()

export function prefetchAdPreview(adId: string, clientId: string) {
  const key = `${adId}:${clientId}`
  if (previewCache.has(key)) return
  // Mark as in-flight to avoid duplicate requests
  previewCache.set(key, null)
  fetch(`/api/meta/ad-preview?ad_id=${adId}&client_id=${clientId}`)
    .then((r) => r.json())
    .then((data) => previewCache.set(key, data.previewUrl ?? null))
    .catch(() => {})
}

interface AdPreviewModalProps {
  ad: ParsedAdMetrics | null
  isOpen: boolean
  onClose: () => void
  clientId: string | null
}

export function AdPreviewModal({ ad, isOpen, onClose, clientId }: AdPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !ad?.id || !clientId) {
      setPreviewUrl(null)
      return
    }

    const key = `${ad.id}:${clientId}`
    if (previewCache.has(key)) {
      setPreviewUrl(previewCache.get(key) ?? null)
      return
    }

    setPreviewLoading(true)
    fetch(`/api/meta/ad-preview?ad_id=${ad.id}&client_id=${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        const url = data.previewUrl ?? null
        previewCache.set(key, url)
        setPreviewUrl(url)
      })
      .catch(() => setPreviewUrl(null))
      .finally(() => setPreviewLoading(false))
  }, [isOpen, ad?.id, clientId])

  if (!isOpen || !ad) return null

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  const formatRoas = (value: number) => `${value.toFixed(2)}x`
  const formatPercent = (value: number) => `${value.toFixed(2)}%`

  // For video ads use thumbnailUrl as preview — imageUrl may be unrelated
  const isVideo = !!(ad.videoId || ad.objectType === "VIDEO")
  const fallbackImage = isVideo ? ad.thumbnailUrl : (ad.imageUrl || ad.thumbnailUrl)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-shogun-accent transition-colors"
        >
          <X size={32} />
        </button>

        <div className="bg-black rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Left side — creative preview */}
            <div className="relative bg-shogun-bg-elevated flex items-center justify-center min-h-[400px] lg:min-h-[600px]">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-3 text-shogun-text-secondary">
                  <div className="w-8 h-8 border-2 border-shogun-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Carregando preview…</span>
                </div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  width="100%"
                  height="100%"
                  style={{ border: "none", minHeight: "600px" }}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : fallbackImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <img src={fallbackImage} alt={ad.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="text-shogun-text-secondary text-center p-8">
                  <p className="text-sm">Sem preview disponível</p>
                </div>
              )}
            </div>

            {/* Right side — metrics */}
            <div className="bg-black p-8 flex flex-col">
              <h2 className="text-white text-xl font-[var(--font-display)] font-bold mb-6">{ad.name}</h2>

              {(ad.creativeTitle || ad.creativeBody) && (
                <div className="mb-6 space-y-2">
                  {ad.creativeTitle && <p className="text-white text-sm font-semibold">{ad.creativeTitle}</p>}
                  {ad.creativeBody && <p className="text-shogun-text-secondary text-sm">{ad.creativeBody}</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-auto">
                {[
                  { label: "Compras",    value: ad.conversions },
                  { label: "Invest.",    value: formatCurrency(ad.spend) },
                  { label: "ROAS",      value: formatRoas(ad.roas), accent: true },
                  { label: "C/Compra",  value: formatCurrency(ad.cpa) },
                  { label: "LPV",       value: ad.landingPageViews.toLocaleString("pt-BR") },
                  { label: "Taxa/LPV",  value: formatPercent(ad.menuConversionRate) },
                ].map(({ label, value, accent }) => (
                  <div key={label} className="bg-shogun-bg-elevated/50 rounded-lg p-4 border border-shogun-border/30">
                    <p className="text-shogun-text-secondary text-xs uppercase tracking-wider mb-1 font-[var(--font-display)]">{label}</p>
                    <p className={`text-2xl font-bold font-[var(--font-display)] ${accent ? "text-shogun-accent" : "text-white"}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
