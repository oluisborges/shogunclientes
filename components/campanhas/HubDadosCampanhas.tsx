"use client"

import { useState } from "react"
import { ChevronRight, Play, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ParsedCampaignMetrics, ParsedAdSetMetrics, ParsedAdMetrics } from "@/lib/meta/types"
import { AdPreviewModal, prefetchAdPreview } from "./AdPreviewModal"
import { MobileCard, MobileTotalsCard } from "./MobileCard"
import { useClientContext } from "@/lib/hooks/useClientContext"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface HubDadosCampanhasProps {
  campaigns: ParsedCampaignMetrics[]
  adsets: ParsedAdSetMetrics[]
  ads: ParsedAdMetrics[]
  loading: boolean
}

type ViewLevel = "campaigns" | "adsets" | "ads"

interface SortableHeaderProps {
  id: string
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

function SortableHeader({ id, children, onClick, className }: SortableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={cn(className, "relative group")}
    >
      <div className="flex items-center justify-between gap-2 w-full">
        <div 
          className="flex-1 cursor-pointer hover:text-shogun-accent transition-colors"
          onClick={onClick}
          title="Clique para ordenar"
        >
          {children}
        </div>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity p-1"
          title="Arraste para reorganizar"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} className="text-shogun-accent" />
        </div>
      </div>
    </th>
  )
}

export function HubDadosCampanhas({
  campaigns,
  adsets,
  ads,
  loading,
}: HubDadosCampanhasProps) {
  const [viewLevel, setViewLevel] = useState<ViewLevel>("campaigns")
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([])
  const [selectedAdSetIds, setSelectedAdSetIds] = useState<string[]>([])
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([])
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'name', 'spend', 'revenue', 'roas', 'conversions', 'cpa', 'menuConversionRate', 'landingPageViews', 'avgPurchaseValue', 'reach'
  ])
  const [previewAd, setPreviewAd] = useState<ParsedAdMetrics | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { selectedClientId } = useClientContext()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const toggleCampaignSelection = (campaignId: string) => {
    setSelectedCampaignIds(prev => 
      prev.includes(campaignId)
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    )
  }

  const toggleAdSetSelection = (adsetId: string) => {
    setSelectedAdSetIds(prev => 
      prev.includes(adsetId)
        ? prev.filter(id => id !== adsetId)
        : [...prev, adsetId]
    )
  }

  const toggleAdSelection = (adId: string) => {
    setSelectedAdIds(prev => 
      prev.includes(adId)
        ? prev.filter(id => id !== adId)
        : [...prev, adId]
    )
  }

  const handleAdPreview = (ad: ParsedAdMetrics, e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewAd(ad)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setPreviewAd(null)
  }

  const getStatusColor = (status: string) => {
    return status === "ACTIVE" ? "bg-shogun-accent" : "bg-gray-500"
  }

  // Verificar se conjunto ou anúncio deve ser considerado pausado por herança
  const getEffectiveStatus = (item: any, type: 'adset' | 'ad') => {
    if (type === 'adset') {
      const campaign = campaigns.find(c => c.id === item.campaignId)
      if (campaign && campaign.status !== 'ACTIVE') return 'PAUSED'
      return item.status
    } else {
      const adset = adsets.find(a => a.id === item.adsetId)
      if (adset) {
        const campaign = campaigns.find(c => c.id === adset.campaignId)
        if (campaign && campaign.status !== 'ACTIVE') return 'PAUSED'
        if (adset.status !== 'ACTIVE') return 'PAUSED'
      }
      return item.status
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const formatRoas = (value: number) => {
    return `${value.toFixed(2)}x`
  }

  // Filtrar dados baseado na seleção (cascata)
  // Quando não há seleção, mostra todos os itens
  const filteredAdsets = selectedCampaignIds.length > 0 
    ? adsets.filter(adset => selectedCampaignIds.includes(adset.campaignId))
    : adsets

  const filteredAds = selectedAdSetIds.length > 0
    ? ads.filter(ad => selectedAdSetIds.includes(ad.adsetId))
    : selectedCampaignIds.length > 0
      ? ads.filter(ad => {
          const adset = adsets.find(a => a.id === ad.adsetId)
          return adset && selectedCampaignIds.includes(adset.campaignId)
        })
      : ads

  const calculateTotals = (items: any[]) => {
    const totals = items.reduce((acc, item) => ({
      spend: acc.spend + item.spend,
      revenue: acc.revenue + (item.revenue || 0),
      conversions: acc.conversions + item.conversions,
      impressions: acc.impressions + item.impressions,
      clicks: acc.clicks + item.clicks,
      reach: acc.reach + (item.reach || 0),
      landingPageViews: acc.landingPageViews + (item.landingPageViews || 0),
      avgPurchaseValue: acc.avgPurchaseValue + (item.avgPurchaseValue || 0),
    }), { spend: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0, reach: 0, landingPageViews: 0, avgPurchaseValue: 0 })
    
    // Calcular ticket médio como média, não soma
    if (items.length > 0) {
      totals.avgPurchaseValue = totals.avgPurchaseValue / items.length
    }
    
    return totals
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const getColumnHeader = (col: string) => {
    const headers: Record<string, string> = {
      name: viewLevel === 'campaigns' ? 'Campanha' : viewLevel === 'adsets' ? 'Conjunto' : 'Anúncio',
      spend: 'Investimento',
      revenue: 'Faturamento',
      roas: 'ROAS',
      conversions: 'Pedidos',
      cpa: 'Custo por Pedido',
      menuConversionRate: 'Taxa de conversão cardápio',
      landingPageViews: 'Visualização de Cardápio',
      avgPurchaseValue: 'Ticket Médio',
      reach: 'Alcance'
    }
    return headers[col] || col
  }

  const getVisibleColumns = () => {
    return columnOrder
  }

  const renderColumnHeaders = () => {
    const visibleColumns = getVisibleColumns().filter(col => col !== 'name')
    
    return visibleColumns.map(col => {
      const header = getColumnHeader(col)
      const sortIndicator = sortColumn === col ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''
      
      return (
        <SortableHeader
          key={col}
          id={col}
          onClick={() => handleSort(col)}
          className="px-2 py-1 text-right font-medium hover:text-shogun-accent text-[10px] text-shogun-text-secondary uppercase leading-tight"
        >
          {header}{sortIndicator}
        </SortableHeader>
      )
    })
  }

  const sortData = <T extends any>(data: T[], getField: (item: T) => any): T[] => {
    if (!sortColumn) {
      // Ordenar por status: ativos primeiro
      return [...data].sort((a: any, b: any) => {
        if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1
        if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1
        return 0
      })
    }

    return [...data].sort((a: any, b: any) => {
      const aValue = getField(a)
      const bValue = getField(b)
      
      // Ordenar por status primeiro
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1
      if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1
      
      // Depois ordenar pela coluna selecionada
      // Se for string (nome), ordenar alfabeticamente
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'pt-BR')
          : bValue.localeCompare(aValue, 'pt-BR')
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const renderCampaignRow = (campaign: ParsedCampaignMetrics) => {
    const isSelected = selectedCampaignIds.includes(campaign.id)

    return (
      <tr
        key={campaign.id}
        onClick={() => toggleCampaignSelection(campaign.id)}
        className={cn(
          "cursor-pointer hover:bg-shogun-bg-elevated/50 transition-all duration-200 border-b border-shogun-border/50",
          isSelected && "bg-shogun-bg-elevated border-l-4 border-l-shogun-accent shadow-sm"
        )}
      >
        <td className="px-2 py-1">
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleCampaignSelection(campaign.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-3 h-3 rounded border border-shogun-border text-shogun-accent focus:ring-1 focus:ring-shogun-accent cursor-pointer"
            />
            <div className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(campaign.status))} />
            <div>
              <div className="text-xs font-[var(--font-display)] text-shogun-text-primary leading-tight truncate max-w-[150px]">
                {campaign.name}
              </div>
              <div className="text-[10px] text-shogun-text-secondary leading-tight">
                {campaign.status === "ACTIVE" ? "Ativo" : "Pausado"}
              </div>
            </div>
          </div>
        </td>
        {columnOrder.slice(1).map(col => {
          if (col === 'spend') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium">{formatCurrency(campaign.spend)}</td>
          }
          if (col === 'revenue') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium text-green-400">{formatCurrency(campaign.revenue)}</td>
          }
          if (col === 'roas') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium text-shogun-accent">{formatRoas(campaign.roas)}</td>
          }
          if (col === 'conversions') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium">{campaign.conversions}</td>
          }
          if (col === 'cpa') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{formatCurrency(campaign.cpa)}</td>
          }
          if (col === 'menuConversionRate') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{formatPercent(campaign.menuConversionRate)}</td>
          }
          if (col === 'landingPageViews') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{campaign.landingPageViews.toLocaleString('pt-BR')}</td>
          }
          if (col === 'avgPurchaseValue') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{formatCurrency(campaign.avgPurchaseValue)}</td>
          }
          if (col === 'reach') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{campaign.reach.toLocaleString('pt-BR')}</td>
          }
          return null
        })}
      </tr>
    )
  }

  const renderAdSetRow = (adset: ParsedAdSetMetrics) => {
    const campaign = campaigns.find(c => c.id === adset.campaignId)
    const isSelected = selectedAdSetIds.includes(adset.id)
    const effectiveStatus = getEffectiveStatus(adset, 'adset')
    
    return (
      <tr
        key={adset.id}
        onClick={() => toggleAdSetSelection(adset.id)}
        className={cn(
          "cursor-pointer hover:bg-shogun-bg-elevated/50 transition-all duration-200 border-b border-shogun-border/50",
          isSelected && "bg-shogun-bg-elevated border-l-4 border-l-shogun-accent shadow-sm"
        )}
      >
        <td className="px-2 py-1">
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleAdSetSelection(adset.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-3 h-3 rounded border border-shogun-border text-shogun-accent focus:ring-1 focus:ring-shogun-accent cursor-pointer"
            />
            <div className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(effectiveStatus))} />
            <div>
              <div className="text-xs font-[var(--font-display)] text-shogun-text-primary leading-tight truncate max-w-[120px]">
                {adset.name}
              </div>
              <div className="text-[10px] text-shogun-text-secondary leading-tight">
                {effectiveStatus === "ACTIVE" ? "Ativo" : "Pausado"}
              </div>
            </div>
          </div>
        </td>
        <td className="px-2 py-1 text-[10px] text-shogun-text-secondary truncate max-w-[100px]">{campaign?.name}</td>
        {columnOrder.slice(1).map(col => {
          if (col === 'spend') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium">{formatCurrency(adset.spend)}</td>
          }
          if (col === 'revenue') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium text-green-400">{formatCurrency(adset.revenue)}</td>
          }
          if (col === 'roas') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium text-shogun-accent">{formatRoas(adset.roas)}</td>
          }
          if (col === 'conversions') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium">{adset.conversions}</td>
          }
          if (col === 'cpa') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{formatCurrency(adset.cpa)}</td>
          }
          if (col === 'menuConversionRate') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{formatPercent(adset.menuConversionRate)}</td>
          }
          if (col === 'landingPageViews') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{adset.landingPageViews.toLocaleString('pt-BR')}</td>
          }
          if (col === 'avgPurchaseValue') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{formatCurrency(adset.avgPurchaseValue)}</td>
          }
          if (col === 'reach') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{adset.reach.toLocaleString('pt-BR')}</td>
          }
          return null
        })}
      </tr>
    )
  }

  const renderAdRow = (ad: ParsedAdMetrics) => {
    const adset = adsets.find(a => a.id === ad.adsetId)
    const isSelected = selectedAdIds.includes(ad.id)
    const effectiveStatus = getEffectiveStatus(ad, 'ad')
    
    return (
      <tr 
        key={ad.id} 
        onClick={() => toggleAdSelection(ad.id)}
        className={cn(
          "cursor-pointer hover:bg-shogun-bg-elevated/50 transition-all duration-200 border-b border-shogun-border/50",
          isSelected && "bg-shogun-bg-elevated border-l-4 border-l-shogun-accent shadow-sm"
        )}
      >
        <td className="px-2 py-1">
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleAdSelection(ad.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-3 h-3 rounded border border-shogun-border text-shogun-accent focus:ring-1 focus:ring-shogun-accent cursor-pointer"
            />
            {ad.thumbnailUrl && (
              <div
                className="relative w-6 h-6 rounded overflow-hidden bg-shogun-bg-base flex-shrink-0 cursor-pointer group"
                onClick={(e) => handleAdPreview(ad, e)}
                onMouseEnter={() => selectedClientId && prefetchAdPreview(ad.id, selectedClientId)}
                title="Clique para visualizar o anúncio"
              >
                <img src={ad.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                {(ad.videoId || ad.objectType === 'VIDEO') && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={10} className="text-white" fill="white" />
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-1">
              <div className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(effectiveStatus))} />
              <div>
                <div className="text-xs font-[var(--font-display)] text-shogun-text-primary leading-tight truncate max-w-[100px]">
                  {ad.name}
                </div>
                <div className="text-[10px] text-shogun-text-secondary leading-tight">
                  {effectiveStatus === "ACTIVE" ? "Ativo" : "Pausado"}
                </div>
              </div>
            </div>
          </div>
        </td>
        <td className="px-2 py-1 text-[10px] text-shogun-text-secondary truncate max-w-[80px]">{adset?.name}</td>
        {columnOrder.slice(1).map(col => {
          if (col === 'spend') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium">{formatCurrency(ad.spend)}</td>
          }
          if (col === 'revenue') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium text-green-400">{formatCurrency(ad.revenue)}</td>
          }
          if (col === 'roas') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium text-shogun-accent">{formatRoas(ad.roas)}</td>
          }
          if (col === 'conversions') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium">{ad.conversions}</td>
          }
          if (col === 'cpa') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{formatCurrency(ad.cpa)}</td>
          }
          if (col === 'menuConversionRate') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{formatPercent(ad.menuConversionRate)}</td>
          }
          if (col === 'landingPageViews') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{ad.landingPageViews.toLocaleString('pt-BR')}</td>
          }
          if (col === 'avgPurchaseValue') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{formatCurrency(ad.avgPurchaseValue)}</td>
          }
          if (col === 'reach') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{ad.reach.toLocaleString('pt-BR')}</td>
          }
          return null
        })}
      </tr>
    )
  }

  const renderTotalRow = () => {
    let totals
    let label = "TOTAL"
    let items: any[] = []

    if (viewLevel === "campaigns") {
      items = selectedCampaignIds.length > 0 
        ? campaigns.filter(c => selectedCampaignIds.includes(c.id))
        : campaigns
      totals = calculateTotals(items)
      label = selectedCampaignIds.length > 0
        ? `${selectedCampaignIds.length} CAMPANHAS SELECIONADAS`
        : `${campaigns.length} CAMPANHAS`
    } else if (viewLevel === "adsets") {
      items = selectedAdSetIds.length > 0
        ? filteredAdsets.filter(a => selectedAdSetIds.includes(a.id))
        : filteredAdsets
      totals = calculateTotals(items)
      label = selectedAdSetIds.length > 0
        ? `${selectedAdSetIds.length} CONJUNTOS SELECIONADOS`
        : `${filteredAdsets.length} CONJUNTOS`
    } else {
      items = selectedAdIds.length > 0
        ? filteredAds.filter(a => selectedAdIds.includes(a.id))
        : filteredAds
      totals = calculateTotals(items)
      label = selectedAdIds.length > 0
        ? `${selectedAdIds.length} ANÚNCIOS SELECIONADOS`
        : `${filteredAds.length} ANÚNCIOS`
    }

    const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0
    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
    const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0
    const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0
    const menuConversionRate = totals.landingPageViews > 0 ? (totals.conversions / totals.landingPageViews) * 100 : 0

    return (
      <tr className="bg-shogun-bg-elevated/80 border-t-2 border-shogun-accent font-bold shadow-sm">
        <td className="px-2 py-1 text-xs text-shogun-accent uppercase leading-tight">{label}</td>
        {viewLevel === "adsets" || viewLevel === "ads" ? <td></td> : null}
        {columnOrder.slice(1).map(col => {
          if (col === 'spend') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium">{formatCurrency(totals.spend)}</td>
          }
          if (col === 'revenue') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium text-green-400">{formatCurrency(totals.revenue)}</td>
          }
          if (col === 'roas') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium text-shogun-accent">{formatRoas(roas)}</td>
          }
          if (col === 'conversions') {
            return <td key={col} className="px-2 py-1 text-right text-xs font-medium">{totals.conversions}</td>
          }
          if (col === 'cpa') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{formatCurrency(cpa)}</td>
          }
          if (col === 'menuConversionRate') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{formatPercent(menuConversionRate)}</td>
          }
          if (col === 'landingPageViews') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{totals.landingPageViews.toLocaleString('pt-BR')}</td>
          }
          if (col === 'avgPurchaseValue') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{formatCurrency(totals.avgPurchaseValue)}</td>
          }
          if (col === 'reach') {
            return <td key={col} className="px-2 py-1 text-right text-xs">{totals.reach.toLocaleString('pt-BR')}</td>
          }
          return null
        })}
      </tr>
    )
  }

  if (loading) {
    return <div className="text-center py-12 text-shogun-text-secondary">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      {/* Info de seleção */}
      {(selectedCampaignIds.length > 0 || selectedAdSetIds.length > 0 || selectedAdIds.length > 0) && (
        <div className="flex items-center gap-4 text-sm text-shogun-text-secondary">
          {selectedCampaignIds.length > 0 && (
            <span>{selectedCampaignIds.length} campanha(s) selecionada(s)</span>
          )}
          {selectedAdSetIds.length > 0 && (
            <span>{selectedAdSetIds.length} conjunto(s) selecionado(s)</span>
          )}
          {selectedAdIds.length > 0 && (
            <span>{selectedAdIds.length} anúncio(s) selecionado(s)</span>
          )}
          <button
            onClick={() => {
              setSelectedCampaignIds([])
              setSelectedAdSetIds([])
              setSelectedAdIds([])
            }}
            className="text-shogun-accent hover:underline"
          >
            Limpar seleção
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-shogun-border">
        <button
          onClick={() => setViewLevel("campaigns")}
          className={cn(
            "px-3 py-1 text-xs font-[var(--font-display)] font-medium border-b-2 -mb-px transition-colors leading-tight",
            viewLevel === "campaigns"
              ? "text-shogun-accent border-shogun-accent"
              : "text-shogun-text-secondary border-transparent hover:text-shogun-text-primary"
          )}
        >
          Campanhas {campaigns.length > 0 && <span className="ml-1">{campaigns.length}</span>}
        </button>
        <button
          onClick={() => setViewLevel("adsets")}
          className={cn(
            "px-3 py-1 text-xs font-[var(--font-display)] font-medium border-b-2 -mb-px transition-colors leading-tight",
            viewLevel === "adsets"
              ? "text-shogun-accent border-shogun-accent"
              : "text-shogun-text-secondary border-transparent hover:text-shogun-text-primary"
          )}
        >
          Conjuntos {filteredAdsets.length > 0 && <span className="ml-1">{filteredAdsets.length}</span>}
        </button>
        <button
          onClick={() => setViewLevel("ads")}
          className={cn(
            "px-3 py-1 text-xs font-[var(--font-display)] font-medium border-b-2 -mb-px transition-colors leading-tight",
            viewLevel === "ads"
              ? "text-shogun-accent border-shogun-accent"
              : "text-shogun-text-secondary border-transparent hover:text-shogun-text-primary"
          )}
        >
          Anúncios {filteredAds.length > 0 && <span className="ml-1">{filteredAds.length}</span>}
        </button>
      </div>

      {/* Table - Desktop only */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full">
            <thead className="border-b border-shogun-border">
              <tr className="text-[10px] text-shogun-text-secondary uppercase leading-tight">
                {/* Colunas fixas (não reorganizáveis) */}
                <th 
                  className="px-2 py-1 text-left font-medium text-[10px] cursor-pointer hover:text-shogun-accent transition-colors leading-tight"
                  onClick={() => handleSort('name')}
                >
                  {viewLevel === "campaigns" ? "Camp." : viewLevel === "adsets" ? "Conj." : "Anúnc."} {sortColumn === 'name' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </th>
                {viewLevel === "adsets" && (
                  <th className="px-2 py-1 text-left font-medium text-[10px] leading-tight">
                    Camp.
                  </th>
                )}
                {viewLevel === "ads" && (
                  <th className="px-2 py-1 text-left font-medium text-[10px] leading-tight">
                    Conj.
                  </th>
                )}
                
                {/* Colunas reorganizáveis */}
                <SortableContext
                  items={getVisibleColumns().filter(col => col !== 'name')}
                  strategy={horizontalListSortingStrategy}
                >
                  {renderColumnHeaders()}
                </SortableContext>
              </tr>
            </thead>
          <tbody>
            {viewLevel === "campaigns" && sortData(campaigns, (c) => {
              if (sortColumn === 'name') return c.name
              if (sortColumn === 'spend') return c.spend
              if (sortColumn === 'revenue') return c.revenue
              if (sortColumn === 'reach') return c.reach
              if (sortColumn === 'roas') return c.roas
              if (sortColumn === 'conversions') return c.conversions
              if (sortColumn === 'cpa') return c.cpa
              if (sortColumn === 'menuConversionRate') return c.menuConversionRate
              if (sortColumn === 'landingPageViews') return c.landingPageViews
              return 0
            }).map(renderCampaignRow)}
            {viewLevel === "adsets" && sortData(filteredAdsets, (a) => {
              if (sortColumn === 'name') return a.name
              if (sortColumn === 'spend') return a.spend
              if (sortColumn === 'revenue') return a.revenue
              if (sortColumn === 'roas') return a.roas
              if (sortColumn === 'conversions') return a.conversions
              if (sortColumn === 'cpa') return a.cpa
              if (sortColumn === 'menuConversionRate') return a.menuConversionRate
              if (sortColumn === 'landingPageViews') return a.landingPageViews
              if (sortColumn === 'reach') return a.reach
              return 0
            }).map(renderAdSetRow)}
            {viewLevel === "ads" && sortData(filteredAds, (a) => {
              if (sortColumn === 'name') return a.name
              if (sortColumn === 'spend') return a.spend
              if (sortColumn === 'revenue') return a.revenue
              if (sortColumn === 'roas') return a.roas
              if (sortColumn === 'conversions') return a.conversions
              if (sortColumn === 'cpa') return a.cpa
              if (sortColumn === 'menuConversionRate') return a.menuConversionRate
              if (sortColumn === 'landingPageViews') return a.landingPageViews
              if (sortColumn === 'reach') return a.reach
              return 0
            }).map(renderAdRow)}
            {renderTotalRow()}
          </tbody>
        </table>
      </div>
      </DndContext>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {viewLevel === "campaigns" && (
          <>
            {sortData(campaigns, (c) => {
              if (sortColumn === 'name') return c.name
              if (sortColumn === 'spend') return c.spend
              if (sortColumn === 'roas') return c.roas
              return 0
            }).map(campaign => (
              <MobileCard
                key={campaign.id}
                type="campaign"
                item={campaign}
                isSelected={selectedCampaignIds.includes(campaign.id)}
                onSelect={() => toggleCampaignSelection(campaign.id)}
              />
            ))}
            <MobileTotalsCard
              label={selectedCampaignIds.length > 0 
                ? `${selectedCampaignIds.length} campanhas selecionadas`
                : `${campaigns.length} campanhas`}
              totals={calculateTotals(
                selectedCampaignIds.length > 0 
                  ? campaigns.filter(c => selectedCampaignIds.includes(c.id))
                  : campaigns
              )}
            />
          </>
        )}

        {viewLevel === "adsets" && (
          <>
            {sortData(filteredAdsets, (a) => {
              if (sortColumn === 'name') return a.name
              if (sortColumn === 'spend') return a.spend
              if (sortColumn === 'roas') return a.roas
              return 0
            }).map(adset => {
              const campaign = campaigns.find(c => c.id === adset.campaignId)
              return (
                <MobileCard
                  key={adset.id}
                  type="adset"
                  item={adset}
                  isSelected={selectedAdSetIds.includes(adset.id)}
                  onSelect={() => toggleAdSetSelection(adset.id)}
                  parentName={campaign?.name}
                  effectiveStatus={getEffectiveStatus(adset, 'adset')}
                />
              )
            })}
            <MobileTotalsCard
              label={selectedAdSetIds.length > 0 
                ? `${selectedAdSetIds.length} conjuntos selecionados`
                : `${filteredAdsets.length} conjuntos`}
              totals={calculateTotals(
                selectedAdSetIds.length > 0 
                  ? filteredAdsets.filter(a => selectedAdSetIds.includes(a.id))
                  : filteredAdsets
              )}
            />
          </>
        )}

        {viewLevel === "ads" && (
          <>
            {sortData(filteredAds, (a) => {
              if (sortColumn === 'name') return a.name
              if (sortColumn === 'spend') return a.spend
              if (sortColumn === 'roas') return a.roas
              return 0
            }).map(ad => {
              const adset = adsets.find(a => a.id === ad.adsetId)
              return (
                <MobileCard
                  key={ad.id}
                  type="ad"
                  item={ad}
                  isSelected={selectedAdIds.includes(ad.id)}
                  onSelect={() => toggleAdSelection(ad.id)}
                  onPreview={(e) => handleAdPreview(ad, e)}
                  parentName={adset?.name}
                  effectiveStatus={getEffectiveStatus(ad, 'ad')}
                />
              )
            })}
            <MobileTotalsCard
              label={selectedAdIds.length > 0 
                ? `${selectedAdIds.length} anúncios selecionados`
                : `${filteredAds.length} anúncios`}
              totals={calculateTotals(
                selectedAdIds.length > 0 
                  ? filteredAds.filter(a => selectedAdIds.includes(a.id))
                  : filteredAds
              )}
            />
          </>
        )}
      </div>

      {/* Modal de preview do anúncio */}
      <AdPreviewModal
        ad={previewAd}
        isOpen={isModalOpen}
        onClose={closeModal}
        clientId={selectedClientId}
      />
    </div>
  )
}
