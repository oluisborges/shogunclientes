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
  GitCompare,
} from "lucide-react"
import { ShogunCard } from "@/components/ui/ShogunCard"
import { DatePicker } from "@/components/ui/DatePicker"
import { useMetricas } from "@/lib/hooks/useMetricas"
import { useDateRangeContext } from "@/lib/hooks/useDateRangeContext"
import { useClientContext } from "@/lib/hooks/useClientContext"
import type { MetricasGender, MetricasPeriod, MetricasDaily } from "@/lib/hooks/useMetricas"

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

// ─── Simple KPI Card ─────────────────────────────────────────────────────────

function SimpleKpiCard({
  label,
  description,
  value,
  icon,
  valueClassName = "text-shogun-text-primary",
  badge,
  showCompare = false,
  prevValue,
  change,
  positiveGood = true,
}: {
  label: string
  description: string
  value: string
  icon: React.ReactNode
  valueClassName?: string
  badge?: { text: string; className: string }
  showCompare?: boolean
  prevValue?: string
  change?: number | null
  positiveGood?: boolean
}) {
  const isGood =
    change !== undefined && change !== null && (positiveGood ? change >= 0 : change <= 0)
  const arrow = isGood ? "↑" : "↓"

  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-[var(--font-display)] font-medium text-shogun-text-secondary">
          {label}
        </span>
        <span className="text-shogun-text-muted/60">{icon}</span>
      </div>

      <span className={`font-[var(--font-data)] text-4xl font-bold leading-none ${valueClassName}`}>
        {value}
      </span>

      {/* Description — lighter so it doesn't compete with the number */}
      <p className="text-xs font-[var(--font-display)] text-white/35 leading-snug">
        {description}
      </p>

      {/* ROAS status badge */}
      {badge && (
        <span className={`self-start text-xs font-[var(--font-display)] px-2 py-0.5 rounded-full font-semibold ${badge.className}`}>
          {badge.text}
        </span>
      )}

      {/* Comparison: ant: [prev]  ↑/↓ X% — side by side, only when enabled */}
      {showCompare && prevValue && change !== undefined && change !== null && (
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span className="text-xs font-[var(--font-display)] text-white/45">
            ant: {prevValue}
          </span>
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-[var(--font-display)] font-semibold px-1.5 py-0.5 rounded-full ${
              isGood
                ? "bg-shogun-accent/15 text-shogun-accent"
                : "bg-red-400/15 text-red-400"
            }`}
          >
            {arrow} {Math.abs(change).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Daily line chart (3 lines) ───────────────────────────────────────────────

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
    payload?: Array<{ dataKey: string; value: number; color: string; name: string }>
    label?: string
  }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-shogun-bg-base border border-shogun-border rounded-lg px-3 py-2 text-sm font-[var(--font-display)] space-y-1">
        <p className="text-shogun-text-muted text-xs mb-1">{label ? formatDate(label) : ""}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-[var(--font-data)] font-semibold text-xs">
            {p.name}:{" "}
            {p.dataKey === "purchases"
              ? `${p.value} pedido${p.value !== 1 ? "s" : ""}`
              : fmtBRLFull(p.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Manual legend */}
      <div className="flex items-center gap-5 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-[2px] rounded-full bg-[#95D600]" />
          <span className="text-xs font-[var(--font-display)] text-shogun-text-secondary">Pedidos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-[2px] rounded-full bg-[#3b82f6]" />
          <span className="text-xs font-[var(--font-display)] text-shogun-text-secondary">Receita gerada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-[2px] rounded-full bg-[#f59e0b]" />
          <span className="text-xs font-[var(--font-display)] text-shogun-text-secondary">Investimento</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={dailyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-shogun-border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: "var(--color-shogun-text-secondary)", fontSize: 11, fontFamily: "var(--font-display)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          {/* Left axis: Pedidos (count) */}
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
          {/* Right axis: Receita + Investimento (BRL) */}
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
            type="linear"
            dataKey="purchases"
            name="Pedidos"
            stroke="#95D600"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#95D600", strokeWidth: 0 }}
          />
          <Line
            yAxisId="right"
            type="linear"
            dataKey="purchaseValue"
            name="Receita gerada"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
          />
          <Line
            yAxisId="right"
            type="linear"
            dataKey="spend"
            name="Investimento"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Advanced tab components ──────────────────────────────────────────────────

function KpiCard({ label, value, change, note, positiveGood = true, icon, showCompare = true }: {
  label: string; value: string; change: number | null
  note?: string; positiveGood?: boolean; icon?: React.ReactNode; showCompare?: boolean
}) {
  const isGood = change !== null && (positiveGood ? change >= 0 : change <= 0)
  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-[var(--font-display)] uppercase tracking-wider text-shogun-text-secondary">{label}</span>
        {icon && <span className="text-shogun-text-muted">{icon}</span>}
      </div>
      <span className="font-[var(--font-data)] text-3xl font-bold text-shogun-text-primary leading-none">{value}</span>
      {showCompare && change !== null && (
        <span className={`inline-flex self-start text-xs font-[var(--font-display)] px-2 py-0.5 rounded-full ${isGood ? "bg-shogun-accent/15 text-shogun-accent" : "bg-shogun-danger/15 text-shogun-danger"}`}>
          {change >= 0 ? "+" : ""}{change.toFixed(1)}% vs anterior
        </span>
      )}
      {note && <span className="text-xs text-shogun-text-muted font-[var(--font-display)]">{note}</span>}
    </div>
  )
}

function MetricCard({ label, value, change, positiveGood = true, showCompare = true }: {
  label: string; value: string; change: number | null; positiveGood?: boolean; showCompare?: boolean
}) {
  const isGood = change !== null && (positiveGood ? change >= 0 : change <= 0)
  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-4 flex flex-col gap-1.5">
      <span className="text-xs font-[var(--font-display)] uppercase tracking-wider text-shogun-text-secondary leading-tight">{label}</span>
      <span className="font-[var(--font-data)] text-2xl font-bold text-shogun-text-primary leading-none">{value}</span>
      {showCompare && change !== null && (
        <span className={`inline-flex self-start text-xs font-[var(--font-display)] px-1.5 py-0.5 rounded-full ${isGood ? "bg-shogun-accent/15 text-shogun-accent" : "bg-shogun-danger/15 text-shogun-danger"}`}>
          {change >= 0 ? "+" : ""}{change.toFixed(1)}% vs anterior
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

  // Ticket médio helpers
  const curTicket = cur && cur.purchases > 0 ? cur.purchaseValue / cur.purchases : 0
  const prevTicket = prev && prev.purchases > 0 ? prev.purchaseValue / prev.purchases : 0

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">
            Métricas
          </h1>
          {/* Tab pills */}
          <div className="flex gap-1 bg-shogun-bg-elevated border border-shogun-border rounded-lg p-1">
            {(["simples", "avancado"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-[var(--font-display)] transition-all ${
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

        {/* Date controls */}
        <div className="flex items-end gap-3">
          {/* Main period */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-[var(--font-display)] uppercase tracking-wider text-shogun-text-muted px-1">
              Período
            </span>
            <DatePicker value={dateRange ?? undefined} onChange={setDateRange} />
          </div>

          {/* Compare toggle */}
          <button
            onClick={() => setShowCompare((v) => !v)}
            className={`flex items-center gap-1.5 h-[38px] px-4 rounded-lg border font-[var(--font-display)] text-sm font-medium transition-all ${
              showCompare
                ? "bg-shogun-accent text-black border-shogun-accent"
                : "bg-shogun-accent/10 border-shogun-accent text-shogun-accent hover:bg-shogun-accent/20"
            }`}
          >
            <GitCompare size={14} />
            Comparar
          </button>

          {/* Compare period — only visible when showCompare */}
          {showCompare && (
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
          )}
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
        <div className="space-y-4">
          <div className="animate-pulse bg-shogun-bg-elevated border border-shogun-border rounded-xl h-14" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <SkeletonGrid count={5} height="h-44" />
          </div>
          <div className="animate-pulse bg-shogun-bg-elevated border border-shogun-border rounded-xl h-80" />
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
            <div className="space-y-5">
              {/* 5 KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <SimpleKpiCard
                  label="Pedidos"
                  description="Número de pedidos que vieram através dos anúncios"
                  value={fmtNum(cur.purchases)}
                  icon={<ShoppingCart size={18} />}
                  showCompare={showCompare}
                  prevValue={fmtNum(prev.purchases)}
                  change={calcDelta(cur.purchases, prev.purchases)}
                />
                <SimpleKpiCard
                  label="Receita gerada"
                  description="Receita gerada através dos anúncios"
                  value={fmtBRLFull(cur.purchaseValue)}
                  icon={<Receipt size={18} />}
                  showCompare={showCompare}
                  prevValue={fmtBRLFull(prev.purchaseValue)}
                  change={calcDelta(cur.purchaseValue, prev.purchaseValue)}
                />
                <SimpleKpiCard
                  label="Valor Investido"
                  description="Valor que você investiu nos anúncios"
                  value={fmtBRLFull(cur.spend)}
                  icon={<TrendingUp size={18} />}
                  showCompare={showCompare}
                  prevValue={fmtBRLFull(prev.spend)}
                  change={calcDelta(cur.spend, prev.spend)}
                  positiveGood={false}
                />
                <SimpleKpiCard
                  label="ROAS"
                  description={`Para cada R$ 1,00 investido, retornou R$ ${cur.purchaseRoas.toFixed(2).replace(".", ",")}`}
                  value={cur.purchaseRoas.toFixed(2)}
                  icon={<Target size={18} />}
                  valueClassName={roasStyle(cur.purchaseRoas).text}
                  badge={{ text: roasStyle(cur.purchaseRoas).label, className: roasStyle(cur.purchaseRoas).badge }}
                  showCompare={showCompare}
                  prevValue={prev.purchaseRoas.toFixed(2)}
                  change={calcDelta(cur.purchaseRoas, prev.purchaseRoas)}
                />
                <SimpleKpiCard
                  label="Ticket Médio"
                  description="Valor médio por pedido gerado pelos anúncios"
                  value={fmtBRLFull(curTicket)}
                  icon={<BarChart2 size={18} />}
                  showCompare={showCompare}
                  prevValue={fmtBRLFull(prevTicket)}
                  change={calcDelta(curTicket, prevTicket)}
                />
              </div>

              {/* Gráfico de evolução diária */}
              <ShogunCard>
                <h2 className="text-base font-[var(--font-display)] font-semibold text-shogun-text-primary mb-1">
                  Evolução diária
                </h2>
                <p className="text-xs text-shogun-text-muted font-[var(--font-display)] mb-4">
                  Pedidos, receita e investimento por dia no período selecionado
                </p>
                <DailyChart dailyData={data.dailyData} />
              </ShogunCard>
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
                    showCompare={showCompare}
                  />
                  <KpiCard
                    label="Valor da conversão"
                    value={fmtBRLFull(cur.purchaseValue)}
                    change={calcDelta(cur.purchaseValue, prev.purchaseValue)}
                    note="Receita atribuída (Meta)"
                    icon={<BarChart2 size={16} />}
                    showCompare={showCompare}
                  />
                  <KpiCard
                    label="ROAS"
                    value={cur.purchaseRoas.toFixed(2)}
                    change={calcDelta(cur.purchaseRoas, prev.purchaseRoas)}
                    note="Retorno sobre investimento"
                    icon={<Target size={16} />}
                    showCompare={showCompare}
                  />
                  <KpiCard
                    label="Compras"
                    value={fmtNum(cur.purchases)}
                    change={calcDelta(cur.purchases, prev.purchases)}
                    note="Compras atribuídas"
                    icon={<ShoppingCart size={16} />}
                    showCompare={showCompare}
                  />
                  <KpiCard
                    label="Ticket médio"
                    value={fmtBRLFull(curTicket)}
                    change={calcDelta(curTicket, prevTicket)}
                    note="Valor médio por compra"
                    icon={<Receipt size={16} />}
                    showCompare={showCompare}
                  />
                </div>
              </section>

              {/* Métricas detalhadas */}
              <section>
                <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
                  Métricas detalhadas
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard label="Alcance total" value={fmtNum(cur.reach)} change={calcDelta(cur.reach, prev.reach)} showCompare={showCompare} />
                  <MetricCard label="Impressões totais" value={fmtNum(cur.impressions)} change={calcDelta(cur.impressions, prev.impressions)} showCompare={showCompare} />
                  <MetricCard label="Total de cliques no link" value={fmtNum(cur.linkClicks)} change={calcDelta(cur.linkClicks, prev.linkClicks)} showCompare={showCompare} />
                  <MetricCard label="CTR (taxa de cliques)" value={fmtPct(cur.ctr)} change={calcDelta(cur.ctr, prev.ctr)} showCompare={showCompare} />
                  <MetricCard label="Visualizações da landing page" value={fmtNum(cur.lpViews)} change={calcDelta(cur.lpViews, prev.lpViews)} showCompare={showCompare} />
                  <MetricCard label="Adições ao carrinho" value={fmtNum(cur.addToCart)} change={calcDelta(cur.addToCart, prev.addToCart)} showCompare={showCompare} />
                  <MetricCard label="Finalizações de compra iniciadas" value={fmtNum(cur.initiateCheckout)} change={calcDelta(cur.initiateCheckout, prev.initiateCheckout)} showCompare={showCompare} />
                  <MetricCard label="Compras" value={fmtNum(cur.purchases)} change={calcDelta(cur.purchases, prev.purchases)} showCompare={showCompare} />
                  <MetricCard label="CPM médio" value={fmtBRLCents(cur.cpp)} change={calcDelta(cur.cpp, prev.cpp)} positiveGood={false} showCompare={showCompare} />
                  <MetricCard label="CPC médio" value={fmtBRLCents(cur.cpc)} change={calcDelta(cur.cpc, prev.cpc)} positiveGood={false} showCompare={showCompare} />
                  <MetricCard label="Custo por compra" value={fmtBRLCents(cur.costPerPurchase)} change={calcDelta(cur.costPerPurchase, prev.costPerPurchase)} positiveGood={false} showCompare={showCompare} />
                  <MetricCard label="Frequência" value={cur.frequency.toFixed(2)} change={calcDelta(cur.frequency, prev.frequency)} positiveGood={false} showCompare={showCompare} />
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
