"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, Users, Building2, Hash } from "lucide-react"
import { ShogunCard } from "@/components/ui/ShogunCard"

interface UserRow {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  client: {
    id: string
    business_name: string
    cnpj: string | null
    meta_account_id: string | null
    active: boolean
  } | null
}

interface CreateForm {
  email: string
  password: string
  full_name: string
  business_name: string
  cnpj: string
  meta_account_id: string
}

const EMPTY_FORM: CreateForm = {
  email: "",
  password: "",
  full_name: "",
  business_name: "",
  cnpj: "",
  meta_account_id: "",
}

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

export default function UsuariosPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Verifica se o usuário logado é admin
  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile?.role !== "admin") {
        router.replace("/metricas")
      }
    }

    checkAdmin()
  }, [router])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      if (!res.ok) throw new Error((await res.json()).error)
      setUsers(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cnpj: form.cnpj.replace(/\D/g, ""), // salva só os dígitos
        }),
      })

      if (!res.ok) throw new Error((await res.json()).error)

      setForm(EMPTY_FORM)
      setShowForm(false)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar usuário")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Deseja realmente remover este usuário?")) return
    setDeleteId(userId)
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover usuário")
    } finally {
      setDeleteId(null)
    }
  }

  const inputCls =
    "w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-sm text-shogun-text-primary placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors font-[var(--font-display)]"
  const labelCls =
    "block text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider mb-1"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-shogun-accent" />
          <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">
            Usuários
          </h1>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setError(null)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-shogun-accent text-shogun-bg-base rounded text-sm font-[var(--font-display)] font-semibold hover:bg-shogun-accent/90 transition-colors"
        >
          <Plus size={16} />
          Criar usuário
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-shogun-danger/10 border border-shogun-danger/30 rounded text-sm text-shogun-danger font-[var(--font-display)]">
          {error}
        </div>
      )}

      {/* Formulário de criação */}
      {showForm && (
        <ShogunCard>
          <h2 className="text-base font-[var(--font-display)] font-semibold text-shogun-text-primary mb-5">
            Novo usuário
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>E-mail (login) *</label>
                <input
                  type="email"
                  required
                  placeholder="cliente@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Senha *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Nome completo</label>
                <input
                  type="text"
                  placeholder="João Silva"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Nome da empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome igual ao Google Sheets"
                  value={form.business_name}
                  onChange={(e) =>
                    setForm({ ...form, business_name: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>CNPJ</label>
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={(e) =>
                    setForm({ ...form, cnpj: formatCnpj(e.target.value) })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>ID da conta de anúncios (Meta)</label>
                <input
                  type="text"
                  placeholder="act_000000000"
                  value={form.meta_account_id}
                  onChange={(e) =>
                    setForm({ ...form, meta_account_id: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-shogun-accent text-shogun-bg-base rounded text-sm font-[var(--font-display)] font-semibold hover:bg-shogun-accent/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Criando…" : "Criar usuário"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setForm(EMPTY_FORM)
                  setError(null)
                }}
                className="px-5 py-2 border border-shogun-border rounded text-sm font-[var(--font-display)] text-shogun-text-secondary hover:text-shogun-text-primary transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </ShogunCard>
      )}

      {/* Tabela de usuários */}
      <ShogunCard className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-shogun-accent" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-shogun-text-secondary text-sm font-[var(--font-display)]">
            Nenhum usuário cadastrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-shogun-bg-base border-b border-shogun-border">
                  {["Nome", "E-mail", "Empresa", "CNPJ", "Conta Meta", "Perfil", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr
                    key={user.id}
                    className={
                      i % 2 === 0
                        ? "bg-shogun-bg-surface border-b border-shogun-border/50"
                        : "bg-shogun-bg-base border-b border-shogun-border/50"
                    }
                  >
                    <td className="px-4 py-3 text-sm text-shogun-text-primary font-[var(--font-display)]">
                      {user.full_name ?? <span className="text-shogun-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-shogun-text-secondary font-[var(--font-display)]">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-shogun-text-primary font-[var(--font-display)]">
                      {user.client ? (
                        <span className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-shogun-text-muted shrink-0" />
                          {user.client.business_name}
                        </span>
                      ) : (
                        <span className="text-shogun-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-shogun-text-secondary font-[var(--font-display)]">
                      {user.client?.cnpj ? (
                        <span className="flex items-center gap-1.5">
                          <Hash size={12} className="text-shogun-text-muted shrink-0" />
                          {user.client.cnpj.replace(
                            /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                            "$1.$2.$3/$4-$5"
                          )}
                        </span>
                      ) : (
                        <span className="text-shogun-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-shogun-text-secondary font-[var(--font-display)]">
                      {user.client?.meta_account_id ?? (
                        <span className="text-shogun-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-[var(--font-display)] font-medium ${
                          user.role === "admin"
                            ? "bg-shogun-accent/20 text-shogun-accent"
                            : user.role === "gestor"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-shogun-border text-shogun-text-secondary"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.role !== "admin" && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deleteId === user.id}
                          className="p-1.5 text-shogun-text-muted hover:text-shogun-danger transition-colors disabled:opacity-40"
                          title="Remover usuário"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ShogunCard>
    </div>
  )
}
