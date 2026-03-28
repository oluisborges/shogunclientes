"use client"

import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { ArrowRight, Info } from "lucide-react"
import { fmtNum, fmtBRLFull } from "@/lib/format"
import type { MetricasGender, MetricasPeriod, MetricasDaily, MetricasAge } from "@/lib/hooks/useMetricas"

// ─── Daily line chart ─────────────────────────────────────────────────────────

export function DailyChart({ dailyData }: { dailyData: MetricasDaily[] }) {
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

export function AgeBarChart({ ageStats }: { ageStats: MetricasAge[] }) {
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
        {[
          { color: "#95D600", label: "Compras", shape: "rounded-sm" },
          { color: "#3b82f6", label: "Visualização de Cardápio", shape: "rounded-sm" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 ${item.shape}`} style={{ background: item.color }} />
            <span className="text-xs font-[var(--font-display)] text-white/50">{item.label}</span>
          </div>
        ))}
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

export function PerformanceFunnel({ cur }: { cur: MetricasPeriod }) {
  const steps = [
    { label: "Alcance",                  sub: "pessoas atingidas",    value: cur.reach },
    { label: "Cliques",                  sub: "cliques no anúncio",   value: cur.linkClicks },
    { label: "Visualização de Cardápio", sub: "acessaram o cardápio", value: cur.lpViews },
    { label: "Compras",                  sub: "pedidos realizados",   value: cur.purchases },
  ]

  return (
    <div className="flex items-stretch w-full">
      {steps.map((step, i) => {
        const next = steps[i + 1]
        const rate = next && step.value > 0 ? (next.value / step.value) * 100 : null
        return (
          <div key={step.label} className="flex items-center flex-1 min-w-0">
            <div className="flex-1 flex flex-col items-center gap-1.5 p-5 bg-shogun-bg-base border border-shogun-border rounded-2xl text-center">
              <span className="text-[10px] font-[var(--font-display)] uppercase tracking-widest text-white/40 leading-tight">{step.label}</span>
              <span className="font-[var(--font-data)] text-3xl font-bold text-shogun-text-primary">{fmtNum(step.value)}</span>
              <span className="text-[10px] font-[var(--font-display)] text-white/30">{step.sub}</span>
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

export function GenderDonut({ genderStats }: { genderStats: MetricasGender[] }) {
  const total = genderStats.reduce((s, g) => s + g.purchases, 0)
  const data = genderStats.map((g) => ({
    name: g.gender === "male" ? "Homens" : "Mulheres",
    value: g.purchases,
    gender: g.gender,
  }))

  if (data.length === 0) {
    return <p className="text-white/40 text-sm font-[var(--font-display)] text-center mt-8">Sem dados de público disponíveis</p>
  }

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
      <div className="relative w-full">
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Info size={14} className="text-white/20" />
        </div>
      </div>
    </div>
  )
}
