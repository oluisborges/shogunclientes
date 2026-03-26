"use client"

import { useClientContext } from "@/lib/hooks/useClientContext"
import { Megaphone, Image, Building2 } from "lucide-react"

export function PerformanceOverview() {
  const { clients, selectedClientId } = useClientContext()
  const selectedClient = clients.find((c) => c.id === selectedClientId)

  return (
    <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-shogun-bg-surface via-shogun-bg-elevated to-shogun-accent-muted/20 border border-shogun-border p-8">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-shogun-accent/5 pointer-events-none" />

      <div className="relative z-10">
        <p className="text-label text-shogun-accent tracking-widest">
          PERFORMANCE OVERVIEW
        </p>
        <h1 className="font-[var(--font-display)] text-2xl md:text-3xl font-bold text-shogun-text-primary mt-3 leading-tight">
          Leitura clara da operação de mídia
        </h1>
        <p className="text-shogun-text-secondary font-[var(--font-display)] text-sm mt-2 max-w-xl">
          Resumo executivo, campanhas e criativos agora ficam separados. Em mobile, cada área virou uma aba.
        </p>

        <div className="flex gap-3 mt-6">
          <InfoPill
            icon={<Building2 size={14} />}
            label="CONTA"
            value={selectedClient?.business_name ?? "—"}
          />
          <InfoPill
            icon={<Megaphone size={14} />}
            label="CAMPANHAS"
            value="—"
          />
          <InfoPill
            icon={<Image size={14} />}
            label="CRIATIVOS"
            value="—"
          />
        </div>
      </div>
    </div>
  )
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-shogun-bg-base/60 backdrop-blur-sm border border-shogun-border/50 rounded px-4 py-2.5 min-w-[160px]">
      <div className="flex items-center gap-1.5 text-shogun-text-muted mb-1">
        {icon}
        <span className="text-[10px] font-[var(--font-display)] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="font-[var(--font-data)] text-sm text-shogun-text-primary font-medium">
        {value}
      </p>
    </div>
  )
}
