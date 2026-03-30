"use client"

import { useState, useEffect } from "react"
import { Users, Building2, Plus, Trash2, Shield, Edit, Eye, AlertCircle, CheckCircle } from "lucide-react"

interface UserAccess {
  id: string
  user_id: string
  client_id: string
  access_level: string
  created_at: string
  user: {
    email: string
    full_name: string | null
  }
  client: {
    business_name: string
    meta_account_id: string | null
  }
}

export default function GerenciarContasPage() {
  const [loading, setLoading] = useState(true)
  const [accessList, setAccessList] = useState<UserAccess[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form for new access
  const [newAccess, setNewAccess] = useState({
    user_email: "",
    client_business_name: "",
    access_level: "viewer"
  })

  useEffect(() => {
    loadAccessList()
  }, [])

  const loadAccessList = async () => {
    try {
      const res = await fetch("/api/admin/client-access")
      if (res.ok) {
        const data = await res.json()
        setAccessList(data)
      } else {
        setError("Erro ao carregar acessos")
      }
    } catch (err) {
      setError("Erro ao carregar acessos")
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccess = async () => {
    setError(null)
    setSuccess(null)

    if (!newAccess.user_email || !newAccess.client_business_name) {
      setError("Preencha todos os campos")
      return
    }

    try {
      const res = await fetch("/api/admin/client-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccess),
      })

      if (res.ok) {
        setSuccess("Acesso concedido com sucesso!")
        setShowAddModal(false)
        setNewAccess({ user_email: "", client_business_name: "", access_level: "viewer" })
        loadAccessList()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || "Erro ao conceder acesso")
      }
    } catch (err) {
      setError("Erro ao conceder acesso")
    }
  }

  const handleRemoveAccess = async (accessId: string) => {
    setError(null)
    setSuccess(null)
    setDeletingId(accessId)

    try {
      const res = await fetch(`/api/admin/client-access?id=${accessId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setSuccess("Acesso removido com sucesso!")
        loadAccessList()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || "Erro ao remover acesso")
      }
    } catch (err) {
      setError("Erro ao remover acesso")
    } finally {
      setDeletingId(null)
    }
  }

  const getAccessIcon = (level: string) => {
    switch (level) {
      case "admin": return <Shield size={16} className="text-red-400" />
      case "editor": return <Edit size={16} className="text-blue-400" />
      default: return <Eye size={16} className="text-green-400" />
    }
  }

  const getAccessLabel = (level: string) => {
    switch (level) {
      case "admin": return "Admin"
      case "editor": return "Editor"
      default: return "Visualizador"
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-shogun-bg-elevated rounded w-64" />
          <div className="h-32 bg-shogun-bg-elevated rounded" />
          <div className="h-32 bg-shogun-bg-elevated rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">
          Gerenciar Acessos às Contas
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-shogun-accent hover:bg-shogun-accent/90 text-shogun-bg-base font-[var(--font-display)] font-semibold px-4 py-2 rounded transition-colors"
        >
          <Plus size={18} />
          Conceder Acesso
        </button>
      </div>

      <p className="text-sm text-shogun-text-secondary mb-6">
        Gerencie quais usuários têm acesso a quais contas de anúncio. Usuários podem visualizar o dashboard, campanhas e metas das contas que têm acesso.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 bg-shogun-danger/10 border border-shogun-danger/30 rounded text-sm text-shogun-danger font-[var(--font-display)] flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded text-sm text-green-500 font-[var(--font-display)] flex items-center gap-2">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-shogun-bg-base">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">
                  Conta de Anúncio
                </th>
                <th className="px-4 py-3 text-left text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">
                  Nível de Acesso
                </th>
                <th className="px-4 py-3 text-left text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">
                  Concedido em
                </th>
                <th className="px-4 py-3 text-right text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-shogun-border">
              {accessList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-shogun-text-muted">
                    <Users size={40} className="mx-auto mb-2 opacity-50" />
                    <p className="font-[var(--font-display)]">Nenhum acesso encontrado</p>
                    <p className="text-xs mt-1">Clique em "Conceder Acesso" para adicionar</p>
                  </td>
                </tr>
              ) : (
                accessList.map((access) => (
                  <tr key={access.id} className="hover:bg-shogun-bg-base/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-[var(--font-display)] text-shogun-text-primary">
                          {access.user.full_name || access.user.email}
                        </p>
                        <p className="text-xs text-shogun-text-muted">{access.user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-shogun-text-muted" />
                        <div>
                          <p className="font-[var(--font-display)] text-shogun-text-primary">
                            {access.client.business_name}
                          </p>
                          {access.client.meta_account_id && (
                            <p className="text-xs text-shogun-text-muted font-mono">
                              ID: {access.client.meta_account_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getAccessIcon(access.access_level)}
                        <span className="text-sm font-[var(--font-display)] text-shogun-text-primary">
                          {getAccessLabel(access.access_level)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-shogun-text-secondary">
                        {new Date(access.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveAccess(access.id)}
                        disabled={deletingId === access.id}
                        className="text-shogun-danger hover:text-shogun-danger/80 transition-colors disabled:opacity-50"
                      >
                        {deletingId === access.id ? (
                          <div className="animate-spin w-4 h-4 border border-shogun-danger/30 border-t-shogun-danger rounded-full" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Adicionar Acesso */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
            <h2 className="text-lg font-[var(--font-display)] font-bold text-shogun-text-primary mb-4">
              Conceder Acesso à Conta
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-[var(--font-display)] text-shogun-text-secondary mb-1">
                  E-mail do Usuário
                </label>
                <input
                  type="email"
                  value={newAccess.user_email}
                  onChange={(e) => setNewAccess({ ...newAccess, user_email: e.target.value })}
                  className="w-full bg-shogun-bg-base border border-shogun-border rounded px-4 py-3 text-shogun-text-primary text-sm placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors"
                  placeholder="usuario@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-[var(--font-display)] text-shogun-text-secondary mb-1">
                  Nome da Conta
                </label>
                <input
                  type="text"
                  value={newAccess.client_business_name}
                  onChange={(e) => setNewAccess({ ...newAccess, client_business_name: e.target.value })}
                  className="w-full bg-shogun-bg-base border border-shogun-border rounded px-4 py-3 text-shogun-text-primary text-sm placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors"
                  placeholder="Nome da Empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-[var(--font-display)] text-shogun-text-secondary mb-1">
                  Nível de Acesso
                </label>
                <select
                  value={newAccess.access_level}
                  onChange={(e) => setNewAccess({ ...newAccess, access_level: e.target.value })}
                  className="w-full bg-shogun-bg-base border border-shogun-border rounded px-4 py-3 text-shogun-text-primary text-sm focus:outline-none focus:border-shogun-accent transition-colors"
                >
                  <option value="viewer">Visualizador (somente leitura)</option>
                  <option value="editor">Editor (pode editar)</option>
                  <option value="admin">Admin (acesso total)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddAccess}
                className="flex-1 bg-shogun-accent hover:bg-shogun-accent/90 text-shogun-bg-base font-[var(--font-display)] font-semibold px-4 py-2.5 rounded transition-colors"
              >
                Conceder Acesso
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewAccess({ user_email: "", client_business_name: "", access_level: "viewer" })
                }}
                className="flex-1 bg-shogun-bg-base hover:bg-shogun-bg-base/80 text-shogun-text-primary font-[var(--font-display)] font-semibold px-4 py-2.5 rounded transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
