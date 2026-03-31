"use client"

import React from "react"
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { ArrowRight, Info } from "lucide-react"
import { fmtNum, fmtBRLFull, fmtPct } from "@/lib/format"
import type { MetricasGender, MetricasPeriod, MetricasDaily, MetricasAge } from "@/lib/hooks/useMetricas"

// ─── Daily line chart ─────────────────────────────────────────────────────────

export function DailyChart({ dailyData }: { dailyData: MetricasDaily[] }) {
  if (!dailyData.length) {
    return <p className="text-white/40 text-sm font-[var(--font-display)] text-center py-8">Sem dados diários disponíveis</p>
  }

  // Verificar se os dados estão atualizados até hoje
  const today = new Date().toISOString().split('T')[0]
  const lastDataDate = dailyData[dailyData.length - 1]?.date
  const isDataStale = lastDataDate && lastDataDate < today
  
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
      {/* Aviso sobre dados desatualizados do Meta */}
      {isDataStale && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <Info size={16} className="text-yellow-500" />
          <div className="flex-1">
            <p className="text-xs font-[var(--font-display)] text-yellow-500">
              <span className="font-semibold">Atenção:</span> Dados do Meta atualizados até {lastDataDate?.split('-').reverse().join('/')}. 
              O Meta pode levar até 48h para atualizar dados dos dias mais recentes.
            </p>
          </div>
        </div>
      )}

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
        <span className="text-xs font-[var(--font-display)] text-white/35 ml-1">· evolução diária dos resultados</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart 
          data={dailyData} 
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-shogun-border)" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate} 
            tick={{ fill: "var(--color-shogun-text-secondary)", fontSize: 11, fontFamily: "var(--font-display)" }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis yAxisId="left" orientation="left" tick={{ fill: "var(--color-shogun-text-secondary)", fontSize: 11, fontFamily: "var(--font-display)" }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={32} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--color-shogun-text-secondary)", fontSize: 11, fontFamily: "var(--font-display)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${fmtNum(v)}`} width={52} />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            yAxisId="left" 
            type="linear" 
            dataKey="purchases" 
            name="Pedidos" 
            stroke="#95D600" 
            strokeWidth={2} 
            connectNulls={false}
          />
          <Line 
            yAxisId="right" 
            type="linear" 
            dataKey="purchaseValue" 
            name="Receita gerada" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            connectNulls={false}
          />
          <Line 
            yAxisId="right" 
            type="linear" 
            dataKey="spend" 
            name="Investimento" 
            stroke="#f59e0b" 
            strokeWidth={2} 
            connectNulls={false}
          />
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
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: item.color }} />
            <span className="text-xs font-[var(--font-display)] text-white/50">{item.label}</span>
          </div>
        ))}
        <span className="text-xs font-[var(--font-display)] text-white/35 ml-1">· taxa de compra (conversão)</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-shogun-border)" vertical={false} />
          <XAxis dataKey="age" tick={{ fill: "var(--color-shogun-text-secondary)", fontSize: 11, fontFamily: "var(--font-display)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--color-shogun-text-secondary)", fontSize: 11, fontFamily: "var(--font-display)" }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={36} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-shogun-border)" }} />
          <Bar dataKey="purchases" name="Compras" fill="#95D600" radius={[4, 4, 0, 0]} />
          <Bar dataKey="lpViews" name="Visualização de Cardápio" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Gender donut chart ────────────────────────────────────────────────────────

export function GenderDonut({ genderStats }: { genderStats: MetricasGender[] }) {
  if (!genderStats.length) {
    return <p className="text-white/40 text-sm font-[var(--font-display)] text-center py-8">Sem dados de gênero disponíveis</p>
  }

  const chartData = genderStats.map((g) => ({
    name: g.gender === "male" ? "HOMENS" : g.gender === "female" ? "MULHERES" : "Outro",
    value: g.purchases,
    purchases: g.purchases,
    purchaseValue: g.purchaseValue,
    lpViews: g.lpViews,
  }))

  const totalPurchases = chartData.reduce((sum, item) => sum + item.purchases, 0)

  const GENDER_COLORS = {
    "MULHERES": "#ec4899",
    "HOMENS": "#3b82f6",
    "Outro": "#f59e0b",
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: any; color: string; name: string }> }) => {
    if (!active || !payload?.length) return null
    const entry = payload[0].payload
    const percentage = totalPurchases > 0 ? ((entry.purchases / totalPurchases) * 100).toFixed(0) : "0"
    const ticketMedio = entry.purchases > 0 ? (entry.purchaseValue / entry.purchases) : 0
    return (
      <div className="bg-shogun-bg-base border border-shogun-border rounded-lg px-3 py-2 font-[var(--font-display)] space-y-1 min-w-[180px]">
        <p className="text-white/40 text-xs mb-1.5">{entry.name}</p>
        <p style={{ color: payload[0].color }} className="font-[var(--font-data)] font-semibold text-xl">
          {fmtNum(entry.purchases)}
        </p>
        <p className="text-xs font-[var(--font-display)] text-white/50">
          {percentage}% das compras
        </p>
        <p className="text-xs font-[var(--font-display)] text-white/50 pt-1 border-t border-white/10">
          Receita: {fmtBRLFull(entry.purchaseValue)}
        </p>
        <p className="text-xs font-[var(--font-display)] text-white/50">
          Ticket médio: <span className="text-shogun-accent font-semibold">{fmtBRLFull(ticketMedio)}</span>
        </p>
        <p className="text-xs font-[var(--font-display)] text-white/50">
          Taxa de compra: <span className="text-shogun-accent font-semibold">
            {entry.lpViews > 0 ? ((entry.purchases / entry.lpViews) * 100).toFixed(1) : "0"}%
          </span>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Números em destaque acima do gráfico - sem ticket médio */}
      <div className="flex items-center justify-center gap-8 mb-6">
        {chartData.filter(g => g.name !== "Outro").map((g) => {
          const percentage = totalPurchases > 0 ? ((g.purchases / totalPurchases) * 100).toFixed(0) : "0"
          return (
            <div key={g.name} className="text-center">
              <div className="flex items-center gap-2 mb-1 justify-center">
                {g.name === "MULHERES" ? (
                  <span style={{ background: '#ec4899' }} className="inline-block w-3 h-3 rounded-full" />
                ) : (
                  <span style={{ background: '#3b82f6' }} className="inline-block w-3 h-3 rounded-full" />
                )}
                <span className="text-xs font-[var(--font-display)] text-white/60 uppercase tracking-wide">{g.name}</span>
              </div>
              <div 
                className="text-4xl font-[var(--font-data)] font-bold" 
                style={{ color: GENDER_COLORS[g.name as keyof typeof GENDER_COLORS] }}
              >
                {fmtNum(g.purchases)}
              </div>
              <div className="text-xs font-[var(--font-display)] text-white/50 mt-1">
                {percentage}% das compras
              </div>
            </div>
          )
        })}
      </div>

      {/* Gráfico donut */}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.name as keyof typeof GENDER_COLORS]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Performance funnel ─────────────────────────────────────────────────────

export function PerformanceFunnel({ current, previous }: { current: MetricasPeriod; previous: MetricasPeriod }) {
  const steps = [
    { name: "Alcance", value: current.reach, color: "border-blue-500 bg-blue-500/10" },
    { name: "Visualização", value: current.lpViews, color: "border-purple-500 bg-purple-500/10" },
    { name: "Compras", value: current.purchases, color: "border-green-500 bg-green-500/10" },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Container principal alinhado - responsivo */}
      <div className="relative">
        {/* Linha de fundo conectando os cards - escondida em mobile */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-shogun-border/30 -translate-y-1/2 z-0" />
        
        {/* Cards e setas alinhados - responsivo */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 lg:gap-12">
          {steps.map((step, i) => {
            const conversionRate = i < steps.length - 1 && step.value > 0 
              ? ((steps[i + 1].value / step.value) * 100).toFixed(1)
              : null

            return (
              <React.Fragment key={step.name}>
                {/* Card da etapa - responsivo */}
                <div className="flex flex-col items-center w-full md:w-auto">
                  <div className={`relative p-4 md:p-6 rounded-xl border-2 ${step.color} bg-shogun-bg-elevated w-full md:min-w-[120px] md:max-w-[140px] lg:min-w-[140px] lg:max-w-[160px] shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-[var(--font-data)] font-bold text-white mb-1 md:mb-2">
                        {fmtNum(step.value)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Nome da etapa */}
                  <div className="mt-2 md:mt-3 text-center">
                    <div className="text-xs md:text-sm font-[var(--font-display)] text-white/80 font-medium">
                      {step.name}
                    </div>
                  </div>
                </div>

                {/* Seta com taxa de conversão - horizontal em desktop, vertical em mobile */}
                {i < steps.length - 1 && conversionRate && (
                  <div className="flex flex-col items-center py-2 md:py-0">
                    {/* Mobile: seta para baixo */}
                    <div className="md:hidden relative">
                      <svg className="w-6 h-6 text-shogun-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <div className="absolute left-1/2 -translate-x-1/2 mt-1">
                        <div className="bg-shogun-accent text-black px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap">
                          {conversionRate}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop: seta para direita */}
                    <div className="hidden md:block relative">
                      <ArrowRight size={20} className="lg:w-6 lg:h-6 text-shogun-accent" />
                      <div className="absolute -top-5 lg:-top-6 left-1/2 -translate-x-1/2">
                        <div className="bg-shogun-accent text-black px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-xs font-bold shadow-md whitespace-nowrap">
                          {conversionRate}%
                        </div>
                      </div>
                      <div className="absolute -bottom-5 lg:-bottom-6 left-1/2 -translate-x-1/2">
                        <div className="text-xs text-white/40 whitespace-nowrap hidden lg:block">
                          taxa conversão
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
      
      {/* Indicadores visuais do funil - responsivo */}
      <div className="flex justify-center mt-4 md:mt-8">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 lg:gap-8 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#3b82f6' }} />
            <span>Topo do funil</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#a855f7' }} />
            <span>Meio do funil</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
            <span>Fundo do funil</span>
          </div>
        </div>
      </div>
    </div>
  )
}
