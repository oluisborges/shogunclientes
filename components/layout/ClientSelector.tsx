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
      try {
        const response = await fetch("/api/clients")
        if (!response.ok) {
          console.error("Erro ao carregar clientes")
          return
        }

        const data = await response.json()

        if (data && data.length > 0) {
          setClients(data)
          if (!selectedClientId) {
            setSelectedClientId(data[0].id)
          }
        }
      } catch (error) {
        console.error("Erro ao buscar clientes:", error)
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
        className="absolute inset-0 cursor-pointer w-full opacity-0"
        style={{ 
          opacity: 0,
          color: 'rgb(var(--shogun-text-primary))',
          backgroundColor: 'rgb(var(--shogun-bg-elevated))'
        }}
      >
        {clients.length === 0 && (
          <option value="" className="bg-shogun-bg-elevated text-shogun-text-primary">
            Nenhum cliente encontrado
          </option>
        )}
        {clients.map((client) => (
          <option 
            key={client.id} 
            value={client.id}
            className="bg-shogun-bg-elevated text-shogun-text-primary"
          >
            {client.business_name}
            {client.meta_account_id && ` - ID: ${client.meta_account_id}`}
          </option>
        ))}
      </select>
    </div>
  )
}
