"use client"

import { useState, useEffect, useCallback } from "react"
import { useClientContext } from "./useClientContext"
import { createClient } from "@/lib/supabase/client"
import type { SalesHistory } from "@/types/database"

interface UseHistoricoReturn {
  records: SalesHistory[]
  loading: boolean
  error: string | null
  updateRecord: (id: string, field: string, value: string | number | null) => Promise<void>
}

export function useHistorico(): UseHistoricoReturn {
  const { selectedClientId } = useClientContext()
  const [records, setRecords] = useState<SalesHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedClientId) {
      setLoading(false)
      return
    }

    async function fetchData() {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from("sales_history")
        .select("*")
        .eq("client_id", selectedClientId)
        .order("period_start", { ascending: false })

      if (fetchError) {
        setError("Erro ao carregar histórico")
      } else {
        setRecords(data ?? [])
      }
      setLoading(false)
    }

    fetchData()
  }, [selectedClientId])

  const updateRecord = useCallback(
    async (id: string, field: string, value: string | number | null) => {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from("sales_history")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (updateError) {
        setError("Erro ao salvar alteração")
        return
      }

      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      )
    },
    []
  )

  return { records, loading, error, updateRecord }
}
