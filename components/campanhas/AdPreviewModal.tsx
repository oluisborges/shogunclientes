"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { ParsedAdMetrics } from "@/lib/meta/types"

interface AdPreviewModalProps {
  ad: ParsedAdMetrics | null
  isOpen: boolean
  onClose: () => void
  clientId: string | null
}

export function AdPreviewModal({ ad, isOpen, onClose, clientId }: AdPreviewModalProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !ad?.videoId || !clientId) {
      setVideoSrc(null)
      return
    }

    setVideoLoading(true)
    fetch(`/api/meta/video-url?video_id=${ad.videoId}&client_id=${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        setVideoSrc(data.source ?? null)
      })
      .catch(() => setVideoSrc(null))
      .finally(() => setVideoLoading(false))
  }, [isOpen, ad?.videoId, clientId])

  if (!isOpen || !ad) return null

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  const formatRoas = (value: number) => `${value.toFixed(2)}x`
  const formatPercent = (value: number) => `${value.toFixed(2)}%`

  const isVideo = ad.videoId || ad.objectType === "VIDEO"
  const displayImage = ad.imageUrl || ad.thumbnailUrl

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-shogun-accent transition-colors"
        >
          <X size={32} />
        </button>

        <div className="bg-black rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left side - Creative preview */}
            <div className="relative bg-shogun-bg-elevated flex items-center justify-center min-h-[400px] lg:min-h-[600px]">
              {isVideo ? (
                videoLoading ? (
                  <div className="flex flex-col items-center gap-3 text-shogun-text-secondary">
                    <div className="w-8 h-8 border-2 border-shogun-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Carregando vídeo…</span>
                  </div>
                ) : videoSrc ? (
                  <video
                    src={videoSrc}
                    controls
                    autoPlay={false}
                    className="w-full h-full object-contain max-h-[600px]"
                    poster={displayImage ?? undefined}
                  />
                ) : displayImage ? (
                  /* Fallback: thumbnail when video URL couldn't be fetched */
                  <img
                    src={displayImage}
                    alt={ad.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <p className="text-shogun-text-secondary text-sm text-center p-8">
                    Sem preview disponível
                  </p>
                )
              ) : displayImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <img
                    src={displayImage}
                    alt={ad.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="text-shogun-text-secondary text-center p-8">
                  <p className="text-sm">Sem preview disponível</p>
                </div>
              )}
            </div>

            {/* Right side - Ad info and metrics */}
            <div className="bg-black p-8 flex flex-col">
              <h2 className="text-white text-xl font-[var(--font-display)] font-bold mb-6">
                {ad.name}
              </h2>

              {(ad.creativeTitle || ad.creativeBody) && (
                <div className="mb-6 space-y-2">
                  {ad.creativeTitle && (
                    <p className="text-white text-sm font-semibold">{ad.creativeTitle}</p>
                  )}
                  {ad.creativeBody && (
                    <p className="text-shogun-text-secondary text-sm">{ad.creativeBody}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="bg-shogun-bg-elevated/50 rounded-lg p-4 border border-shogun-border/30">
                  <p className="text-shogun-text-secondary text-xs uppercase tracking-wider mb-1 font-[var(--font-display)]">Compras</p>
                  <p className="text-white text-2xl font-bold font-[var(--font-display)]">{ad.conversions}</p>
                </div>

                <div className="bg-shogun-bg-elevated/50 rounded-lg p-4 border border-shogun-border/30">
                  <p className="text-shogun-text-secondary text-xs uppercase tracking-wider mb-1 font-[var(--font-display)]">Invest.</p>
                  <p className="text-white text-2xl font-bold font-[var(--font-display)]">{formatCurrency(ad.spend)}</p>
                </div>

                <div className="bg-shogun-bg-elevated/50 rounded-lg p-4 border border-shogun-border/30">
                  <p className="text-shogun-text-secondary text-xs uppercase tracking-wider mb-1 font-[var(--font-display)]">ROAS</p>
                  <p className="text-shogun-accent text-2xl font-bold font-[var(--font-display)]">{formatRoas(ad.roas)}</p>
                </div>

                <div className="bg-shogun-bg-elevated/50 rounded-lg p-4 border border-shogun-border/30">
                  <p className="text-shogun-text-secondary text-xs uppercase tracking-wider mb-1 font-[var(--font-display)]">C/Compra</p>
                  <p className="text-white text-2xl font-bold font-[var(--font-display)]">{formatCurrency(ad.cpa)}</p>
                </div>

                <div className="bg-shogun-bg-elevated/50 rounded-lg p-4 border border-shogun-border/30">
                  <p className="text-shogun-text-secondary text-xs uppercase tracking-wider mb-1 font-[var(--font-display)]">LPV</p>
                  <p className="text-white text-2xl font-bold font-[var(--font-display)]">{ad.landingPageViews.toLocaleString("pt-BR")}</p>
                </div>

                <div className="bg-shogun-bg-elevated/50 rounded-lg p-4 border border-shogun-border/30">
                  <p className="text-shogun-text-secondary text-xs uppercase tracking-wider mb-1 font-[var(--font-display)]">Taxa/LPV</p>
                  <p className="text-white text-2xl font-bold font-[var(--font-display)]">{formatPercent(ad.menuConversionRate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
