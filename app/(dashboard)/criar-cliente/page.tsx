"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface MetaAccount {
  meta_account_id: string
  clients: string[]
}

export default function CriarClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [formData, setFormData] = useState({
    business_name: "",
    meta_account_id: "",
    meta_access_token: ""
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [availableAccounts, setAvailableAccounts] = useState<MetaAccount[]>([])

  useEffect(() => {
    fetchAvailableAccounts()
  }, [])

  const fetchAvailableAccounts = async () => {
    setLoadingAccounts(true)
    try {
      const response = await fetch("/api/meta/available-accounts")
      const data = await response.json()
      
      if (response.ok) {
        setAvailableAccounts(data)
      }
    } catch (error) {
      console.error("Erro ao buscar contas disponíveis:", error)
    } finally {
      setLoadingAccounts(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar cliente")
      }

      setSuccess("Cliente criado com sucesso!")
      setFormData({
        business_name: "",
        meta_account_id: "",
        meta_access_token: ""
      })

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push("/metas")
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar cliente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">
          Criar Novo Cliente
        </h1>
        <p className="text-shogun-text-secondary mt-2">
          Preencha os dados para criar um novo cliente e testar as metas
        </p>
      </div>

      <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-[var(--font-display)] font-semibold text-shogun-text-secondary mb-2">
              Nome do Cliente *
            </label>
            <input
              type="text"
              required
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-shogun-text-primary focus:outline-none focus:border-shogun-accent"
              placeholder="Nome da empresa"
            />
          </div>

          <div>
            <label className="block text-sm font-[var(--font-display)] font-semibold text-shogun-text-secondary mb-2">
              Conta Meta (opcional)
            </label>
            {loadingAccounts ? (
              <div className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-shogun-text-muted">
                Carregando contas...
              </div>
            ) : availableAccounts.length > 0 ? (
              <select
                value={formData.meta_account_id}
                onChange={(e) => setFormData({ ...formData, meta_account_id: e.target.value })}
                className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-shogun-text-primary focus:outline-none focus:border-shogun-accent font-mono text-sm"
              >
                <option value="">Selecione uma conta...</option>
                {availableAccounts.map((account) => (
                  <option key={account.meta_account_id} value={account.meta_account_id}>
                    {account.meta_account_id} 
                    {account.clients.length > 0 && ` (usado por: ${account.clients.join(", ")})`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2">
                <input
                  type="text"
                  value={formData.meta_account_id}
                  onChange={(e) => setFormData({ ...formData, meta_account_id: e.target.value })}
                  className="w-full bg-transparent border-none outline-none text-shogun-text-primary font-mono text-sm placeholder:text-shogun-text-muted"
                  placeholder="act_123456789"
                />
                <p className="text-xs text-shogun-text-muted mt-1">
                  Nenhuma conta Meta disponível no sistema
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-[var(--font-display)] font-semibold text-shogun-text-secondary mb-2">
              Token de Acesso Meta (opcional)
            </label>
            <input
              type="password"
              value={formData.meta_access_token}
              onChange={(e) => setFormData({ ...formData, meta_access_token: e.target.value })}
              className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-shogun-text-primary focus:outline-none focus:border-shogun-accent font-mono text-sm"
              placeholder="Token de acesso"
            />
          </div>

          
          {error && (
            <div className="p-3 bg-shogun-danger/10 border border-shogun-danger/20 rounded">
              <p className="text-sm text-shogun-danger">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-shogun-success/10 border border-shogun-success/20 rounded">
              <p className="text-sm text-shogun-success">{success}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-shogun-accent hover:bg-shogun-accent-muted text-shogun-bg-base font-[var(--font-display)] font-semibold px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar Cliente"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/metas")}
              className="px-4 py-2 border border-shogun-border text-shogun-text-primary hover:bg-shogun-bg-base rounded transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 p-4 bg-shogun-bg-base border border-shogun-border rounded">
        <h3 className="text-sm font-[var(--font-display)] font-semibold text-shogun-text-primary mb-2">
          📋 Como testar:
        </h3>
        <ol className="text-sm text-shogun-text-secondary space-y-1 list-decimal list-inside">
          <li>Preencha apenas o nome do cliente (ex: "Hibiscus Gastronomia")</li>
          <li>Crie um arquivo Excel com o mesmo nome na pasta do Google Drive</li>
          <li>Na planilha, crie uma aba "Metas" com os dados</li>
          <li>Após criar, acesse /metas para visualizar</li>
        </ol>
      </div>
    </div>
  )
}
