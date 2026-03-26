"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface CampanhaFiltersProps {
  onSearchChange: (value: string) => void
  onStatusFilter: (status: string | null) => void
  activeStatus: string | null
}

const STATUS_OPTIONS = [
  { value: null, label: "Todos" },
  { value: "ACTIVE", label: "Ativos" },
  { value: "PAUSED", label: "Pausados" },
]

export function CampanhaFilters({
  onSearchChange,
  onStatusFilter,
  activeStatus,
}: CampanhaFiltersProps) {
  const [search, setSearch] = useState("")

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value ?? "all"}
            onClick={() => onStatusFilter(opt.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-[var(--font-display)] font-medium rounded transition-colors",
              activeStatus === opt.value
                ? "bg-shogun-accent/12 text-shogun-accent"
                : "bg-shogun-bg-elevated text-shogun-text-secondary hover:text-shogun-text-primary"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="relative ml-auto">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-shogun-text-muted"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            onSearchChange(e.target.value)
          }}
          placeholder="Buscar campanha..."
          className="bg-shogun-bg-elevated border border-shogun-border rounded pl-9 pr-4 py-1.5 text-sm text-shogun-text-primary placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent/50 transition-colors w-64 font-[var(--font-display)]"
        />
      </div>
    </div>
  )
}
