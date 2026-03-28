"use client"

import { useState, useMemo } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import type { MetricasGender, MetricasPeriod, MetricasDaily, MetricasAge } from "@/lib/hooks/useMetricas"

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── ROAS style ───────────────────────────────────────────────────────────────

function roasStyle(roas: number): { badge: { text: string; className: string } | null } {
  if (roas >= 15.01) return { badge: { text: "EXCELENTE!", className: "bg-purple-500/15 text-purple-400" } }
  if (roas >= 8) return { badge: { text: "ÓTIMO", className: "bg-shogun-accent/15 text-shogun-accent" } }
  return { badge: null }
}

// ─── Comparison row ───────────────────────────────────────────────────────────

function CompareRow({
  prevValue,
  change,
  positiveGood = true,
}: {
  prevValue: string
  change: number | null
  positiveGood?: boolean
}) {
  if (change === null) return null
  const isGood = positiveGood ? change >= 0 : change <= 0
  const arrow = isGood ? "↑" : "↓"
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-[var(--font-display)] text-white/40">
        anterior: {prevValue}
      </span>
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-[var(--font-display)] font-semibold px-1.5 py-0.5 rounded-full ${
          isGood ? "bg-shogun-accent/15 text-shogun-accent" : "bg-red-400/15 text-red-400"
        }`}
      >
        {arrow} {Math.abs(change).toFixed(1)}%
      </span>
    </div>
  )
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-0.5 h-5 rounded-full bg-shogun-accent" />
      <h2 className="text-base font-[var(--font-display)] font-semibold text-shogun-text-primary">
        {children}
      </h2>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonGrid({ count, height = "h-32" }: { count: number; height?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse bg-shogun-bg-elevated border border-shogun-border rounded-xl ${height}`} />
      ))}
    </>
  )
}

// ─── Simple KPI Card ──────────────────────────────────────────────────────────

function SimpleKpiCard({
  label,
  description,
  value,
  icon,
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
  badge?: { text: string; className: string } | null
  showCompare?: boolean
  prevValue?: string
  change?: number | null
  positiveGood?: boolean
}) {
  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-2xl p-5 flex flex-col gap-2">
      {/* Label + icon */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-[var(--font-display)] font-medium text-shogun-text-secondary">{label}</span>
        <span className="text-white/30">{icon}</span>
      </div>

      {/* Main value */}
      <span className="font-[var(--font-data)] text-4xl font-bold leading-none text-shogun-text-primary">
        {value}
      </span>

      {/* Comparison — right below the number */}
      {showCompare && prevValue && change !== undefined && change !== null && (
        <CompareRow prevValue={prevValue} change={change} positiveGood={positiveGood} />
      )}

      {/* Description */}
      <p className="text-xs font-[var(--font-display)] text-white/35 leading-snug">{description}</p>

      {/* Badge (ROAS) */}
      {badge && (
        <span className={`self-start text-xs font-[var(--font-display)] px-2 py-0.5 rounded-full font-semibold ${badge.className}`}>
          {badge.text}
        </span>
      )}
    </div>
  )
}

// ─── Metric Card (Avançado grid) ──────────────────────────────────────────────

function MetricCard({
  label,
  value,
  prevValue,
  change,
  positiveGood = true,
  showCompare = false,
}: {
  label: string
  value: string
  prevValue: string
  change: number | null
  positiveGood?: boolean
  showCompare?: boolean
}) {
  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded-xl p-4 flex flex-col gap-1.5">
      <span className="text-xs font-[var(--font-display)] uppercase tracking-wider text-white/40 leading-tight">{label}</span>
      <span className="font-[var(--font-data)] text-2xl font-bold text-shogun-text-primary leading-none">{value}</span>
      {showCompare && <CompareRow prevValue={prevValue} change={change} positiveGood={positiveGood} />}
    </div>
  )
}

// ─── Daily line chart ─────────────────────────────────────────────────────────

function DailyChart({ dailyData }: { dailyData: MetricasDaily[] }) {
  if (!dailyData.length) {
    return <p className="text-white/40 text-sm font-[var(--font-display)] text-center py-8">Sem dados diários disponíveis</p>
  }

  const formatDate = (s: string) => { const p = s.split("-"); return `${p[2]}/${p[1]}` }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string; name: string }>; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-shogun-bg-base border border-shogun-border rounded-lg px-3 py-2 font-[var(--font-display)] space-y-1">
        <p className="text-white/40 text-xs mb-1">{label ? formatDate(label) : ""}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-[var(--font-data)] font-semibold text-xs">
            {p.name}: {p.dataKey === "purchases" ? `${p.value} pedido${p.value !== 1 ? "s" : ""}` : fmtBRLFull(p.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-5 mb-4 flex-wrap">
        {[
          { color: "#95D600", label: "Pedidos" },
          { color: "#3b82f6", label: "Receita gerada" },
          { color: "#f59e0b", label: "Investimento" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-4 h-[2px] rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs font-[var(--font-display)] text-white/50">{item.label}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={dailyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-shogun-border)" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "var(--font-display)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis yAxisId="left" orientation="left" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "var(--font-display)" }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={32} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "var(--font-display)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${fmtNum(v)}`} width={52} />
          <Tooltip content={<CustomTooltip />} />
          <Line yAxisId="left" type="linear" dataKey="purchases" name="Pedidos" stroke="#95D600" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#95D600", strokeWidth: 0 }} />
          <Line yAxisId="right" type="linear" dataKey="purchaseValue" name="Receita gerada" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }} />
          <Line yAxisId="right" type="linear" dataKey="spend" name="Investimento" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Age bar chart ────────────────────────────────────────────────────────────

function AgeBarChart({ ageStats }: { ageStats: MetricasAge[] }) {
  if (!ageStats.length) {
    return <p className="text-white/40 text-sm font-[var(--font-display)] text-center py-8">Sem dados de faixa etária disponíveis</p>
  }

  const chartData = ageStats.map((a) => ({
    ...a,
    rate: a.lpViews > 0 ? ((a.purchases / a.lpViews) * 100).toFixed(1) : "0",
  }))

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string; name: string; dataKey: string }>; label?: string }) => {
    if (!active || !payload?.length) return null
    const row = chartData.find((d) => d.age === label)
    return (
      <div className="bg-shogun-bg-base border border-shogun-border rounded-lg px-3 py-2 font-[var(--font-display)] space-y-1 min-w-[160px]">
        <p className="text-white/40 text-xs mb-1.5">{label} anos</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-[var(--font-data)] font-semibold text-xs">
            {p.name}: {fmtNum(p.value)}
          </p>
        ))}
        {row && (
          <p className="text-xs font-[var(--font-display)] text-white/50 pt-1 border-t border-white/10">
            Taxa de compra: <span className="text-shogun-accent font-semibold">{row.rate}%</span>
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-5 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#95D600]" />
          <span className="text-xs font-[var(--font-display)] text-white/50">Compras</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
          <span className="text-xs font-[var(--font-display)] text-white/50">Visualização de Cardápio</span>
        </div>
        <span className="text-xs font-[var(--font-display)] text-white/35 ml-1">· taxa de compra no tooltip</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-shogun-border)" vertical={false} />
          <XAxis dataKey="age" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "var(--font-display)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "var(--font-display)" }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={36} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="purchases" name="Compras" fill="#95D600" radius={[4, 4, 0, 0]} />
          <Bar dataKey="lpViews" name="Visualização de Cardápio" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Performance funnel ───────────────────────────────────────────────────────

function PerformanceFunnel({ cur }: { cur: MetricasPeriod }) {
  const steps = [
    { label: "Alcance", sub: "pessoas atingidas", value: cur.reach },
    { label: "Cliques", sub: "cliques no anúncio", value: cur.linkClicks },
    { label: "Visualização de Cardápio", sub: "acessaram o cardápio", value: cur.lpViews },
    { label: "Compras", sub: "pedidos realizados", value: cur.purchases },
  ]

  return (
    <div className="flex items-stretch w-full">
      {steps.map((step, i) => {
        const next = steps[i + 1]
        const rate = next && step.value > 0 ? (next.value / step.value) * 100 : null
        return (
          <div key={step.label} className="flex items-center flex-1 min-w-0">
            <div className="flex-1 flex flex-col items-center gap-1.5 p-5 bg-shogun-bg-base border border-shogun-border rounded-2xl text-center">
              <span className="text-[10px] font-[var(--font-display)] uppercase tracking-widest text-white/40 leading-tight">
                {step.label}
              </span>
              <span className="font-[var(--font-data)] text-3xl font-bold text-shogun-text-primary">
                {fmtNum(step.value)}
              </span>
              <span className="text-[10px] font-[var(--font-display)] text-white/30">
                {step.sub}
              </span>
            </div>
            {next && (
              <div className="flex flex-col items-center px-2.5 shrink-0 gap-0.5">
                <span className="text-xs font-[var(--font-display)] font-bold text-shogun-accent whitespace-nowrap">
                  {rate !== null ? `${rate.toFixed(1)}%` : "—"}
                </span>
                <ArrowRight size={15} className="text-white/25" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Gender donut ─────────────────────────────────────────────────────────────

const GENDER_COLORS: Record<string, string> = { male: "#3b82f6", female: "#ec4899" }

function GenderDonut({ genderStats }: { genderStats: MetricasGender[] }) {
  const total = genderStats.reduce((s, g) => s + g.purchases, 0)
  const data = genderStats.map((g) => ({
    name: g.gender === "male" ? "Homens" : "Mulheres",
    value: g.purchases,
    gender: g.gender,
  }))

  if (data.length === 0) {
    return <p className="text-white/40 text-sm font-[var(--font-display)] text-center mt-8">Sem dados de público disponíveis</p>
  }

  // Custom tooltip with lpViews, purchases and rate
  const GenderTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { gender: string; name: string; value: number } }> }) => {
    if (!active || !payload?.length) return null
    const entry = payload[0].payload
    const stat = genderStats.find((g) => g.gender === entry.gender)
    if (!stat) return null
    const pct = total > 0 ? ((stat.purchases / total) * 100).toFixed(0) : "0"
    const rate = stat.lpViews > 0 ? ((stat.purchases / stat.lpViews) * 100).toFixed(1) : "—"
    const color = GENDER_COLORS[stat.gender] ?? "#6b7280"
    return (
      <div className="bg-shogun-bg-base border border-shogun-border rounded-xl px-4 py-3 font-[var(--font-display)] space-y-1.5 min-w-[190px]">
        <p className="font-semibold text-sm mb-2" style={{ color }}>{entry.name}</p>
        <div className="flex justify-between text-xs gap-4">
          <span className="text-white/50">Vis. de Cardápio</span>
          <span className="font-[var(--font-data)] font-semibold text-shogun-text-primary">{fmtNum(stat.lpViews)}</span>
        </div>
        <div className="flex justify-between text-xs gap-4">
          <span className="text-white/50">Compras</span>
          <span className="font-[var(--font-data)] font-semibold" style={{ color }}>{fmtNum(stat.purchases)} ({pct}%)</span>
        </div>
        <div className="flex justify-between text-xs gap-4 pt-1 border-t border-white/10">
          <span className="text-white/50">Taxa de compra</span>
          <span className="font-[var(--font-data)] font-bold text-shogun-accent">{rate}%</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Stats row */}
      <div className="flex gap-10 mb-5 w-full justify-center">
        {genderStats.map((g) => {
          const color = GENDER_COLORS[g.gender] ?? "#6b7280"
          return (
            <div key={g.gender} className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
                <span className="text-[10px] font-[var(--font-display)] uppercase tracking-widest text-white/40">
                  {g.gender === "male" ? "Homens" : "Mulheres"}
                </span>
              </div>
              <span className="font-[var(--font-data)] text-3xl font-bold leading-none" style={{ color }}>
                {fmtNum(g.purchases)}
              </span>
              <span className="text-xs text-white/40 font-[var(--font-display)] mt-1">
                {total > 0 ? ((g.purchases / total) * 100).toFixed(0) : 0}% das compras
              </span>
            </div>
          )
        })}
      </div>

      {/* Donut */}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={88} dataKey="value" paddingAngle={3}>
            {data.map((entry) => (
              <Cell key={entry.gender} fill={GENDER_COLORS[entry.gender] ?? "#6b7280"} />
            ))}
          </Pie>
          <Tooltip content={<GenderTooltip />} />
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
  const curTicket = cur && cur.purchases > 0 ? cur.purchaseValue / cur.purchases : 0
  const prevTicket = prev && prev.purchases > 0 ? prev.purchaseValue / prev.purchases : 0

  const kpiCards = cur && prev ? (
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
        badge={roasStyle(cur.purchaseRoas).badge}
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
  ) : null

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">Métricas</h1>
          <div className="flex gap-1 bg-shogun-bg-elevated border border-shogun-border rounded-lg p-1">
            {(["simples", "avancado"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-[var(--font-display)] transition-all ${
                  tab === t ? "bg-shogun-accent text-black font-semibold" : "text-white/50 hover:text-shogun-text-primary"
                }`}
              >
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
            className={`flex items-center gap-1.5 h-[38px] px-4 rounded-lg border font-[var(--font-display)] text-sm font-medium transition-all ${
              showCompare
                ? "bg-shogun-accent text-black border-shogun-accent"
                : "bg-shogun-accent/10 border-shogun-accent text-shogun-accent hover:bg-shogun-accent/20"
            }`}
          >
            <GitCompare size={14} />
            Comparar
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

      {/* No client */}
      {!selectedClientId && (
        <div className="text-center py-16">
          <Target size={40} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/50 font-[var(--font-display)]">Selecione um cliente para visualizar as métricas</p>
        </div>
      )}

      {/* Loading */}
      {selectedClientId && loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4"><SkeletonGrid count={5} height="h-44" /></div>
          <div className="animate-pulse bg-shogun-bg-elevated border border-shogun-border rounded-xl h-80" />
        </div>
      )}

      {/* Error */}
      {selectedClientId && error && (
        <div className="text-center py-16">
          <p className="text-shogun-danger font-[var(--font-display)] text-sm">{error}</p>
        </div>
      )}

      {/* No data */}
      {selectedClientId && !loading && !error && !data && (
        <div className="text-center py-16">
          <p className="text-white/50 font-[var(--font-display)]">Configure a conta Meta nas configurações</p>
        </div>
      )}

      {selectedClientId && !loading && !error && data && cur && prev && (
        <>
          {/* ══════════════════ SIMPLES ══════════════════ */}
          {tab === "simples" && (
            <div className="space-y-6">
              {kpiCards}
              <ShogunCard>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-0.5 h-5 rounded-full bg-shogun-accent" />
                  <h2 className="text-base font-[var(--font-display)] font-semibold text-shogun-text-primary">Evolução diária</h2>
                </div>
                <p className="text-xs text-white/40 font-[var(--font-display)] mb-5 pl-2.5">
                  Pedidos, receita e investimento por dia no período selecionado
                </p>
                <DailyChart dailyData={data.dailyData} />
              </ShogunCard>
            </div>
          )}

          {/* ══════════════════ AVANÇADO ══════════════════ */}
          {tab === "avancado" && (
            <div className="space-y-8">
              {/* Resumo executivo */}
              <section>
                <SectionTitle>Resumo executivo</SectionTitle>
                {kpiCards}
              </section>

              {/* Métricas detalhadas */}
              <section>
                <SectionTitle>Métricas detalhadas</SectionTitle>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard label="Alcance total" value={fmtNum(cur.reach)} prevValue={fmtNum(prev.reach)} change={calcDelta(cur.reach, prev.reach)} showCompare={showCompare} />
                  <MetricCard label="Impressões totais" value={fmtNum(cur.impressions)} prevValue={fmtNum(prev.impressions)} change={calcDelta(cur.impressions, prev.impressions)} showCompare={showCompare} />
                  <MetricCard label="Total de cliques no link" value={fmtNum(cur.linkClicks)} prevValue={fmtNum(prev.linkClicks)} change={calcDelta(cur.linkClicks, prev.linkClicks)} showCompare={showCompare} />
                  <MetricCard label="CTR (taxa de cliques)" value={fmtPct(cur.ctr)} prevValue={fmtPct(prev.ctr)} change={calcDelta(cur.ctr, prev.ctr)} showCompare={showCompare} />
                  <MetricCard label="Visualização de Cardápio" value={fmtNum(cur.lpViews)} prevValue={fmtNum(prev.lpViews)} change={calcDelta(cur.lpViews, prev.lpViews)} showCompare={showCompare} />
                  <MetricCard label="Adições ao carrinho" value={fmtNum(cur.addToCart)} prevValue={fmtNum(prev.addToCart)} change={calcDelta(cur.addToCart, prev.addToCart)} showCompare={showCompare} />
                  <MetricCard label="Finalizações de compra iniciadas" value={fmtNum(cur.initiateCheckout)} prevValue={fmtNum(prev.initiateCheckout)} change={calcDelta(cur.initiateCheckout, prev.initiateCheckout)} showCompare={showCompare} />
                  <MetricCard label="Compras" value={fmtNum(cur.purchases)} prevValue={fmtNum(prev.purchases)} change={calcDelta(cur.purchases, prev.purchases)} showCompare={showCompare} />
                  <MetricCard label="CPM médio (Custo Por Mil visualizações de anúncio)" value={fmtBRLCents(cur.cpp)} prevValue={fmtBRLCents(prev.cpp)} change={calcDelta(cur.cpp, prev.cpp)} positiveGood={false} showCompare={showCompare} />
                  <MetricCard label="CPC médio (Custo Por Clique)" value={fmtBRLCents(cur.cpc)} prevValue={fmtBRLCents(prev.cpc)} change={calcDelta(cur.cpc, prev.cpc)} positiveGood={false} showCompare={showCompare} />
                  <MetricCard label="Custo por compra" value={fmtBRLCents(cur.costPerPurchase)} prevValue={fmtBRLCents(prev.costPerPurchase)} change={calcDelta(cur.costPerPurchase, prev.costPerPurchase)} positiveGood={false} showCompare={showCompare} />
                  <MetricCard label="Frequência" value={cur.frequency.toFixed(2)} prevValue={prev.frequency.toFixed(2)} change={calcDelta(cur.frequency, prev.frequency)} positiveGood={false} showCompare={showCompare} />
                </div>
              </section>

              {/* Público comprador + Faixa etária */}
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
                  <p className="text-xs text-white/40 font-[var(--font-display)] mb-4 pl-2.5">
                    Compras e visualizações de cardápio por faixa de idade
                  </p>
                  <AgeBarChart ageStats={data.ageStats} />
                </ShogunCard>
              </div>

              {/* Funil de performance — full width at bottom */}
              <ShogunCard>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-0.5 h-5 rounded-full bg-shogun-accent" />
                  <h2 className="text-base font-[var(--font-display)] font-semibold text-shogun-text-primary">Funil de performance</h2>
                </div>
                <PerformanceFunnel cur={cur} />
              </ShogunCard>
            </div>
          )}
        </>
      )}
    </div>
  )
}
