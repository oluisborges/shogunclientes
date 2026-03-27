"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, Users, Building2, Hash, Pencil, Check, X, UserCog } from "lucide-react"
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
    niche: string | null
    gestor_id: string | null
  } | null
}

interface Gestor { id: string; name: string; email: string; active: boolean }

interface CreateForm {
  email: string; password: string; full_name: string
  business_name: string; cnpj: string; meta_account_id: string
  niche: string; gestor_id: string
}

const EMPTY_FORM: CreateForm = {
  email: "", password: "", full_name: "", business_name: "",
  cnpj: "", meta_account_id: "", niche: "", gestor_id: "",
}

const NICHES = [
  { value: "marmitarias", label: "Marmitarias" },
  { value: "delivery",    label: "Delivery" },
  { value: "generica",    label: "Genérica" },
]

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
  const [users, setUsers]       = useState<UserRow[]>([])
  const [gestores, setGestores] = useState<Gestor[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState<CreateForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Estado para gestores inline
  const [gestorForm, setGestorForm] = useState({ name: "", email: "" })
  const [addingGestor, setAddingGestor] = useState(false)
  const [editingGestor, setEditingGestor] = useState<Gestor | null>(null)
  const [savingGestor, setSavingGestor]   = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      if (profile?.role !== "admin") router.replace("/metricas")
    }
    checkAdmin()
  }, [router])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, gestoresRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/gestores"),
      ])
      if (!usersRes.ok) throw new Error((await usersRes.json()).error)
      setUsers(await usersRes.json())
      if (gestoresRes.ok) setGestores(await gestoresRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

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
          cnpj:     form.cnpj.replace(/\D/g, ""),
          niche:    form.niche    || null,
          gestor_id: form.gestor_id || null,
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
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover")
    } finally {
      setDeleteId(null)
    }
  }

  async function handleAddGestor() {
    if (!gestorForm.name || !gestorForm.email) return
    setSavingGestor(true)
    try {
      const res = await fetch("/api/admin/gestores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gestorForm),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const g = await res.json()
      setGestores((prev) => [...prev, g])
      setGestorForm({ name: "", email: "" })
      setAddingGestor(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar gestor")
    } finally {
      setSavingGestor(false)
    }
  }

  async function handleSaveGestor() {
    if (!editingGestor) return
    setSavingGestor(true)
    try {
      const res = await fetch(`/api/admin/gestores/${editingGestor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingGestor.name, email: editingGestor.email }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const updated = await res.json()
      setGestores((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
      setEditingGestor(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar gestor")
    } finally {
      setSavingGestor(false)
    }
  }

  async function handleDeleteGestor(id: string) {
    if (!confirm("Remover este gestor?")) return
    try {
      const res = await fetch(`/api/admin/gestores/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
      setGestores((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover gestor")
    }
  }

  const inputCls = "w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-sm text-shogun-text-primary placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors font-[var(--font-display)]"
  const labelCls = "block text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider mb-1"
  const selectCls = inputCls + " cursor-pointer"

  const nicheLabel = (n: string | null) => NICHES.find((x) => x.value === n)?.label ?? "—"
  const gestorName = (id: string | null) => gestores.find((g) => g.id === id)?.name ?? "—"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-shogun-accent" />
          <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">Usuários</h1>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-shogun-accent text-shogun-bg-base rounded text-sm font-[var(--font-display)] font-semibold hover:bg-shogun-accent/90 transition-colors"
        >
          <Plus size={16} /> Criar usuário
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-shogun-danger/10 border border-shogun-danger/30 rounded text-sm text-shogun-danger font-[var(--font-display)]">
          {error}
        </div>
      )}

      {/* ── Gestores ── */}
      <ShogunCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserCog size={18} className="text-shogun-accent" />
            <h2 className="text-sm font-semibold font-[var(--font-display)] text-shogun-text-primary">
              Gestores
            </h2>
            <span className="text-xs text-shogun-text-muted font-[var(--font-display)]">(não visível aos clientes)</span>
          </div>
          {!addingGestor && (
            <button
              onClick={() => setAddingGestor(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-[var(--font-display)] font-medium rounded border border-shogun-border text-shogun-text-secondary hover:text-shogun-text-primary hover:border-shogun-accent transition-colors"
            >
              <Plus size={12} /> Adicionar
            </button>
          )}
        </div>

        <div className="space-y-2">
          {gestores.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-shogun-bg-base border border-shogun-border/50"
            >
              {editingGestor?.id === g.id ? (
                <>
                  <input
                    value={editingGestor.name}
                    onChange={(e) => setEditingGestor({ ...editingGestor, name: e.target.value })}
                    placeholder="Nome"
                    className="flex-1 bg-transparent border-b border-shogun-border text-sm text-shogun-text-primary font-[var(--font-display)] outline-none focus:border-shogun-accent"
                  />
                  <input
                    value={editingGestor.email}
                    onChange={(e) => setEditingGestor({ ...editingGestor, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="flex-1 bg-transparent border-b border-shogun-border text-sm text-shogun-text-primary font-[var(--font-display)] outline-none focus:border-shogun-accent"
                  />
                  <button onClick={handleSaveGestor} disabled={savingGestor} className="text-shogun-accent hover:opacity-70">
                    <Check size={15} />
                  </button>
                  <button onClick={() => setEditingGestor(null)} className="text-shogun-text-muted hover:text-shogun-text-primary">
                    <X size={15} />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium font-[var(--font-display)] text-shogun-text-primary w-28">{g.name}</span>
                  <span className="text-sm font-[var(--font-display)] text-shogun-text-secondary flex-1">{g.email}</span>
                  <button onClick={() => setEditingGestor(g)} className="text-shogun-text-muted hover:text-shogun-accent transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDeleteGestor(g.id)} className="text-shogun-text-muted hover:text-shogun-danger transition-colors">
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          ))}

          {/* Novo gestor inline */}
          {addingGestor && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-shogun-bg-base border border-shogun-accent/30">
              <input
                autoFocus
                value={gestorForm.name}
                onChange={(e) => setGestorForm({ ...gestorForm, name: e.target.value })}
                placeholder="Nome do gestor"
                className="flex-1 bg-transparent border-b border-shogun-border text-sm text-shogun-text-primary font-[var(--font-display)] outline-none focus:border-shogun-accent"
              />
              <input
                value={gestorForm.email}
                onChange={(e) => setGestorForm({ ...gestorForm, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="flex-1 bg-transparent border-b border-shogun-border text-sm text-shogun-text-primary font-[var(--font-display)] outline-none focus:border-shogun-accent"
              />
              <button onClick={handleAddGestor} disabled={savingGestor} className="text-shogun-accent hover:opacity-70">
                <Check size={15} />
              </button>
              <button onClick={() => { setAddingGestor(false); setGestorForm({ name: "", email: "" }) }} className="text-shogun-text-muted hover:text-shogun-text-primary">
                <X size={15} />
              </button>
            </div>
          )}

          {gestores.length === 0 && !addingGestor && (
            <p className="text-xs text-shogun-text-muted font-[var(--font-display)] py-2">Nenhum gestor cadastrado.</p>
          )}
        </div>
      </ShogunCard>

      {/* ── Formulário de criação ── */}
      {showForm && (
        <ShogunCard>
          <h2 className="text-base font-[var(--font-display)] font-semibold text-shogun-text-primary mb-5">Novo usuário</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>E-mail (login) *</label>
                <input type="email" required placeholder="cliente@email.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Senha *</label>
                <input type="password" required minLength={6} placeholder="Mínimo 6 caracteres" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nome completo</label>
                <input type="text" placeholder="João Silva" value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nome da empresa *</label>
                <input type="text" required placeholder="Nome igual ao Google Sheets" value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CNPJ</label>
                <input type="text" placeholder="00.000.000/0000-00" value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: formatCnpj(e.target.value) })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>ID da conta de anúncios (Meta)</label>
                <input type="text" placeholder="act_000000000" value={form.meta_account_id}
                  onChange={(e) => setForm({ ...form, meta_account_id: e.target.value })} className={inputCls} />
              </div>

              {/* Nicho — não visível aos clientes */}
              <div>
                <label className={labelCls}>
                  Nicho <span className="text-shogun-text-muted normal-case tracking-normal ml-1">(interno)</span>
                </label>
                <select value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} className={selectCls}>
                  <option value="">Selecione…</option>
                  {NICHES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>

              {/* Gestor — não visível aos clientes */}
              <div>
                <label className={labelCls}>
                  Gestor <span className="text-shogun-text-muted normal-case tracking-normal ml-1">(interno)</span>
                </label>
                <select value={form.gestor_id} onChange={(e) => setForm({ ...form, gestor_id: e.target.value })} className={selectCls}>
                  <option value="">Sem gestor</option>
                  {gestores.filter((g) => g.active).map((g) => (
                    <option key={g.id} value={g.id}>{g.name} — {g.email}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="px-5 py-2 bg-shogun-accent text-shogun-bg-base rounded text-sm font-[var(--font-display)] font-semibold hover:bg-shogun-accent/90 disabled:opacity-50 transition-colors">
                {submitting ? "Criando…" : "Criar usuário"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(null) }}
                className="px-5 py-2 border border-shogun-border rounded text-sm font-[var(--font-display)] text-shogun-text-secondary hover:text-shogun-text-primary transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </ShogunCard>
      )}

      {/* ── Tabela de usuários ── */}
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
                  {["Nome", "E-mail", "Empresa", "Nicho", "Gestor", "Perfil", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user.id} className={i % 2 === 0 ? "bg-shogun-bg-surface border-b border-shogun-border/50" : "bg-shogun-bg-base border-b border-shogun-border/50"}>
                    <td className="px-4 py-3 text-sm text-shogun-text-primary font-[var(--font-display)]">
                      {user.full_name ?? <span className="text-shogun-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-shogun-text-secondary font-[var(--font-display)]">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-shogun-text-primary font-[var(--font-display)]">
                      {user.client ? (
                        <span className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-shogun-text-muted shrink-0" />
                          {user.client.business_name}
                        </span>
                      ) : <span className="text-shogun-text-muted">—</span>}
                    </td>
                    {/* Nicho e Gestor — colunas internas */}
                    <td className="px-4 py-3 text-sm font-[var(--font-display)]">
                      {user.client?.niche ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-shogun-border text-shogun-text-secondary">
                          {nicheLabel(user.client.niche)}
                        </span>
                      ) : <span className="text-shogun-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-shogun-text-secondary font-[var(--font-display)]">
                      {user.client?.gestor_id ? gestorName(user.client.gestor_id) : <span className="text-shogun-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-[var(--font-display)] font-medium ${user.role === "admin" ? "bg-shogun-accent/20 text-shogun-accent" : user.role === "gestor" ? "bg-purple-500/20 text-purple-400" : "bg-shogun-border text-shogun-text-secondary"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.role !== "admin" && (
                        <button onClick={() => handleDelete(user.id)} disabled={deleteId === user.id}
                          className="p-1.5 text-shogun-text-muted hover:text-shogun-danger transition-colors disabled:opacity-40" title="Remover usuário">
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
