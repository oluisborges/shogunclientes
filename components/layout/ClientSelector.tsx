"use client"

import { useEffect } from "react"
import { ChevronDown, Building2 } from "lucide-react"
import { useClientContext } from "@/lib/hooks/useClientContext"
import { createClient } from "@/lib/supabase/client"

export function ClientSelector() {
  const { selectedClientId, setSelectedClientId, clients, setClients } =
    useClientContext()

  useEffect(() => {
    async function loadClients() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("clients")
        .select("id, business_name, meta_account_id")
        .eq("active", true)
        .order("business_name")

      if (data && data.length > 0) {
        setClients(data)
        if (!selectedClientId) {
          setSelectedClientId(data[0].id)
        }
      }
    }

    loadClients()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  return (
    <div className="relative">
      <button className="flex items-center gap-2 bg-shogun-bg-elevated border border-shogun-border rounded px-3 py-2 text-sm font-[var(--font-display)] text-shogun-text-primary hover:border-shogun-text-muted transition-colors min-w-[200px]">
        <Building2 size={16} className="text-shogun-text-secondary shrink-0" />
        <span className="truncate flex-1 text-left">
          {selectedClient?.business_name ?? "Selecionar cliente"}
        </span>
        <ChevronDown size={14} className="text-shogun-text-secondary shrink-0" />
      </button>

      <select
        value={selectedClientId ?? ""}
        onChange={(e) => setSelectedClientId(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full"
      >
        {clients.length === 0 && (
          <option value="">Nenhum cliente encontrado</option>
        )}
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.business_name}
          </option>
        ))}
      </select>
    </div>
  )
}
