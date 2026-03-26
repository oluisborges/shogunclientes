"use client"

import { ShogunCard } from "@/components/ui/ShogunCard"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { GitCompare, Building2, Landmark } from "lucide-react"
import { useClientContext } from "@/lib/hooks/useClientContext"
import { useDateRangeContext } from "@/lib/hooks/useDateRangeContext"
import { cn } from "@/lib/utils"

export function ContextoLeitura() {
  const { 
    dateRange, 
    setDateRange, 
    compareRange, 
    setCompareRange, 
    compareMode, 
    setCompareMode 
  } = useDateRangeContext()
  const { clients, selectedClientId, setSelectedClientId } = useClientContext()
  const selectedClient = clients.find((c) => c.id === selectedClientId)

  return (
    <ShogunCard className="mb-6">
      <div className="flex items-center justify-between gap-6">
        {/* Left: Client Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-3 px-4 py-3 bg-shogun-bg-elevated border border-shogun-border rounded-lg">
            <Building2 size={18} className="text-shogun-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-[var(--font-display)] font-semibold uppercase tracking-wider text-shogun-text-muted mb-0.5">
                Empresa
              </p>
              <p className="font-[var(--font-display)] font-medium text-sm text-shogun-text-primary truncate">
                {selectedClient?.business_name ?? "Selecionar cliente"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 bg-shogun-bg-elevated border border-shogun-border rounded-lg">
            <Landmark size={18} className="text-shogun-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-[var(--font-display)] font-semibold uppercase tracking-wider text-shogun-text-muted mb-0.5">
                Conta BM
              </p>
              <p className="font-[var(--font-display)] font-medium text-sm text-shogun-text-primary truncate">
                {selectedClient?.meta_account_id ?? "Sem conta"}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Date Controls */}
        <div className="flex items-center gap-3">
          <DateRangePicker
            value={dateRange || undefined}
            onChange={(range) => {
              setDateRange(range)
              console.log("Selected range:", range)
            }}
          />

          <button
            onClick={() => setCompareMode(!compareMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg border font-[var(--font-display)] font-medium text-sm transition-all",
              compareMode
                ? "bg-shogun-accent text-shogun-bg-base border-shogun-accent shadow-sm"
                : "bg-shogun-bg-elevated text-shogun-text-secondary border-shogun-border hover:border-shogun-accent hover:text-shogun-accent"
            )}
          >
            <GitCompare size={16} />
            Comparar
          </button>
        </div>
      </div>

      {/* Compare Mode */}
      {compareMode && (
        <div className="mt-4 pt-4 border-t border-shogun-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-shogun-text-secondary text-sm font-[var(--font-display)]">
              <GitCompare size={16} className="text-shogun-accent" />
              <span className="font-medium">Comparar com:</span>
            </div>
            <DateRangePicker
              value={compareRange || undefined}
              onChange={(range) => {
                setCompareRange(range)
                console.log("Compare range:", range)
              }}
            />
          </div>
        </div>
      )}
    </ShogunCard>
  )
}
