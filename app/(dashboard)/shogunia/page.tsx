"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Check, X, ChevronUp, ChevronDown, Bot, Eye, EyeOff } from "lucide-react"
import { ShogunCard } from "@/components/ui/ShogunCard"
import { inputCls, labelCls } from "@/lib/form-styles"

interface Agent {
  id: string
  name: string
  category: string
  icon_name: string
  system_prompt: string
  active: boolean
  display_order: number
  api_key: string
}

const EMPTY = {
  name: "", category: "", icon_name: "Bot", system_prompt: "",
  active: true, api_key: "",
}


function detectProvider(key: string): string {
  if (key.startsWith("sk-ant-")) return "Claude"
  if (key.startsWith("sk-"))     return "GPT"
  if (key.startsWith("AIza"))    return "Gemini"
  return ""
}

function ProviderBadge({ apiKey }: { apiKey: string }) {
  const provider = detectProvider(apiKey)
  if (!provider) return null
  const colors: Record<string, string> = {
    Claude: "bg-[#95D600]/15 text-[#95D600]",
    GPT:    "bg-blue-500/15 text-blue-400",
    Gemini: "bg-amber-500/15 text-amber-400",
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-[var(--font-display)] font-semibold ${colors[provider]}`}>
      {provider}
    </span>
  )
}

function AgentForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  title,
}: {
  form: typeof EMPTY
  setForm: (f: typeof EMPTY) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  title: string
}) {
  const [showKey, setShowKey] = useState(false)
  const detected = detectProvider(form.api_key)

  return (
    <div className="p-5 space-y-4">
      <p className="text-sm font-semibold font-[var(--font-display)] text-shogun-text-primary">{title}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nome *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Especialista em Delivery" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Categoria</label>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Estratégia de Negócio" className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Chave API</label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              placeholder="sk-ant-... / sk-... / AIza..."
              className={inputCls + " pr-10 font-mono"}
            />
            <button type="button" onClick={() => setShowKey((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-shogun-text-muted hover:text-shogun-text-primary">
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {detected && (
            <p className="text-[11px] text-shogun-text-muted font-[var(--font-display)] mt-1">
              Detectado: <span className="text-shogun-accent font-semibold">{detected}</span>
            </p>
          )}
        </div>
        <div>
          <label className={labelCls}>Ícone (lucide)</label>
          <input value={form.icon_name} onChange={(e) => setForm({ ...form, icon_name: e.target.value })} placeholder="Bot" className={inputCls} />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-shogun-accent" />
          <span className="text-sm font-[var(--font-display)] text-shogun-text-secondary">Ativo</span>
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>System prompt</label>
          <textarea
            value={form.system_prompt}
            onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
            rows={5}
            placeholder="Você é um especialista em..."
            className={inputCls + " resize-none"}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving || !form.name.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-shogun-accent text-shogun-bg-base rounded text-sm font-[var(--font-display)] font-semibold hover:bg-shogun-accent/90 disabled:opacity-50 transition-colors">
          <Check size={14} /> {saving ? "Salvando…" : "Salvar"}
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 border border-shogun-border rounded text-sm font-[var(--font-display)] text-shogun-text-secondary hover:text-shogun-text-primary transition-colors">
          <X size={14} /> Cancelar
        </button>
      </div>
    </div>
  )
}

export default function ShogunIAConfigPage() {
  const [agents, setAgents]       = useState<Agent[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState({ ...EMPTY })
  const [saving, setSaving]       = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm]   = useState({ ...EMPTY })
  const [error, setError]         = useState<string | null>(null)

  const loadAgents = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/admin/agents")
    if (res.ok) setAgents(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadAgents() }, [loadAgents])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    const res = await fetch("/api/admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, display_order: agents.length + 1 }),
    })
    if (res.ok) { setShowForm(false); setForm({ ...EMPTY }); await loadAgents() }
    else setError((await res.json()).error)
    setSaving(false)
  }

  const handleSaveEdit = async (id: string) => {
    setSaving(true)
    const res = await fetch(`/api/admin/agents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    })
    if (res.ok) { setEditingId(null); await loadAgents() }
    else setError((await res.json()).error)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este agente?")) return
    await fetch(`/api/admin/agents/${id}`, { method: "DELETE" })
    await loadAgents()
  }

  const moveOrder = async (agent: Agent, dir: -1 | 1) => {
    await fetch(`/api/admin/agents/${agent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_order: agent.display_order + dir }),
    })
    await loadAgents()
  }

  const toggleActive = async (agent: Agent) => {
    await fetch(`/api/admin/agents/${agent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !agent.active }),
    })
    await loadAgents()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot size={22} className="text-shogun-accent" />
          <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">Config. Shogun IA</h1>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-shogun-accent text-shogun-bg-base rounded text-sm font-[var(--font-display)] font-semibold hover:bg-shogun-accent/90 transition-colors"
        >
          <Plus size={15} /> Novo agente
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-shogun-danger/10 border border-shogun-danger/30 rounded text-sm text-shogun-danger font-[var(--font-display)]">{error}</div>
      )}

      {showForm && (
        <ShogunCard className="p-0 overflow-hidden">
          <AgentForm
            form={form}
            setForm={setForm as (f: typeof EMPTY) => void}
            onSave={handleCreate}
            onCancel={() => { setShowForm(false); setForm({ ...EMPTY }) }}
            saving={saving}
            title="Novo agente"
          />
        </ShogunCard>
      )}

      <ShogunCard className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-shogun-accent" />
          </div>
        ) : agents.length === 0 ? (
          <p className="text-center py-10 text-shogun-text-muted text-sm font-[var(--font-display)]">Nenhum agente cadastrado</p>
        ) : (
          <div className="divide-y divide-shogun-border">
            {agents.map((agent) => (
              <div key={agent.id}>
                {editingId === agent.id ? (
                  <AgentForm
                    form={editForm}
                    setForm={setEditForm as (f: typeof EMPTY) => void}
                    onSave={() => handleSaveEdit(agent.id)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                    title={`Editar: ${agent.name}`}
                  />
                ) : (
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => moveOrder(agent, -1)} className="text-shogun-text-muted hover:text-shogun-text-primary transition-colors"><ChevronUp size={13} /></button>
                      <button onClick={() => moveOrder(agent, 1)} className="text-shogun-text-muted hover:text-shogun-text-primary transition-colors"><ChevronDown size={13} /></button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold font-[var(--font-display)] text-shogun-text-primary">{agent.name}</span>
                        {agent.api_key && <ProviderBadge apiKey={agent.api_key} />}
                        {!agent.active && <span className="text-xs px-1.5 py-0.5 rounded bg-shogun-border text-shogun-text-muted font-[var(--font-display)]">inativo</span>}
                      </div>
                      {agent.category && <p className="text-xs text-shogun-text-muted font-[var(--font-display)] mt-0.5">{agent.category}</p>}
                      {agent.system_prompt && (
                        <p className="text-xs text-shogun-text-secondary font-[var(--font-display)] mt-1 truncate max-w-xl opacity-60">
                          {agent.system_prompt.slice(0, 100)}…
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleActive(agent)} className={`text-xs px-2 py-1 rounded font-[var(--font-display)] transition-colors ${agent.active ? "bg-shogun-accent/15 text-shogun-accent hover:bg-shogun-accent/25" : "bg-shogun-border text-shogun-text-muted hover:text-shogun-text-primary"}`}>
                        {agent.active ? "Ativo" : "Inativo"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(agent.id)
                          setEditForm({ name: agent.name, category: agent.category, icon_name: agent.icon_name, system_prompt: agent.system_prompt, active: agent.active, api_key: "" })
                        }}
                        className="p-1.5 text-shogun-text-muted hover:text-shogun-accent transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(agent.id)} className="p-1.5 text-shogun-text-muted hover:text-shogun-danger transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ShogunCard>
    </div>
  )
}
