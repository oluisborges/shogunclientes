"use client"

import { useState, useEffect } from "react"
import { Building2, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react"

interface ClientAccess {
  id: string
  client_id: string
  business_name: string
  meta_account_id: string | null
  access_level: string
  is_owner: boolean
}

export default function ContasPage() {
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<ClientAccess[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/profile/accounts")
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
      } else {
        setError("Erro ao carregar contas")
      }
    } catch (err) {
      setError("Erro ao carregar contas")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-shogun-bg-elevated rounded w-64" />
          <div className="h-24 bg-shogun-bg-elevated rounded" />
          <div className="h-24 bg-shogun-bg-elevated rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">
          Contas de Anúncio
        </h1>
      </div>

      <p className="text-sm text-shogun-text-secondary mb-6">
        Gerencie as contas de anúncio que você tem acesso. Você pode visualizar o dashboard, campanhas e metas de todas as contas listadas abaixo.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 bg-shogun-danger/10 border border-shogun-danger/30 rounded text-sm text-shogun-danger font-[var(--font-display)] flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="space-y-3">
        {accounts.length === 0 ? (
          <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-8 text-center">
            <Building2 size={40} className="mx-auto text-shogun-text-muted mb-3" />
            <p className="text-shogun-text-secondary font-[var(--font-display)]">
              Nenhuma conta de anúncio vinculada
            </p>
            <p className="text-sm text-shogun-text-muted mt-1">
              Entre em contato com o administrador para vincular contas ao seu perfil
            </p>
          </div>
        ) : (
          accounts.map((account) => (
            <div
              key={account.client_id}
              className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-shogun-accent/10 flex items-center justify-center">
                  <Building2 size={20} className="text-shogun-accent" />
                </div>
                <div>
                  <h3 className="font-[var(--font-display)] font-semibold text-shogun-text-primary">
                    {account.business_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {account.meta_account_id && (
                      <span className="text-xs text-shogun-text-muted font-mono">
                        ID: {account.meta_account_id}
                      </span>
                    )}
                    {account.is_owner && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-shogun-accent/15 text-shogun-accent font-[var(--font-display)]">
                        Proprietário
                      </span>
                    )}
                    {!account.is_owner && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-[var(--font-display)]">
                        {account.access_level === "admin" ? "Admin" : 
                         account.access_level === "editor" ? "Editor" : "Visualizador"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-xs text-green-500 font-[var(--font-display)]">Ativo</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-shogun-bg-base border border-shogun-border rounded-lg">
        <p className="text-xs text-shogun-text-muted">
          <strong className="text-shogun-text-secondary">Precisa de acesso a mais contas?</strong>
          <br />
          Entre em contato com o administrador do sistema para solicitar acesso a outras contas de anúncio.
        </p>
      </div>
    </div>
  )
}
