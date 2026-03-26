"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { ClientOption } from "@/types/app"

interface ClientContextValue {
  selectedClientId: string | null
  setSelectedClientId: (id: string | null) => void
  clients: ClientOption[]
  setClients: (clients: ClientOption[]) => void
}

const ClientContext = createContext<ClientContextValue | null>(null)

export function ClientProvider({ children }: { children: ReactNode }) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [clients, setClients] = useState<ClientOption[]>([])

  return (
    <ClientContext.Provider
      value={{ selectedClientId, setSelectedClientId, clients, setClients }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export function useClientContext() {
  const context = useContext(ClientContext)
  if (!context) {
    throw new Error("useClientContext must be used within a ClientProvider")
  }
  return context
}
