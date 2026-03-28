"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts"
import { TrendingUp, Target, BarChart2, Activity } from "lucide-react"
import { ShogunCard } from "@/components/ui/ShogunCard"
import { DatePicker } from "@/components/ui/DatePicker"
import { useMetricas } from "@/lib/hooks/useMetricas"
import { useDateRangeContext } from "@/lib/hooks/useDateRangeContext"
import { useClientContext } from "@/lib/hooks/useClientContext"
import type { MetricasPeriod, MetricasCampaign } from "@/lib/hooks/useMetricas"

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtBRL(n: number) {
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(1).replace(".", ",")}k`
  return `R$ ${n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`
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

// ─── Chart tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-shogun-bg-base border border-shogun-border rounded-lg px-3 py-2 text-sm font-[var(--font-display)]">
        <p className="text-shogun-text-secondary">{label}</p>
        <p className="text-shogun-accent font-[var(--font-data)] font-bold">{fmtNum(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

// ─── Campaign health donut ────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#95D600",
  PAUSED: "#3b82f6",
  ARCHIVED: "#6b7280",
  DELETED: "#4b5563",
}

function CampaignDonut({ campaigns }: { campaigns: MetricasCampaign[] }) {
  const counts: Record<string, number> = {}
  for (const c of campaigns) {
    counts[c.status] = (counts[c.status] ?? 0) + 1
  }
  const data = Object.entries(counts).map(([status, count]) => ({
    name: status.charAt(0) + status.slice(1).toLowerCase(),
    value: count,
    status,
  }))

  if (data.length === 0) {
    return (
      <p className="text-shogun-text-muted text-sm font-[var(--font-display)] text-center mt-8">
        Nenhuma campanha encontrada
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          dataKey="value"
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#6b7280"} />
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
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MetricasPage() {
  const { selectedClientId } = useClientContext()
  const { dateRange, setDateRange } = useDateRangeContext()
  const { data, loading, error } = useMetricas()

  const cur = data?.current
  const prev = data?.previous

  // Funil data
  const funnelData = cur
    ? [
        { name: "Impressões", value: cur.impressions },
        { name: "Cliques", value: cur.linkClicks },
        { name: "LP views", value: cur.lpViews },
        { name: "Compras", value: cur.purchases },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">
          Métricas
        </h1>
        <DatePicker
          value={dateRange ?? undefined}
          onChange={setDateRange}
        />
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SkeletonGrid count={4} height="h-36" />
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Saldo no Meta"
                value={fmtBRL(data.balance)}
                change={null}
                note="Saldo disponível na conta"
                icon={<Activity size={16} />}
              />
              <KpiCard
                label="Valor investido (período)"
                value={fmtBRL(cur.spend)}
                change={calcDelta(cur.spend, prev.spend)}
                note="Total gasto no período"
                positiveGood={false}
                icon={<TrendingUp size={16} />}
              />
              <KpiCard
                label="Valor da conversão da compra"
                value={fmtBRL(cur.purchaseValue)}
                change={calcDelta(cur.purchaseValue, prev.purchaseValue)}
                note="Receita atribuída (Meta)"
                positiveGood={true}
                icon={<BarChart2 size={16} />}
              />
              <KpiCard
                label="ROAS de compras no site"
                value={cur.purchaseRoas.toFixed(2)}
                change={calcDelta(cur.purchaseRoas, prev.purchaseRoas)}
                note="Retorno sobre investimento"
                positiveGood={true}
                icon={<Target size={16} />}
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
                value={fmtBRL(cur.cpp)}
                change={calcDelta(cur.cpp, prev.cpp)}
                positiveGood={false}
              />
              <MetricCard
                label="CPC médio"
                value={fmtBRL(cur.cpc)}
                change={calcDelta(cur.cpc, prev.cpc)}
                positiveGood={false}
              />
              <MetricCard
                label="Custo por compra"
                value={fmtBRL(cur.costPerPurchase)}
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
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={funnelData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fill: "var(--color-shogun-text-secondary)", fontSize: 11, fontFamily: "var(--font-display)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={fmtNum}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fill: "var(--color-shogun-text-secondary)", fontSize: 11, fontFamily: "var(--font-display)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(149,214,0,0.05)" }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnelData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={index === 0 ? "rgba(149,214,0,0.2)" : "#95D600"}
                        opacity={1 - index * 0.08}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ShogunCard>

            {/* Saúde das campanhas */}
            <ShogunCard>
              <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
                Saúde das campanhas
              </h2>
              <div className="flex items-center justify-center">
                <CampaignDonut campaigns={data.campaigns} />
              </div>
              <p className="text-xs text-shogun-text-muted text-center font-[var(--font-display)] mt-1">
                {data.campaigns.length} campanha{data.campaigns.length !== 1 ? "s" : ""} no total
              </p>
            </ShogunCard>
          </div>
        </>
      )}
    </div>
  )
}
