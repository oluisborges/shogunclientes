"use client"

import { useState, useEffect, useCallback } from "react"
import { useClientContext } from "./useClientContext"

interface AdCreative {
  thumbnailUrl?: string | null
  imageUrl?: string | null
  videoId?: string | null
  creativeTitle?: string | null
  creativeBody?: string | null
  objectType?: string | null
}

interface CreativeCache {
  [adId: string]: AdCreative
}

interface UseCreativesReturn {
  creatives: CreativeCache
  loading: boolean
  error: string | null
  fetchCreatives: (adIds: string[]) => Promise<void>
  getCreative: (adId: string) => AdCreative | undefined
  prefetchCreatives: (adIds: string[]) => void
  clearCache: () => void
}

export function useCreatives(): UseCreativesReturn {
  const { selectedClientId } = useClientContext()
  const [creatives, setCreatives] = useState<CreativeCache>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCreatives = useCallback(async (adIds: string[]) => {
    if (!adIds.length || !selectedClientId) return

    // Filter out already cached creatives
    const uncachedIds = adIds.filter(id => !creatives[id])
    if (!uncachedIds.length) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/meta/creatives?ad_ids=${uncachedIds.join(',')}&client_id=${selectedClientId}`
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro: ${response.status}`)
      }

      const data = await response.json()
      
      // Update cache with new creatives
      setCreatives(prev => ({
        ...prev,
        ...data
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao buscar criativos"
      setError(message)
      console.error('Error fetching creatives:', err)
    } finally {
      setLoading(false)
    }
  }, [creatives, selectedClientId])

  const getCreative = useCallback((adId: string) => {
    return creatives[adId]
  }, [creatives])

  const prefetchCreatives = useCallback((adIds: string[]) => {
    // Fetch in background without showing loading state
    const uncachedIds = adIds.filter(id => !creatives[id])
    if (uncachedIds.length > 0) {
      fetchCreatives(uncachedIds)
    }
  }, [creatives, fetchCreatives])

  const clearCache = useCallback(() => {
    setCreatives({})
    setError(null)
  }, [])

  return {
    creatives,
    loading,
    error,
    fetchCreatives,
    getCreative,
    prefetchCreatives,
    clearCache
  }
}
