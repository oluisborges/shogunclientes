"use client"

import { X, Play } from "lucide-react"
import { ParsedAdMetrics } from "@/lib/meta/types"
import { cn } from "@/lib/utils"

interface AdPreviewModalProps {
  ad: ParsedAdMetrics | null
  isOpen: boolean
  onClose: () => void
}

export function AdPreviewModal({ ad, isOpen, onClose }: AdPreviewModalProps) {
  if (!isOpen || !ad) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatRoas = (value: number) => {
    return `${value.toFixed(2)}x`
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  // Verificar se é vídeo ou imagem
  const isVideo = ad.videoId || ad.objectType === 'VIDEO'
  const videoUrl = ad.videoId ? `https://www.facebook.com/watch/?v=${ad.videoId}` : null
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
              {displayImage ? (
                isVideo && videoUrl ? (
                  // Preview de vídeo: thumbnail + botão que abre no Facebook
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full h-full flex items-center justify-center group cursor-pointer"
                    title="Abrir vídeo no Facebook"
                  >
                    <img
                      src={displayImage}
                      alt={ad.name}
                      className="w-full h-full object-contain"
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                      <div className="bg-white/90 group-hover:bg-white rounded-full p-5 shadow-lg transition-colors">
                        <Play size={36} className="text-black fill-black ml-1" />
                      </div>
                    </div>
                    <span className="absolute bottom-3 left-0 right-0 text-center text-white text-xs opacity-70">
                      Clique para abrir no Facebook
                    </span>
                  </a>
                ) : (
                  // Preview de imagem estática
                  <div className="relative w-full h-full flex items-center justify-center p-8">
                    <img 
                      src={displayImage || ''} 
                      alt={ad.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )
              ) : (
                <div className="text-shogun-text-secondary text-center p-8">
                  <p className="text-sm">Sem preview disponível</p>
                </div>
              )}
            </div>

            {/* Right side - Ad info and metrics */}
            <div className="bg-black p-8 flex flex-col">
              {/* Ad name */}
              <h2 className="text-white text-xl font-[var(--font-display)] font-bold mb-6">
                {ad.name}
              </h2>

              {/* Creative text */}
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

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-4 mt-auto">
                {/* COMPRAS */}
                <div className="bg-shogun-bg-elevated/50 rounded-lg p-4 border border-shogun-border/30">
                  <p className="text-shogun-text-secondary text-xs uppercase tracking-wider mb-1 font-[var(--font-display)]">
                    Compras
                  </p>
                  <p className="text-white text-2xl font-bold font-[var(--font-display)]">
                    {ad.conversions}
                  </p>
                </div>

                {/* INVEST */}
                <div className="bg-shogun-bg-elevated/50 rounded-lg p-4 border border-shogun-border/30">
                  <p className="text-shogun-text-secondary text-xs uppercase tracking-wider mb-1 font-[var(--font-display)]">
                    Invest.
                  </p>
                  <p className="text-white text-2xl font-bold font-[var(--font-display)]">
                    {formatCurrency(ad.spend)}
                  </p>
                </div>

                {/* ROAS */}
                <div className="bg-shogun-bg-elevated/50 rounded-lg p-4 border border-shogun-border/30">
                  <p className="text-shogun-text-secondary text-xs uppercase tracking-wider mb-1 font-[var(--font-display)]">
                    ROAS
                  </p>
                  <p className="text-shogun-accent text-2xl font-bold font-[var(--font-display)]">
                    {formatRoas(ad.roas)}
                  </p>
                </div>

                {/* C/COMPRA */}
                <div className="bg-shogun-bg-elevated/50 rounded-lg p-4 border border-shogun-border/30">
                  <p className="text-shogun-text-secondary text-xs uppercase tracking-wider mb-1 font-[var(--font-display)]">
                    C/Compra
                  </p>
                  <p className="text-white text-2xl font-bold font-[var(--font-display)]">
                    {formatCurrency(ad.cpa)}
                  </p>
                </div>

                {/* LPV */}
                <div className="bg-shogun-bg-elevated/50 rounded-lg p-4 border border-shogun-border/30">
                  <p className="text-shogun-text-secondary text-xs uppercase tracking-wider mb-1 font-[var(--font-display)]">
                    LPV
                  </p>
                  <p className="text-white text-2xl font-bold font-[var(--font-display)]">
                    {ad.landingPageViews.toLocaleString('pt-BR')}
                  </p>
                </div>

                {/* TAXA/LPV */}
                <div className="bg-shogun-bg-elevated/50 rounded-lg p-4 border border-shogun-border/30">
                  <p className="text-shogun-text-secondary text-xs uppercase tracking-wider mb-1 font-[var(--font-display)]">
                    Taxa/LPV
                  </p>
                  <p className="text-white text-2xl font-bold font-[var(--font-display)]">
                    {formatPercent(ad.menuConversionRate)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
