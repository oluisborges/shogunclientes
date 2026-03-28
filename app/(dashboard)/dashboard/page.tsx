"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import {
  TrendingUp, Target, BarChart2, RotateCcw,
  ShoppingCart, Receipt, GitCompare,
} from "lucide-react"
import { ShogunCard } from "@/components/ui/ShogunCard"
import { DatePicker } from "@/components/ui/DatePicker"
import { useMetricas } from "@/lib/hooks/useMetricas"
import { useDateRangeContext } from "@/lib/hooks/useDateRangeContext"
import { useClientContext } from "@/lib/hooks/useClientContext"
import { fmtBRLFull, fmtBRLCents, fmtNum, fmtPct, calcDelta } from "@/lib/format"
import type { MetricasPeriod } from "@/lib/hooks/useMetricas"
import { ConfigError } from "@/components/ui/ConfigError"

// Chart components loaded only when data is ready (keeps recharts out of initial bundle)
const ChartSkeleton = () => <div className="animate-pulse bg-shogun-bg-elevated border border-shogun-border rounded-xl h-80" />
const DailyChart      = dynamic(() => import("@/components/dashboard/DashboardCharts").then(m => ({ default: m.DailyChart })),      { ssr: false, loading: ChartSkeleton })
const AgeBarChart     = dynamic(() => import("@/components/dashboard/DashboardCharts").then(m => ({ default: m.AgeBarChart })),     { ssr: false, loading: ChartSkeleton })
const GenderDonut     = dynamic(() => import("@/components/dashboard/DashboardCharts").then(m => ({ default: m.GenderDonut })),     { ssr: false, loading: ChartSkeleton })
const PerformanceFunnel = dynamic(() => import("@/components/dashboard/DashboardCharts").then(m => ({ default: m.PerformanceFunnel })), { ssr: false, loading: ChartSkeleton })

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roasStyle(roas: number): { badge: { text: string; className: string } | null } {
  if (roas >= 15.01) return { badge: { text: "EXCELENTE!", className: "bg-purple-500/15 text-purple-400" } }
  if (roas >= 8)     return { badge: { text: "ÓTIMO",      className: "bg-shogun-accent/15 text-shogun-accent" } }
  return { badge: null }
}

function CompareRow({ prevValue, change, positiveGood = true }: { prevValue: string; change: number | null; positiveGood?: boolean }) {
  if (change === null) return null
  const isGood = positiveGood ? change >= 0 : change <= 0
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-[var(--font-display)] text-white/40">anterior: {prevValue}</span>
      <span className={`inline-flex items-center gap-0.5 text-xs font-[var(--font-display)] font-semibold px-1.5 py-0.5 rounded-full ${isGood ? "bg-shogun-accent/15 text-shogun-accent" : "bg-red-400/15 text-red-400"}`}>
        {isGood ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
      </span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-0.5 h-5 rounded-full bg-shogun-accent" />
      <h2 className="text-base font-[var(--font-display)] font-semibold text-shogun-text-primary">{children}</h2>
    </div>
  )
}

function SkeletonGrid({ count, height = "h-32" }: { count: number; height?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse bg-shogun-bg-elevated border border-shogun-border rounded-xl ${height}`} />
      ))}
    </>
  )
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function SimpleKpiCard({ label, description, value, icon, badge, showCompare = false, prevValue, change, positiveGood = true }: {
  label: string; description: string; value: string; icon: React.ReactNode
  badge?: { text: string; className: string } | null
  showCompare?: boolean; prevValue?: string; change?: number | null; positiveGood?: boolean
}) {
  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-[var(--font-display)] font-medium text-shogun-text-secondary">{label}</span>
        <span className="text-white/30">{icon}</span>
      </div>
      <span className="font-[var(--font-data)] text-4xl font-bold leading-none text-shogun-text-primary">{value}</span>
      {showCompare && prevValue && change !== undefined && change !== null && (
        <CompareRow prevValue={prevValue} change={change} positiveGood={positiveGood} />
      )}
      <p className="text-xs font-[var(--font-display)] text-white/35 leading-snug">{description}</p>
      {badge && (
        <span className={`self-start text-xs font-[var(--font-display)] px-2 py-0.5 rounded-full font-semibold ${badge.className}`}>{badge.text}</span>
      )}
    </div>
  )
}

function MetricCard({ label, value, prevValue, change, positiveGood = true, showCompare = false }: {
  label: string; value: string; prevValue: string; change: number | null; positiveGood?: boolean; showCompare?: boolean
}) {
  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-4 flex flex-col gap-1.5">
      <span className="text-xs font-[var(--font-display)] uppercase tracking-wider text-white/40 leading-tight">{label}</span>
      <span className="font-[var(--font-data)] text-2xl font-bold text-shogun-text-primary leading-none">{value}</span>
      {showCompare && <CompareRow prevValue={prevValue} change={change} positiveGood={positiveGood} />}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = "simples" | "avancado"

export default function MetricasPage() {
  const { selectedClientId } = useClientContext()
  const { dateRange, setDateRange, compareRange, setCompareRange } = useDateRangeContext()
  const { data, loading, error } = useMetricas()
  const [tab, setTab] = useState<Tab>("simples")
  const [showCompare, setShowCompare] = useState(false)

  const effectiveCompareRange = useMemo(() => {
    if (compareRange) return compareRange
    if (!dateRange) return undefined
    const periodMs = dateRange.end.getTime() - dateRange.start.getTime()
    const periodDays = Math.round(periodMs / (1000 * 60 * 60 * 24)) + 1
    const prevEnd = new Date(dateRange.start)
    prevEnd.setDate(prevEnd.getDate() - 1)
    const prevStart = new Date(prevEnd)
    prevStart.setDate(prevStart.getDate() - (periodDays - 1))
    return { start: prevStart, end: prevEnd }
  }, [dateRange, compareRange])

  const cur = data?.current
  const prev = data?.previous
  const curTicket  = cur  && cur.purchases  > 0 ? cur.purchaseValue  / cur.purchases  : 0
  const prevTicket = prev && prev.purchases > 0 ? prev.purchaseValue / prev.purchases : 0

  const kpiCards = cur && prev ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <SimpleKpiCard label="Pedidos"        description="Número de pedidos que vieram através dos anúncios"  value={fmtNum(cur.purchases)}      icon={<ShoppingCart size={18} />} showCompare={showCompare} prevValue={fmtNum(prev.purchases)}      change={calcDelta(cur.purchases, prev.purchases)} />
      <SimpleKpiCard label="Receita gerada" description="Receita gerada através dos anúncios"               value={fmtBRLFull(cur.purchaseValue)} icon={<Receipt size={18} />}      showCompare={showCompare} prevValue={fmtBRLFull(prev.purchaseValue)} change={calcDelta(cur.purchaseValue, prev.purchaseValue)} />
      <SimpleKpiCard label="Valor Investido" description="Valor que você investiu nos anúncios"             value={fmtBRLFull(cur.spend)}        icon={<TrendingUp size={18} />}   showCompare={showCompare} prevValue={fmtBRLFull(prev.spend)}        change={calcDelta(cur.spend, prev.spend)} positiveGood={false} />
      <SimpleKpiCard label="ROAS"            description={`Para cada R$ 1,00 investido, retornou R$ ${cur.purchaseRoas.toFixed(2).replace(".", ",")}`} value={cur.purchaseRoas.toFixed(2)} icon={<Target size={18} />} badge={roasStyle(cur.purchaseRoas).badge} showCompare={showCompare} prevValue={prev.purchaseRoas.toFixed(2)} change={calcDelta(cur.purchaseRoas, prev.purchaseRoas)} />
      <SimpleKpiCard label="Ticket Médio"    description="Valor médio por pedido gerado pelos anúncios"     value={fmtBRLFull(curTicket)}        icon={<BarChart2 size={18} />}    showCompare={showCompare} prevValue={fmtBRLFull(prevTicket)}        change={calcDelta(curTicket, prevTicket)} />
    </div>
  ) : null

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">Dashboard</h1>
          <div className="flex gap-1 bg-shogun-bg-elevated border border-shogun-border rounded-lg p-1">
            {(["simples", "avancado"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-[var(--font-display)] transition-all ${tab === t ? "bg-shogun-accent text-black font-semibold" : "text-white/50 hover:text-shogun-text-primary"}`}>
                {t === "simples" ? "Simples" : "Avançado"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-[var(--font-display)] uppercase tracking-wider text-white/40 px-1">Período</span>
            <DatePicker value={dateRange ?? undefined} onChange={setDateRange} />
          </div>
          <button
            onClick={() => setShowCompare((v) => !v)}
            className={`flex items-center gap-1.5 h-[38px] px-4 rounded-lg border font-[var(--font-display)] text-sm font-medium transition-all ${showCompare ? "bg-shogun-accent text-black border-shogun-accent" : "bg-shogun-accent/10 border-shogun-accent text-shogun-accent hover:bg-shogun-accent/20"}`}
          >
            <GitCompare size={14} /> Comparar
          </button>
          {showCompare && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 px-1">
                <span className="text-[10px] font-[var(--font-display)] uppercase tracking-wider text-white/40">
                  Comparar com{!compareRange && <span className="text-shogun-accent ml-1">• auto</span>}
                </span>
                {compareRange && (
                  <button onClick={() => setCompareRange(null)} className="text-white/40 hover:text-shogun-accent transition-colors">
                    <RotateCcw size={10} />
                  </button>
                )}
              </div>
              <DatePicker value={effectiveCompareRange} onChange={setCompareRange} />
            </div>
          )}
        </div>
      </div>

      {!selectedClientId && (
        <div className="text-center py-16">
          <Target size={40} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/50 font-[var(--font-display)]">Selecione um cliente para visualizar as métricas</p>
        </div>
      )}

      {selectedClientId && loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4"><SkeletonGrid count={5} height="h-44" /></div>
          <div className="animate-pulse bg-shogun-bg-elevated border border-shogun-border rounded-xl h-80" />
        </div>
      )}

      {selectedClientId && error && (
        <ConfigError message={error} />
      )}

      {selectedClientId && !loading && !error && !data && (
        <div className="text-center py-16">
          <p className="text-white/50 font-[var(--font-display)]">Nenhum dado disponível para o período selecionado</p>
        </div>
      )}

      {selectedClientId && !loading && !error && data && cur && prev && (
        <>
          {tab === "simples" && (
            <div className="space-y-6">
              {kpiCards}
              <ShogunCard>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-0.5 h-5 rounded-full bg-shogun-accent" />
                  <h2 className="text-base font-[var(--font-display)] font-semibold text-shogun-text-primary">Evolução diária</h2>
                </div>
                <p className="text-xs text-white/40 font-[var(--font-display)] mb-5 pl-2.5">Pedidos, receita e investimento por dia no período selecionado</p>
                <DailyChart dailyData={data.dailyData} />
              </ShogunCard>
            </div>
          )}

          {tab === "avancado" && (
            <div className="space-y-8">
              <section>
                <SectionTitle>Resumo executivo</SectionTitle>
                {kpiCards}
              </section>
              <section>
                <SectionTitle>Métricas detalhadas</SectionTitle>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard label="Alcance total"                                    value={fmtNum(cur.reach)}               prevValue={fmtNum(prev.reach)}               change={calcDelta(cur.reach, prev.reach)}                             showCompare={showCompare} />
                  <MetricCard label="Impressões totais"                                value={fmtNum(cur.impressions)}         prevValue={fmtNum(prev.impressions)}         change={calcDelta(cur.impressions, prev.impressions)}                 showCompare={showCompare} />
                  <MetricCard label="Total de cliques no link"                         value={fmtNum(cur.linkClicks)}          prevValue={fmtNum(prev.linkClicks)}          change={calcDelta(cur.linkClicks, prev.linkClicks)}                   showCompare={showCompare} />
                  <MetricCard label="CTR (taxa de cliques)"                            value={fmtPct(cur.ctr)}                 prevValue={fmtPct(prev.ctr)}                 change={calcDelta(cur.ctr, prev.ctr)}                                 showCompare={showCompare} />
                  <MetricCard label="Visualização de Cardápio"                         value={fmtNum(cur.lpViews)}             prevValue={fmtNum(prev.lpViews)}             change={calcDelta(cur.lpViews, prev.lpViews)}                         showCompare={showCompare} />
                  <MetricCard label="Adições ao carrinho"                              value={fmtNum(cur.addToCart)}           prevValue={fmtNum(prev.addToCart)}           change={calcDelta(cur.addToCart, prev.addToCart)}                     showCompare={showCompare} />
                  <MetricCard label="Finalizações de compra iniciadas"                 value={fmtNum(cur.initiateCheckout)}    prevValue={fmtNum(prev.initiateCheckout)}    change={calcDelta(cur.initiateCheckout, prev.initiateCheckout)}       showCompare={showCompare} />
                  <MetricCard label="Compras"                                          value={fmtNum(cur.purchases)}           prevValue={fmtNum(prev.purchases)}           change={calcDelta(cur.purchases, prev.purchases)}                     showCompare={showCompare} />
                  <MetricCard label="CPM médio"                                        value={fmtBRLCents(cur.cpp)}            prevValue={fmtBRLCents(prev.cpp)}            change={calcDelta(cur.cpp, prev.cpp)}            positiveGood={false} showCompare={showCompare} />
                  <MetricCard label="CPC médio"                                        value={fmtBRLCents(cur.cpc)}            prevValue={fmtBRLCents(prev.cpc)}            change={calcDelta(cur.cpc, prev.cpc)}            positiveGood={false} showCompare={showCompare} />
                  <MetricCard label="Custo por compra"                                 value={fmtBRLCents(cur.costPerPurchase)} prevValue={fmtBRLCents(prev.costPerPurchase)} change={calcDelta(cur.costPerPurchase, prev.costPerPurchase)} positiveGood={false} showCompare={showCompare} />
                  <MetricCard label="Frequência"                                       value={cur.frequency.toFixed(2)}        prevValue={prev.frequency.toFixed(2)}        change={calcDelta(cur.frequency, prev.frequency)}        positiveGood={false} showCompare={showCompare} />
                </div>
              </section>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ShogunCard>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-0.5 h-5 rounded-full bg-shogun-accent" />
                    <h2 className="text-base font-[var(--font-display)] font-semibold text-shogun-text-primary">Público comprador</h2>
                  </div>
                  <GenderDonut genderStats={data.genderStats} />
                </ShogunCard>
                <ShogunCard>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-0.5 h-5 rounded-full bg-shogun-accent" />
                    <h2 className="text-base font-[var(--font-display)] font-semibold text-shogun-text-primary">Faixa etária</h2>
                  </div>
                  <p className="text-xs text-white/40 font-[var(--font-display)] mb-4 pl-2.5">Compras e visualizações de cardápio por faixa de idade</p>
                  <AgeBarChart ageStats={data.ageStats} />
                </ShogunCard>
              </div>
              <ShogunCard>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-0.5 h-5 rounded-full bg-shogun-accent" />
                  <h2 className="text-base font-[var(--font-display)] font-semibold text-shogun-text-primary">Funil de performance</h2>
                </div>
                <PerformanceFunnel cur={cur as MetricasPeriod} />
              </ShogunCard>
            </div>
          )}
        </>
      )}
    </div>
  )
}
