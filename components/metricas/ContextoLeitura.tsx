"use client"

import { useState } from "react"
import { ShogunCard } from "@/components/ui/ShogunCard"
import { SlidersHorizontal, RefreshCw, Building2, Landmark, ChevronDown } from "lucide-react"
import { useClientContext } from "@/lib/hooks/useClientContext"
import { cn } from "@/lib/utils"

const PERIODS = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "month", label: "Mês" },
  { key: "custom", label: "Personalizado" },
  { key: "more", label: "Mais períodos" },
]

export function ContextoLeitura() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const { clients, selectedClientId, setSelectedClientId } = useClientContext()
  const selectedClient = clients.find((c) => c.id === selectedClientId)

  return (
    <ShogunCard>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-shogun-text-secondary" />
          <h2 className="font-[var(--font-display)] font-semibold text-shogun-text-primary text-base">
            Contexto da leitura
          </h2>
        </div>
        <button className="flex items-center gap-1.5 text-shogun-text-secondary hover:text-shogun-text-primary text-xs font-[var(--font-display)] font-medium transition-colors border border-shogun-border rounded px-3 py-1.5 hover:bg-shogun-bg-elevated">
          <RefreshCw size={12} />
          Atualizar
        </button>
      </div>
      <p className="text-shogun-text-secondary text-xs font-[var(--font-display)] mb-5">
        Escolha empresa, conta e janela de análise antes de comparar resultados.
      </p>

      {/* Dropdowns row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <FilterDropdown
          icon={<Building2 size={14} />}
          label="EMPRESA"
          value={selectedClient?.business_name ?? "Selecionar"}
          options={clients.map((c) => ({ id: c.id, label: c.business_name }))}
          selectedId={selectedClientId}
          onChange={(id) => setSelectedClientId(id)}
        />
        <FilterDropdown
          icon={<Landmark size={14} />}
          label="CONTA BM"
          value={selectedClient?.meta_account_id ?? "Sem conta vinculada"}
          options={[]}
          onChange={() => {}}
        />
      </div>

      {/* Period pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PERIODS.map((period) => (
          <button
            key={period.key}
            onClick={() => setSelectedPeriod(period.key)}
            className={cn(
              "px-3.5 py-1.5 text-xs font-[var(--font-display)] font-medium rounded-full border transition-colors",
              selectedPeriod === period.key
                ? "bg-shogun-accent text-shogun-bg-base border-shogun-accent"
                : "bg-transparent text-shogun-text-secondary border-shogun-border hover:border-shogun-text-muted hover:text-shogun-text-primary"
            )}
          >
            {period.label}
            {period.key === "more" && <ChevronDown size={12} className="inline ml-1 -mt-0.5" />}
          </button>
        ))}
      </div>

      {/* Comparativo note */}
      <div className="bg-shogun-bg-elevated/50 border border-shogun-border/50 rounded px-4 py-3">
        <p className="text-label text-shogun-text-muted mb-1">COMPARATIVO</p>
        <p className="text-shogun-text-secondary text-xs font-[var(--font-display)]">
          A leitura compara o período atual com a janela anterior equivalente.
        </p>
      </div>
    </ShogunCard>
  )
}

function FilterDropdown({
  icon,
  label,
  value,
  options,
  selectedId,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  value: string
  options: Array<{ id: string; label: string }>
  selectedId?: string | null
  onChange: (id: string) => void
}) {
  return (
    <div className="bg-shogun-bg-elevated border border-shogun-border rounded px-4 py-3 relative">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-shogun-accent">{icon}</span>
        <span className="text-[10px] font-[var(--font-display)] font-semibold uppercase tracking-wider text-shogun-accent">
          {label}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-[var(--font-display)] text-sm text-shogun-text-primary">
          {value}
        </span>
        {options.length > 0 && (
          <ChevronDown size={14} className="text-shogun-text-muted" />
        )}
      </div>
      {options.length > 0 && (
        <select
          value={selectedId ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
