"use client"

import { useState, useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  TrendingUp,
  Target,
  BarChart2,
  RotateCcw,
  ArrowRight,
  ShoppingCart,
  Receipt,
  Copy,
  Check,
} from "lucide-react"
import { ShogunCard } from "@/components/ui/ShogunCard"
import { DatePicker } from "@/components/ui/DatePicker"
import { useMetricas } from "@/lib/hooks/useMetricas"
import { useDateRangeContext } from "@/lib/hooks/useDateRangeContext"
import { useClientContext } from "@/lib/hooks/useClientContext"
import type { MetricasCampaign, MetricasGender, MetricasPeriod, MetricasDaily } from "@/lib/hooks/useMetricas"

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtBRLFull(n: number) {
  return `R$ ${Math.round(n).toLocaleString("pt-BR")}`
}

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

// ─── ROAS color ───────────────────────────────────────────────────────────────

function roasStyle(roas: number) {
  if (roas >= 3) return { text: "text-shogun-accent", badge: "bg-shogun-accent/15 text-shogun-accent", label: "Ótimo" }
  if (roas >= 1.5) return { text: "text-yellow-400", badge: "bg-yellow-400/15 text-yellow-400", label: "Regular" }
  return { text: "text-red-400", badge: "bg-red-400/15 text-red-400", label: "Atenção" }
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

// ─── Simple KPI Card (Simples tab) ────────────────────────────────────────────

function SimpleKpiCard({
  label,
  value,
  icon,
  valueClassName = "text-shogun-text-primary",
  badge,
  change,
  positiveGood = true,
}: {
  label: string
  value: string
  icon: React.ReactNode
  valueClassName?: string
  badge?: { text: string; className: string }
  change?: number | null
  positiveGood?: boolean
}) {
  const delta = change !== undefined && change !== null ? fmtDelta(change) : null
  const isGood = change !== undefined && change !== null && (positiveGood ? change >= 0 : change <= 0)

  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-2xl p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-[var(--font-display)] text-shogun-text-secondary">{label}</span>
        <span className="text-shogun-text-muted">{icon}</span>
      </div>
      <span className={`font-[var(--font-data)] text-4xl font-bold leading-none ${valueClassName}`}>
        {value}
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {badge && (
          <span className={`text-xs font-[var(--font-display)] px-2 py-0.5 rounded-full font-semibold ${badge.className}`}>
            {badge.text}
          </span>
        )}
        {delta && (
          <span
            className={`text-xs font-[var(--font-display)] px-2 py-0.5 rounded-full ${
              isGood
                ? "bg-shogun-accent/15 text-shogun-accent"
                : "bg-shogun-danger/15 text-shogun-danger"
            }`}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Daily line chart ─────────────────────────────────────────────────────────

function DailyChart({ dailyData }: { dailyData: MetricasDaily[] }) {
  if (!dailyData.length) {
    return (
      <p className="text-shogun-text-muted text-sm font-[var(--font-display)] text-center py-8">
        Sem dados diários disponíveis
      </p>
    )
  }

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-")
    return `${parts[2]}/${parts[1]}`
  }

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{ dataKey: string; value: number; color: string }>
    label?: string
  }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-shogun-bg-base border border-shogun-border rounded-lg px-3 py-2 text-sm font-[var(--font-display)] space-y-1">
        <p className="text-shogun-text-muted text-xs">{label ? formatDate(label) : ""}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-[var(--font-data)] font-semibold">
            {p.dataKey === "purchases"
              ? `${p.value} pedido${p.value !== 1 ? "s" : ""}`
              : fmtBRLCents(p.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-5 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 rounded-full bg-shogun-accent" />
          <span className="text-xs font-[var(--font-display)] text-shogun-text-secondary">Pedidos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 rounded-full bg-blue-500" />
          <span className="text-xs font-[var(--font-display)] text-shogun-text-secondary">Gasto (R$)</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={dailyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-shogun-border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: "var(--color-shogun-text-secondary)", fontSize: 11, fontFamily: "var(--font-display)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            tick={{ fill: "var(--color-shogun-text-secondary)", fontSize: 11, fontFamily: "var(--font-display)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtNum(v)}
            width={32}
            allowDecimals={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "var(--color-shogun-text-secondary)", fontSize: 11, fontFamily: "var(--font-display)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${fmtNum(v)}`}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="purchases"
            stroke="#95D600"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#95D600", strokeWidth: 0 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="spend"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Summary block ────────────────────────────────────────────────────────────

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

function SummaryBlock({
  cur,
  dateRange,
}: {
  cur: MetricasPeriod
  dateRange: { start: Date; end: Date }
}) {
  const [copied, setCopied] = useState(false)

  const { start, end } = dateRange
  const lastDayOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()
  const isFullMonth =
    start.getDate() === 1 &&
    end.getDate() === lastDayOfMonth &&
    start.getMonth() === end.getMonth()

  const fmt2 = (n: number) => n.toString().padStart(2, "0")
  const periodStr = isFullMonth
    ? `Em ${MONTHS_PT[start.getMonth()]}`
    : `No período de ${fmt2(start.getDate())}/${fmt2(start.getMonth() + 1)} a ${fmt2(end.getDate())}/${fmt2(end.getMonth() + 1)}`

  const pedidos = Math.round(cur.purchases)
  const receita = Math.round(cur.purchaseValue).toLocaleString("pt-BR")
  const invested = Math.round(cur.spend).toLocaleString("pt-BR")
  const roas = cur.purchaseRoas.toFixed(1).replace(".", ",")
  const roasDetail = cur.purchaseRoas.toFixed(2).replace(".", ",")

  const text =
    `${periodStr}, seus anúncios geraram ${pedidos} pedido${pedidos !== 1 ? "s" : ""} com receita atribuída de R$ ${receita}. ` +
    `Foram investidos R$ ${invested} e seu ROAS foi de ${roas} — ` +
    `para cada R$ 1 investido, R$ ${roasDetail} retornou em vendas.`

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <ShogunCard>
      <div className="flex items-start justify-between gap-4 mb-3">
        <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary">
          Resumo do período
        </h2>
        <button
          onClick={handleCopy}
          title="Copiar texto"
          className={`flex items-center gap-1.5 text-xs font-[var(--font-display)] px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
            copied
              ? "border-shogun-accent text-shogun-accent bg-shogun-accent/10"
              : "border-shogun-border text-shogun-text-muted hover:text-shogun-text-primary hover:border-shogun-text-muted"
          }`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <p className="text-shogun-text-primary font-[var(--font-display)] leading-relaxed text-base">
        {text}
      </p>
    </ShogunCard>
  )
}

// ─── Advanced tab components (reused from before) ────────────────────────────

function KpiCard({ label, value, change, note, positiveGood = true, icon }: {
  label: string; value: string; change: number | null
  note?: string; positiveGood?: boolean; icon?: React.ReactNode
}) {
  const delta = fmtDelta(change)
  const isGood = change !== null && (positiveGood ? change >= 0 : change <= 0)
  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-[var(--font-display)] uppercase tracking-wider text-shogun-text-secondary">{label}</span>
        {icon && <span className="text-shogun-text-muted">{icon}</span>}
      </div>
      <span className="font-[var(--font-data)] text-3xl font-bold text-shogun-text-primary leading-none">{value}</span>
      {delta && (
        <span className={`inline-flex self-start text-xs font-[var(--font-display)] px-2 py-0.5 rounded-full ${isGood ? "bg-shogun-accent/15 text-shogun-accent" : "bg-shogun-danger/15 text-shogun-danger"}`}>
          {delta}
        </span>
      )}
      {note && <span className="text-xs text-shogun-text-muted font-[var(--font-display)]">{note}</span>}
    </div>
  )
}

function MetricCard({ label, value, change, positiveGood = true }: {
  label: string; value: string; change: number | null; positiveGood?: boolean
}) {
  const delta = fmtDelta(change)
  const isGood = change !== null && (positiveGood ? change >= 0 : change <= 0)
  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-4 flex flex-col gap-1.5">
      <span className="text-xs font-[var(--font-display)] uppercase tracking-wider text-shogun-text-secondary leading-tight">{label}</span>
      <span className="font-[var(--font-data)] text-2xl font-bold text-shogun-text-primary leading-none">{value}</span>
      {delta && (
        <span className={`inline-flex self-start text-xs font-[var(--font-display)] px-1.5 py-0.5 rounded-full ${isGood ? "bg-shogun-accent/15 text-shogun-accent" : "bg-shogun-danger/15 text-shogun-danger"}`}>
          {delta}
        </span>
      )}
    </div>
  )
}

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
            <div className="flex-1 flex flex-col items-center gap-1 bg-shogun-bg-base border border-shogun-border rounded-xl p-3">
              <span className="text-[10px] font-[var(--font-display)] uppercase tracking-wider text-shogun-text-muted text-center leading-tight">{step.label}</span>
              <span className="font-[var(--font-data)] text-xl font-bold text-shogun-text-primary">{fmtNum(step.value)}</span>
            </div>
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

const GENDER_COLORS: Record<string, string> = { male: "#3b82f6", female: "#ec4899" }

function GenderDonut({ genderStats }: { genderStats: MetricasGender[] }) {
  const total = genderStats.reduce((s, g) => s + g.purchases, 0)
  const data = genderStats.map((g) => ({
    name: g.gender === "male" ? "Homens" : "Mulheres",
    value: g.purchases,
    gender: g.gender,
  }))

  if (data.length === 0) {
    return <p className="text-shogun-text-muted text-sm font-[var(--font-display)] text-center mt-8">Sem dados de público disponíveis</p>
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-8">
        {genderStats.map((g) => (
          <div key={g.gender} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-[var(--font-display)] uppercase tracking-wider text-shogun-text-muted">
              {g.gender === "male" ? "Homens" : "Mulheres"}
            </span>
            <span className="font-[var(--font-data)] text-2xl font-bold" style={{ color: GENDER_COLORS[g.gender] ?? "#6b7280" }}>
              {fmtNum(g.purchases)}
            </span>
            <span className="text-xs text-shogun-text-muted font-[var(--font-display)]">
              {total > 0 ? ((g.purchases / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
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
          <Legend formatter={(value) => <span className="text-xs text-shogun-text-secondary font-[var(--font-display)]">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
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
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">
            Métricas
          </h1>
          {/* Tab pills */}
          <div className="flex gap-1 bg-shogun-bg-elevated border border-shogun-border rounded-lg p-1">
            {(["simples", "avancado"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-[var(--font-display)] transition-all capitalize ${
                  tab === t
                    ? "bg-shogun-accent text-black font-semibold"
                    : "text-shogun-text-secondary hover:text-shogun-text-primary"
                }`}
              >
                {t === "simples" ? "Simples" : "Avançado"}
              </button>
            ))}
          </div>
        </div>

        {/* Date selectors */}
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-[var(--font-display)] uppercase tracking-wider text-shogun-text-muted px-1">
              Período
            </span>
            <DatePicker value={dateRange ?? undefined} onChange={setDateRange} />
          </div>
          <div className="flex flex-col items-center pb-2.5">
            <span className="text-xs font-[var(--font-display)] text-shogun-text-muted leading-none">vs</span>
          </div>
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
            <DatePicker value={effectiveCompareRange} onChange={setCompareRange} />
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

      {/* Loading skeleton */}
      {selectedClientId && loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonGrid count={4} height="h-40" />
          </div>
          <div className="animate-pulse bg-shogun-bg-elevated border border-shogun-border rounded-xl h-80" />
          <div className="animate-pulse bg-shogun-bg-elevated border border-shogun-border rounded-xl h-32" />
        </div>
      )}

      {/* Error */}
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

      {/* No data */}
      {selectedClientId && !loading && !error && !data && (
        <div className="text-center py-16">
          <p className="text-shogun-text-secondary font-[var(--font-display)]">
            Configure a conta Meta nas configurações
          </p>
        </div>
      )}

      {selectedClientId && !loading && !error && data && cur && prev && (
        <>
          {/* ══════════════════ SIMPLES TAB ══════════════════ */}
          {tab === "simples" && (
            <div className="space-y-6">
              {/* Block 1 — 4 big KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SimpleKpiCard
                  label="Pedidos gerados"
                  value={fmtNum(cur.purchases)}
                  icon={<ShoppingCart size={20} />}
                  change={calcDelta(cur.purchases, prev.purchases)}
                />
                <SimpleKpiCard
                  label="Receita gerada"
                  value={fmtBRLFull(cur.purchaseValue)}
                  icon={<Receipt size={20} />}
                  change={calcDelta(cur.purchaseValue, prev.purchaseValue)}
                />
                <SimpleKpiCard
                  label="Valor investido"
                  value={fmtBRLFull(cur.spend)}
                  icon={<TrendingUp size={20} />}
                  change={calcDelta(cur.spend, prev.spend)}
                  positiveGood={false}
                />
                <SimpleKpiCard
                  label="ROAS"
                  value={cur.purchaseRoas.toFixed(2)}
                  icon={<Target size={20} />}
                  valueClassName={roasStyle(cur.purchaseRoas).text}
                  badge={roasStyle(cur.purchaseRoas)}
                  change={calcDelta(cur.purchaseRoas, prev.purchaseRoas)}
                />
              </div>

              {/* Block 2 — Daily evolution chart */}
              <ShogunCard>
                <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-1">
                  Evolução diária
                </h2>
                <p className="text-xs text-shogun-text-muted font-[var(--font-display)] mb-4">
                  Pedidos e gasto por dia no período selecionado
                </p>
                <DailyChart dailyData={data.dailyData} />
              </ShogunCard>

              {/* Block 3 — Auto-generated summary */}
              {dateRange && <SummaryBlock cur={cur} dateRange={dateRange} />}
            </div>
          )}

          {/* ══════════════════ AVANÇADO TAB ══════════════════ */}
          {tab === "avancado" && (
            <div className="space-y-6">
              {/* Resumo executivo */}
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
                    icon={<BarChart2 size={16} />}
                  />
                  <KpiCard
                    label="ROAS"
                    value={cur.purchaseRoas.toFixed(2)}
                    change={calcDelta(cur.purchaseRoas, prev.purchaseRoas)}
                    note="Retorno sobre investimento"
                    icon={<Target size={16} />}
                  />
                  <KpiCard
                    label="Compras"
                    value={fmtNum(cur.purchases)}
                    change={calcDelta(cur.purchases, prev.purchases)}
                    note="Compras atribuídas"
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
                    icon={<Receipt size={16} />}
                  />
                </div>
              </section>

              {/* Métricas detalhadas */}
              <section>
                <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
                  Métricas detalhadas
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard label="Alcance total" value={fmtNum(cur.reach)} change={calcDelta(cur.reach, prev.reach)} />
                  <MetricCard label="Impressões totais" value={fmtNum(cur.impressions)} change={calcDelta(cur.impressions, prev.impressions)} />
                  <MetricCard label="Total de cliques no link" value={fmtNum(cur.linkClicks)} change={calcDelta(cur.linkClicks, prev.linkClicks)} />
                  <MetricCard label="CTR (taxa de cliques)" value={fmtPct(cur.ctr)} change={calcDelta(cur.ctr, prev.ctr)} />
                  <MetricCard label="Visualizações da landing page" value={fmtNum(cur.lpViews)} change={calcDelta(cur.lpViews, prev.lpViews)} />
                  <MetricCard label="Adições ao carrinho" value={fmtNum(cur.addToCart)} change={calcDelta(cur.addToCart, prev.addToCart)} />
                  <MetricCard label="Finalizações de compra iniciadas" value={fmtNum(cur.initiateCheckout)} change={calcDelta(cur.initiateCheckout, prev.initiateCheckout)} />
                  <MetricCard label="Compras" value={fmtNum(cur.purchases)} change={calcDelta(cur.purchases, prev.purchases)} />
                  <MetricCard label="CPM médio" value={fmtBRLCents(cur.cpp)} change={calcDelta(cur.cpp, prev.cpp)} positiveGood={false} />
                  <MetricCard label="CPC médio" value={fmtBRLCents(cur.cpc)} change={calcDelta(cur.cpc, prev.cpc)} positiveGood={false} />
                  <MetricCard label="Custo por compra" value={fmtBRLCents(cur.costPerPurchase)} change={calcDelta(cur.costPerPurchase, prev.costPerPurchase)} positiveGood={false} />
                  <MetricCard label="Frequência" value={cur.frequency.toFixed(2)} change={calcDelta(cur.frequency, prev.frequency)} positiveGood={false} />
                </div>
              </section>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ShogunCard>
                  <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
                    Funil de performance
                  </h2>
                  <PerformanceFunnel cur={cur} />
                </ShogunCard>
                <ShogunCard>
                  <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
                    Público comprador
                  </h2>
                  <GenderDonut genderStats={data.genderStats} />
                </ShogunCard>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
