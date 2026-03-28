"use client"

import { useMemo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, Target, BarChart2, RotateCcw, ArrowRight, ShoppingCart, Receipt } from "lucide-react"
import { ShogunCard } from "@/components/ui/ShogunCard"
import { DatePicker } from "@/components/ui/DatePicker"
import { useMetricas } from "@/lib/hooks/useMetricas"
import { useDateRangeContext } from "@/lib/hooks/useDateRangeContext"
import { useClientContext } from "@/lib/hooks/useClientContext"
import type { MetricasCampaign, MetricasGender, MetricasPeriod } from "@/lib/hooks/useMetricas"

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtBRL(n: number) {
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(1).replace(".", ",")}k`
  return `R$ ${n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`
}

// Full integer BRL — no abbreviation, no cents
function fmtBRLFull(n: number) {
  return `R$ ${Math.round(n).toLocaleString("pt-BR")}`
}

// BRL with 2 decimal places (for CPC, CPM, Custo por compra)
function fmtBRLCents(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toFixed(0)
}

function fmtPct(n: number) {
  return `${n.toFixed(2)}%`
}

function fmtDelta(d: number | null) {
  if (d === null) return null
  const sign = d >= 0 ? "+" : ""
  return `${sign}${d.toFixed(1)}% vs anterior`
}

function calcDelta(curr: number, prev: number): number | null {
  if (prev === 0) return null
  return ((curr - prev) / prev) * 100
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string
  change: number | null
  note?: string
  /** true = higher is better; false = lower is better */
  positiveGood?: boolean
  icon?: React.ReactNode
}

function KpiCard({ label, value, change, note, positiveGood = true, icon }: KpiCardProps) {
  const delta = fmtDelta(change)
  const isGood = change !== null && (positiveGood ? change >= 0 : change <= 0)

  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-[var(--font-display)] uppercase tracking-wider text-shogun-text-secondary">
          {label}
        </span>
        {icon && <span className="text-shogun-text-muted">{icon}</span>}
      </div>
      <span className="font-[var(--font-data)] text-3xl font-bold text-shogun-text-primary leading-none">
        {value}
      </span>
      {delta && (
        <span
          className={`inline-flex self-start text-xs font-[var(--font-display)] px-2 py-0.5 rounded-full ${
            isGood
              ? "bg-shogun-accent/15 text-shogun-accent"
              : "bg-shogun-danger/15 text-shogun-danger"
          }`}
        >
          {delta}
        </span>
      )}
      {note && (
        <span className="text-xs text-shogun-text-muted font-[var(--font-display)]">{note}</span>
      )}
    </div>
  )
}

// ─── Metric Card (detailed grid) ─────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string
  change: number | null
  positiveGood?: boolean
}

function MetricCard({ label, value, change, positiveGood = true }: MetricCardProps) {
  const delta = fmtDelta(change)
  const isGood = change !== null && (positiveGood ? change >= 0 : change <= 0)

  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-4 flex flex-col gap-1.5">
      <span className="text-xs font-[var(--font-display)] uppercase tracking-wider text-shogun-text-secondary leading-tight">
        {label}
      </span>
      <span className="font-[var(--font-data)] text-2xl font-bold text-shogun-text-primary leading-none">
        {value}
      </span>
      {delta && (
        <span
          className={`inline-flex self-start text-xs font-[var(--font-display)] px-1.5 py-0.5 rounded-full ${
            isGood
              ? "bg-shogun-accent/15 text-shogun-accent"
              : "bg-shogun-danger/15 text-shogun-danger"
          }`}
        >
          {delta}
        </span>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonGrid({ count, height = "h-32" }: { count: number; height?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-shogun-bg-elevated border border-shogun-border rounded-xl ${height}`}
        />
      ))}
    </>
  )
}

// ─── Performance Funnel ───────────────────────────────────────────────────────

function PerformanceFunnel({ cur }: { cur: MetricasPeriod }) {
  const steps = [
    { label: "Alcance", value: cur.reach },
    { label: "Cliques", value: cur.linkClicks },
    { label: "Vis. Pág. Destino", value: cur.lpViews },
    { label: "Compras", value: cur.purchases },
  ]

  return (
    <div className="flex items-stretch w-full mt-2">
      {steps.map((step, i) => {
        const next = steps[i + 1]
        const rate = next && step.value > 0 ? (next.value / step.value) * 100 : null

        return (
          <div key={step.label} className="flex items-center flex-1 min-w-0">
            {/* Step box */}
            <div className="flex-1 flex flex-col items-center gap-1 bg-shogun-bg-base border border-shogun-border rounded-xl p-3">
              <span className="text-[10px] font-[var(--font-display)] uppercase tracking-wider text-shogun-text-muted text-center leading-tight">
                {step.label}
              </span>
              <span className="font-[var(--font-data)] text-xl font-bold text-shogun-text-primary">
                {fmtNum(step.value)}
              </span>
            </div>

            {/* Arrow + conversion rate */}
            {next && (
              <div className="flex flex-col items-center px-1.5 shrink-0">
                <span className="text-[10px] font-[var(--font-display)] text-shogun-accent font-semibold mb-0.5 whitespace-nowrap">
                  {rate !== null ? `${rate.toFixed(1)}%` : "—"}
                </span>
                <ArrowRight size={14} className="text-shogun-text-muted" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Gender donut (Público comprador) ─────────────────────────────────────────

const GENDER_LABELS: Record<string, string> = {
  male: "Homens",
  female: "Mulheres",
}
const GENDER_COLORS: Record<string, string> = {
  male: "#3b82f6",
  female: "#ec4899",
}

function GenderDonut({ genderStats }: { genderStats: MetricasGender[] }) {
  const total = genderStats.reduce((s, g) => s + g.purchases, 0)

  const data = genderStats.map((g) => ({
    name: GENDER_LABELS[g.gender] ?? g.gender,
    value: g.purchases,
    gender: g.gender,
  }))

  if (data.length === 0) {
    return (
      <p className="text-shogun-text-muted text-sm font-[var(--font-display)] text-center mt-8">
        Sem dados de público disponíveis
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* H / M summary */}
      <div className="flex gap-8">
        {genderStats.map((g) => (
          <div key={g.gender} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-[var(--font-display)] uppercase tracking-wider text-shogun-text-muted">
              {g.gender === "male" ? "Homens" : "Mulheres"}
            </span>
            <span
              className="font-[var(--font-data)] text-2xl font-bold"
              style={{ color: GENDER_COLORS[g.gender] ?? "#6b7280" }}
            >
              {fmtNum(g.purchases)}
            </span>
            <span className="text-xs text-shogun-text-muted font-[var(--font-display)]">
              {total > 0 ? ((g.purchases / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>

      {/* Donut chart */}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.gender} fill={GENDER_COLORS[entry.gender] ?? "#6b7280"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-shogun-bg-base)",
              border: "1px solid var(--color-shogun-border)",
              borderRadius: "8px",
              fontFamily: "var(--font-display)",
              color: "var(--color-shogun-text-primary)",
            }}
            formatter={(value: number, name: string) => [
              `${fmtNum(value)} compras (${total > 0 ? ((value / total) * 100).toFixed(0) : 0}%)`,
              name,
            ]}
          />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-shogun-text-secondary font-[var(--font-display)]">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MetricasPage() {
  const { selectedClientId } = useClientContext()
  const { dateRange, setDateRange, compareRange, setCompareRange } = useDateRangeContext()
  const { data, loading, error } = useMetricas()

  // Effective comparison range: custom if set, otherwise auto-computed
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">
          Métricas
        </h1>

        {/* Date selectors */}
        <div className="flex items-end gap-3">
          {/* Main period */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-[var(--font-display)] uppercase tracking-wider text-shogun-text-muted px-1">
              Período
            </span>
            <DatePicker
              value={dateRange ?? undefined}
              onChange={setDateRange}
            />
          </div>

          {/* Divider */}
          <div className="flex flex-col items-center pb-2.5">
            <span className="text-xs font-[var(--font-display)] text-shogun-text-muted leading-none">vs</span>
          </div>

          {/* Comparison period */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-[10px] font-[var(--font-display)] uppercase tracking-wider text-shogun-text-muted">
                Comparar com{!compareRange && <span className="text-shogun-accent ml-1">• auto</span>}
              </span>
              {compareRange && (
                <button
                  onClick={() => setCompareRange(null)}
                  title="Voltar ao período anterior automático"
                  className="text-shogun-text-muted hover:text-shogun-accent transition-colors"
                >
                  <RotateCcw size={10} />
                </button>
              )}
            </div>
            <DatePicker
              value={effectiveCompareRange}
              onChange={setCompareRange}
            />
          </div>
        </div>
      </div>

      {/* No client selected */}
      {!selectedClientId && (
        <div className="text-center py-16">
          <Target size={40} className="mx-auto text-shogun-text-muted mb-3" />
          <p className="text-shogun-text-secondary font-[var(--font-display)]">
            Selecione um cliente para visualizar as métricas
          </p>
        </div>
      )}

      {selectedClientId && loading && (
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
              Resumo executivo
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <SkeletonGrid count={5} height="h-36" />
            </div>
          </section>
          <section>
            <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
              Métricas detalhadas
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SkeletonGrid count={12} height="h-28" />
            </div>
          </section>
        </div>
      )}

      {selectedClientId && error && (
        <div className="text-center py-16">
          <p className="text-shogun-danger font-[var(--font-display)] text-sm">{error}</p>
          {error.toLowerCase().includes("meta") && (
            <p className="text-shogun-text-muted font-[var(--font-display)] text-xs mt-2">
              Configure a conta Meta nas configurações do cliente
            </p>
          )}
        </div>
      )}

      {selectedClientId && !loading && !error && !data && (
        <div className="text-center py-16">
          <p className="text-shogun-text-secondary font-[var(--font-display)]">
            Configure a conta Meta nas configurações
          </p>
        </div>
      )}

      {selectedClientId && !loading && !error && data && cur && prev && (
        <>
          {/* ── Resumo executivo ── */}
          <section>
            <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
              Resumo executivo
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard
                label="Valor investido"
                value={fmtBRLFull(cur.spend)}
                change={calcDelta(cur.spend, prev.spend)}
                note="Total gasto no período"
                positiveGood={false}
                icon={<TrendingUp size={16} />}
              />
              <KpiCard
                label="Valor da conversão"
                value={fmtBRLFull(cur.purchaseValue)}
                change={calcDelta(cur.purchaseValue, prev.purchaseValue)}
                note="Receita atribuída (Meta)"
                positiveGood={true}
                icon={<BarChart2 size={16} />}
              />
              <KpiCard
                label="ROAS"
                value={cur.purchaseRoas.toFixed(2)}
                change={calcDelta(cur.purchaseRoas, prev.purchaseRoas)}
                note="Retorno sobre investimento"
                positiveGood={true}
                icon={<Target size={16} />}
              />
              <KpiCard
                label="Compras"
                value={fmtNum(cur.purchases)}
                change={calcDelta(cur.purchases, prev.purchases)}
                note="Compras atribuídas"
                positiveGood={true}
                icon={<ShoppingCart size={16} />}
              />
              <KpiCard
                label="Ticket médio"
                value={fmtBRLFull(cur.purchases > 0 ? cur.purchaseValue / cur.purchases : 0)}
                change={calcDelta(
                  cur.purchases > 0 ? cur.purchaseValue / cur.purchases : 0,
                  prev.purchases > 0 ? prev.purchaseValue / prev.purchases : 0
                )}
                note="Valor médio por compra"
                positiveGood={true}
                icon={<Receipt size={16} />}
              />
            </div>
          </section>

          {/* ── Métricas detalhadas ── */}
          <section>
            <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
              Métricas detalhadas
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Alcance total"
                value={fmtNum(cur.reach)}
                change={calcDelta(cur.reach, prev.reach)}
              />
              <MetricCard
                label="Impressões totais"
                value={fmtNum(cur.impressions)}
                change={calcDelta(cur.impressions, prev.impressions)}
              />
              <MetricCard
                label="Total de cliques no link"
                value={fmtNum(cur.linkClicks)}
                change={calcDelta(cur.linkClicks, prev.linkClicks)}
              />
              <MetricCard
                label="CTR (taxa de cliques)"
                value={fmtPct(cur.ctr)}
                change={calcDelta(cur.ctr, prev.ctr)}
              />
              <MetricCard
                label="Visualizações da landing page"
                value={fmtNum(cur.lpViews)}
                change={calcDelta(cur.lpViews, prev.lpViews)}
              />
              <MetricCard
                label="Adições ao carrinho"
                value={fmtNum(cur.addToCart)}
                change={calcDelta(cur.addToCart, prev.addToCart)}
              />
              <MetricCard
                label="Finalizações de compra iniciadas"
                value={fmtNum(cur.initiateCheckout)}
                change={calcDelta(cur.initiateCheckout, prev.initiateCheckout)}
              />
              <MetricCard
                label="Compras"
                value={fmtNum(cur.purchases)}
                change={calcDelta(cur.purchases, prev.purchases)}
              />
              <MetricCard
                label="CPM médio"
                value={fmtBRLCents(cur.cpp)}
                change={calcDelta(cur.cpp, prev.cpp)}
                positiveGood={false}
              />
              <MetricCard
                label="CPC médio"
                value={fmtBRLCents(cur.cpc)}
                change={calcDelta(cur.cpc, prev.cpc)}
                positiveGood={false}
              />
              <MetricCard
                label="Custo por compra"
                value={fmtBRLCents(cur.costPerPurchase)}
                change={calcDelta(cur.costPerPurchase, prev.costPerPurchase)}
                positiveGood={false}
              />
              <MetricCard
                label="Frequência"
                value={cur.frequency.toFixed(2)}
                change={calcDelta(cur.frequency, prev.frequency)}
                positiveGood={false}
              />
            </div>
          </section>

          {/* ── Charts row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Funil de performance */}
            <ShogunCard>
              <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
                Funil de performance
              </h2>
              <PerformanceFunnel cur={cur} />
            </ShogunCard>

            {/* Público comprador */}
            <ShogunCard>
              <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
                Público comprador
              </h2>
              <GenderDonut genderStats={data.genderStats} />
            </ShogunCard>
          </div>
        </>
      )}
    </div>
  )
}
