"use client"

import { useEffect, useState, useRef } from "react"
import { X, Play, ExternalLink, AlertCircle, Loader2 } from "lucide-react"
import { ParsedAdMetrics } from "@/lib/meta/types"

const videoCache = new Map<string, { url?: string; type?: string; permalink?: string } | null>()

export function prefetchAdPreview(adId: string, clientId: string) {
  // Prefetch video preview for faster loading
  const key = `${adId}:${clientId}`
  if (videoCache.has(key)) return
  videoCache.set(key, null)
  fetch(`/api/meta/video-url?ad_id=${adId}&client_id=${clientId}`)
    .then((r) => r.json())
    .then((data) => videoCache.set(key, data))
    .catch(() => {})
}

interface AdPreviewModalProps {
  ad: ParsedAdMetrics | null
  isOpen: boolean
  onClose: () => void
  clientId: string | null
}

export function AdPreviewModal({ ad, isOpen, onClose, clientId }: AdPreviewModalProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoActive, setVideoActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoPermalinkRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isOpen || !ad?.id) {
      setVideoUrl(null)
      videoPermalinkRef.current = null
      setVideoActive(false)
      setLoading(false)
      setError(null)
      return
    }
    
    // Handle ESC key to close
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose, ad?.id])

  useEffect(() => {
    setVideoActive(false)
  }, [ad?.id])

  if (!isOpen || !ad) return null

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  const formatRoas = (value: number) => `${value.toFixed(2)}x`
  const formatPercent = (value: number) => `${value.toFixed(2)}%`

  const isVideo = !!(ad.videoId || ad.objectType === "VIDEO")
  const mediaUrl = ad.imageUrl || ad.thumbnailUrl
  
  const openInFacebook = () => {
    const fbUrl = `https://www.facebook.com/ads/library/?id=${ad?.id}`
    window.open(fbUrl, '_blank')
  }
  
  const handlePlay = async () => {
    if (!clientId) return
    
    const key = `${ad.id}:${clientId}:v16` // v16 para forçar nova requisição com permalink
    
    // Check cache first
    if (videoCache.has(key)) {
      const cached = videoCache.get(key)
      if (cached?.url) {
        setVideoUrl(cached.url)
        if (cached.permalink) videoPermalinkRef.current = cached.permalink
        setVideoActive(true)
        return
      }
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/meta/video-url?ad_id=${ad.id}&client_id=${clientId}`)
      const data = await response.json()
      
      console.log('[AdPreviewModal] Video API response:', data)
      
      if (data.url) {
        videoCache.set(key, data)
        setVideoUrl(data.url)
        if (data.permalink) {
          console.log('[AdPreviewModal] Setting permalink:', data.permalink)
          videoPermalinkRef.current = data.permalink
        }
        setVideoActive(true)
      } else {
        setError(data.error || 'Vídeo não disponível')
      }
    } catch (err) {
      setError('Erro ao carregar vídeo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl mx-2 md:mx-4 rounded-2xl overflow-hidden bg-shogun-bg-elevated shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <X size={18} />
        </button>

        {/* External link button */}
        <button
          onClick={openInFacebook}
          className="absolute top-3 left-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          title="Abrir na Biblioteca de Anúncios"
        >
          <ExternalLink size={18} />
        </button>

        {/* Creative area */}
        <div className="relative w-full bg-black" style={{ minHeight: 420 }}>
          {loading ? (
            <div className="flex items-center justify-center" style={{ height: 420 }}>
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                <p className="text-gray-400 text-sm">Carregando vídeo...</p>
              </div>
            </div>
          ) : videoActive && videoUrl ? (
            <>
              {/* Desktop: iframe do Facebook */}
              <div className="hidden md:flex w-full bg-black items-center justify-center py-4">
                <iframe
                  src={videoUrl}
                  className="w-auto pointer-events-auto"
                  width="320"
                  style={{ 
                    border: "none",
                    height: "auto",
                    minHeight: "550px",
                    maxHeight: "700px"
                  }}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                />
              </div>
              {/* Mobile: botão para abrir no Facebook */}
              <div className="md:hidden flex flex-col items-center justify-center gap-4 py-8 px-4" style={{ minHeight: 350 }}>
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                  <ExternalLink size={28} className="text-white" />
                </div>
                <p className="text-white text-center text-base font-medium">
                  Reprodução de vídeo
                </p>
                <p className="text-gray-400 text-center text-sm max-w-xs">
                  Por limitações do Facebook em dispositivos móveis, o vídeo será aberto diretamente no Facebook.
                </p>
                <button
                  onClick={() => {
                    console.log('[AdPreviewModal] Mobile button clicked, videoPermalink:', videoPermalinkRef.current)
                    const url = videoPermalinkRef.current || `https://www.facebook.com/ads/library/?id=${ad?.id}`
                    console.log('[AdPreviewModal] Opening URL:', url)
                    window.open(url, '_blank')
                  }}
                  className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium text-base flex items-center gap-2 active:bg-blue-700 transition-colors"
                >
                  <Play size={18} fill="white" />
                  Assistir no Facebook
                </button>
              </div>
            </>
          ) : error ? (
            <div className="flex flex-col items-center justify-center" style={{ height: 420 }}>
              <AlertCircle className="w-12 h-12 text-shogun-danger mb-4" />
              <p className="text-shogun-text-secondary text-sm mb-4">{error}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setError(null)
                    setVideoActive(false)
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Voltar
                </button>
                <button
                  onClick={openInFacebook}
                  className="px-4 py-2 bg-shogun-accent text-white rounded-lg hover:bg-shogun-accent/80 transition-colors text-sm"
                >
                  Ver no Facebook
                </button>
              </div>
            </div>
          ) : mediaUrl ? (
            <div
              className="relative w-full cursor-pointer group"
              style={{ height: 420 }}
              onClick={isVideo ? handlePlay : undefined}
            >
              <img 
                src={mediaUrl} 
                alt={ad.name} 
                className="w-full h-full object-contain bg-black"
              />
              
              {isVideo && (
                <>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/80 transition-colors">
                      <Play size={28} className="text-white ml-1" fill="white" />
                    </div>
                    <span className="text-white text-sm font-medium drop-shadow">Clique para assistir</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center" style={{ height: 420 }}>
              <AlertCircle className="w-12 h-12 text-shogun-danger mb-4" />
              <p className="text-shogun-text-secondary text-sm mb-4">Mídia não disponível</p>
              <button
                onClick={openInFacebook}
                className="px-4 py-2 bg-shogun-accent text-white rounded-lg hover:bg-shogun-accent/80 transition-colors text-sm"
              >
                Ver no Facebook
              </button>
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
