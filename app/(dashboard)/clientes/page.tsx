"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Save, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Client {
  id: string
  business_name: string
  meta_account_id?: string
  meta_access_token?: string
  google_sheets_url?: string
  google_sheets_range?: string
  created_at: string
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [editingClient, setEditingClient] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    business_name: "",
    meta_account_id: "",
    meta_access_token: "",
    google_sheets_url: "",
    google_sheets_range: "Metas!A:F"
  })

  const supabase = createClient()

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("business_name")

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("Erro ao buscar clientes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const clientData = {
        business_name: formData.business_name,
        meta_account_id: formData.meta_account_id || null,
        meta_access_token: formData.meta_access_token || null,
        google_sheets_url: formData.google_sheets_url || null,
        google_sheets_range: formData.google_sheets_range || null
      }

      if (editingClient) {
        const { error } = await supabase
          .from("clients")
          .update(clientData)
          .eq("id", editingClient)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("clients")
          .insert(clientData)

        if (error) throw error
      }

      await fetchClients()
      resetForm()
    } catch (error) {
      console.error("Erro ao salvar cliente:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client.id)
    setFormData({
      business_name: client.business_name,
      meta_account_id: client.meta_account_id || "",
      meta_access_token: client.meta_access_token || "",
      google_sheets_url: client.google_sheets_url || "",
      google_sheets_range: client.google_sheets_range || "Metas!A:F"
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return

    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id)

      if (error) throw error
      await fetchClients()
    } catch (error) {
      console.error("Erro ao excluir cliente:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      business_name: "",
      meta_account_id: "",
      meta_access_token: "",
      google_sheets_url: "",
      google_sheets_range: "Metas!A:F"
    })
    setEditingClient(null)
    setShowForm(false)
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">
          Clientes
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-shogun-accent hover:bg-shogun-accent-muted text-shogun-bg-base font-[var(--font-display)] font-semibold px-4 py-2 rounded transition-colors"
        >
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      {showForm && (
        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary">
              {editingClient ? "Editar Cliente" : "Novo Cliente"}
            </h2>
            <button
              onClick={resetForm}
              className="text-shogun-text-secondary hover:text-shogun-text-primary"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  ID da Conta Meta
                </label>
                <input
                  type="text"
                  value={formData.meta_account_id}
                  onChange={(e) => setFormData({ ...formData, meta_account_id: e.target.value })}
                  className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-shogun-text-primary focus:outline-none focus:border-shogun-accent font-mono text-sm"
                  placeholder="act_123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-[var(--font-display)] font-semibold text-shogun-text-secondary mb-2">
                  Token de Acesso Meta
                </label>
                <input
                  type="password"
                  value={formData.meta_access_token}
                  onChange={(e) => setFormData({ ...formData, meta_access_token: e.target.value })}
                  className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-shogun-text-primary focus:outline-none focus:border-shogun-accent font-mono text-sm"
                  placeholder="Token de acesso"
                />
              </div>

            <div>
              <label className="block text-sm font-[var(--font-display)] font-semibold text-shogun-text-secondary mb-2">
                Range da Planilha
              </label>
              <input
                type="text"
                value={formData.google_sheets_range}
                onChange={(e) => setFormData({ ...formData, google_sheets_range: e.target.value })}
                className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-shogun-text-primary focus:outline-none focus:border-shogun-accent font-mono text-sm"
                placeholder="Metas!A:F"
              />
              <p className="text-xs text-shogun-text-muted mt-1">
                O sistema buscará o arquivo pelo nome do cliente na pasta global
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-shogun-accent hover:bg-shogun-accent-muted text-shogun-bg-base font-[var(--font-display)] font-semibold px-4 py-2 rounded transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {loading ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-shogun-border text-shogun-text-primary hover:bg-shogun-bg-base rounded transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg overflow-hidden">
        {loading && clients.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shogun-accent"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-shogun-text-secondary">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-shogun-bg-base border-b border-shogun-border">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-[var(--font-display)] font-semibold text-shogun-text-secondary uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-[var(--font-display)] font-semibold text-shogun-text-secondary uppercase tracking-wider">
                    Conta Meta
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-[var(--font-display)] font-semibold text-shogun-text-secondary uppercase tracking-wider">
                    Planilha
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-[var(--font-display)] font-semibold text-shogun-text-secondary uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-[var(--font-display)] font-semibold text-shogun-text-secondary uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-shogun-border/50 hover:bg-shogun-bg-base/50">
                    <td className="py-3 px-4">
                      <div className="text-sm font-[var(--font-display)] text-shogun-text-primary">
                        {client.business_name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-mono text-shogun-text-secondary">
                        {client.meta_account_id || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-shogun-text-secondary truncate max-w-xs">
                        {client.google_sheets_url ? "Configurada" : "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-shogun-text-secondary">
                        {new Date(client.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-1 text-shogun-text-secondary hover:text-shogun-accent transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-1 text-shogun-text-secondary hover:text-shogun-danger transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
