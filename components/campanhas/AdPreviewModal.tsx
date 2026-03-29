"use client"

import { useEffect, useState } from "react"
import { X, Play } from "lucide-react"
import { ParsedAdMetrics } from "@/lib/meta/types"

// Module-level cache so repeated opens of the same ad are instant
const previewCache = new Map<string, string | null>()

export function prefetchAdPreview(adId: string, clientId: string) {
  const key = `${adId}:${clientId}`
  if (previewCache.has(key)) return
  previewCache.set(key, null) // mark in-flight
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
  const [videoActive, setVideoActive] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !ad?.id || !clientId) {
      setPreviewUrl(null)
      setVideoActive(false)
      return
    }

    const key = `${ad.id}:${clientId}`
    if (previewCache.has(key)) {
      setPreviewUrl(previewCache.get(key) ?? null)
      return
    }

    // Fetch in background — thumbnail shows immediately
    fetch(`/api/meta/ad-preview?ad_id=${ad.id}&client_id=${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        const url = data.previewUrl ?? null
        previewCache.set(key, url)
        setPreviewUrl(url)
      })
      .catch(() => {})
  }, [isOpen, ad?.id, clientId])

  // Reset video state when ad changes
  useEffect(() => {
    setVideoActive(false)
  }, [ad?.id])

  if (!isOpen || !ad) return null

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  const formatRoas = (value: number) => `${value.toFixed(2)}x`
  const formatPercent = (value: number) => `${value.toFixed(2)}%`

  const isVideo = !!(ad.videoId || ad.objectType === "VIDEO")
  const thumbnail = isVideo ? ad.thumbnailUrl : (ad.imageUrl || ad.thumbnailUrl)

  const handlePlay = () => {
    if (!previewUrl) {
      setLoading(true)
    }
    setVideoActive(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden bg-shogun-bg-elevated shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Creative area */}
        <div className="relative w-full bg-black" style={{ minHeight: 420 }}>
          {videoActive ? (
            previewUrl ? (
              <iframe
                src={previewUrl}
                width="100%"
                height="540"
                style={{ border: "none", display: "block" }}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              /* previewUrl still loading — show spinner over thumbnail */
              <div className="relative w-full" style={{ height: 540 }}>
                {thumbnail && (
                  <img src={thumbnail} alt={ad.name} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            )
          ) : thumbnail ? (
            /* Thumbnail with play button */
            <div
              className="relative w-full cursor-pointer group"
              style={{ height: 420 }}
              onClick={handlePlay}
            >
              <img src={thumbnail} alt={ad.name} className="w-full h-full object-cover" />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              {/* Play button */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/80 transition-colors">
                  <Play size={28} className="text-white ml-1" fill="white" />
                </div>
                <span className="text-white text-sm font-medium drop-shadow">Clique para assistir</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 420 }}>
              <p className="text-shogun-text-secondary text-sm">Sem preview disponível</p>
            </div>
          )}
        </div>

        {/* Info + metrics */}
        <div className="p-5 bg-shogun-bg-elevated">
          <h2 className="text-white font-bold text-base font-[var(--font-display)] mb-4">{ad.name}</h2>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Compras",   value: ad.conversions },
              { label: "Invest.",   value: formatCurrency(ad.spend) },
              { label: "ROAS",      value: formatRoas(ad.roas), accent: true },
              { label: "C/Compra",  value: formatCurrency(ad.cpa) },
              { label: "LPV",       value: ad.landingPageViews.toLocaleString("pt-BR") },
              { label: "Taxa/LPV",  value: formatPercent(ad.menuConversionRate) },
            ].map(({ label, value, accent }) => (
              <div key={label} className="bg-shogun-bg-base/60 rounded-lg px-3 py-2 border border-shogun-border/20">
                <p className="text-shogun-text-secondary text-[10px] uppercase tracking-wider font-[var(--font-display)]">{label}</p>
                <p className={`text-lg font-bold font-[var(--font-display)] ${accent ? "text-shogun-accent" : "text-white"}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
