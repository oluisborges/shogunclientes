"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Check, X, ChevronUp, ChevronDown, Bot, Save, Eye, EyeOff } from "lucide-react"
import { ShogunCard } from "@/components/ui/ShogunCard"

interface Agent {
  id: string
  name: string
  category: string
  icon_name: string
  system_prompt: string
  active: boolean
  display_order: number
}

const EMPTY: Omit<Agent, "id" | "display_order"> = {
  name: "", category: "", icon_name: "Bot", system_prompt: "", active: true,
}

const inputCls  = "w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-sm text-shogun-text-primary placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors font-[var(--font-display)]"
const labelCls  = "block text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider mb-1"

export default function ShogunIAConfigPage() {
  const [agents, setAgents]       = useState<Agent[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState({ ...EMPTY })
  const [saving, setSaving]       = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm]   = useState({ ...EMPTY })
  const [error, setError]         = useState<string | null>(null)

  // Anthropic API key
  const [apiKey, setApiKey]       = useState("")
  const [showKey, setShowKey]     = useState(false)
  const [savingKey, setSavingKey] = useState(false)
  const [keyOk, setKeyOk]         = useState(false)

  const loadAgents = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/admin/agents")
    if (res.ok) setAgents(await res.json())
    setLoading(false)
  }, [])

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/admin/settings")
    if (res.ok) {
      const s = await res.json()
      if (s.anthropic_api_key) setApiKey(s.anthropic_api_key)
    }
  }, [])

  useEffect(() => { loadAgents(); loadSettings() }, [loadAgents, loadSettings])

  const handleSaveKey = async () => {
    setSavingKey(true)
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anthropic_api_key: apiKey }),
    })
    setSavingKey(false)
    if (res.ok) { setKeyOk(true); setTimeout(() => setKeyOk(false), 3000) }
  }

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

      {/* Anthropic API Key */}
      <ShogunCard>
        <h2 className="text-sm font-semibold font-[var(--font-display)] text-shogun-text-primary mb-3">Chave API — Anthropic (Claude)</h2>
        <p className="text-xs text-shogun-text-muted font-[var(--font-display)] mb-3">
          Usada para responder nos chats do Shogun IA. Se não configurada, o sistema tentará usar a variável de ambiente <code className="bg-shogun-bg-base px-1 rounded text-shogun-accent">ANTHROPIC_API_KEY</code>.
        </p>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className={inputCls + " pr-10 font-mono"}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-shogun-text-muted hover:text-shogun-text-primary"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button
            onClick={handleSaveKey}
            disabled={savingKey || !apiKey.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-shogun-accent text-shogun-bg-base rounded text-sm font-[var(--font-display)] font-semibold hover:bg-shogun-accent/90 disabled:opacity-50 transition-colors"
          >
            {keyOk ? <><Check size={14} /> Salva!</> : <><Save size={14} /> {savingKey ? "Salvando…" : "Salvar"}</>}
          </button>
        </div>
      </ShogunCard>

      {/* Form novo agente */}
      {showForm && (
        <ShogunCard>
          <h2 className="text-sm font-semibold font-[var(--font-display)] text-shogun-text-primary mb-4">Novo agente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>Nome *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Especialista em Delivery" className={inputCls} /></div>
            <div><label className={labelCls}>Categoria</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Estratégia de Negócio" className={inputCls} /></div>
            <div><label className={labelCls}>Ícone (lucide)</label><input value={form.icon_name} onChange={(e) => setForm({ ...form, icon_name: e.target.value })} placeholder="Bot" className={inputCls} /></div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="active-new" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-shogun-accent" />
              <label htmlFor="active-new" className="text-sm font-[var(--font-display)] text-shogun-text-secondary">Ativo</label>
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
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-shogun-accent text-shogun-bg-base rounded text-sm font-[var(--font-display)] font-semibold hover:bg-shogun-accent/90 disabled:opacity-50 transition-colors">
              <Check size={14} /> {saving ? "Criando…" : "Criar"}
            </button>
            <button onClick={() => { setShowForm(false); setForm({ ...EMPTY }) }} className="flex items-center gap-1.5 px-4 py-2 border border-shogun-border rounded text-sm font-[var(--font-display)] text-shogun-text-secondary hover:text-shogun-text-primary transition-colors">
              <X size={14} /> Cancelar
            </button>
          </div>
        </ShogunCard>
      )}

      {/* Lista de agentes */}
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
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><label className={labelCls}>Nome</label><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputCls} /></div>
                      <div><label className={labelCls}>Categoria</label><input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className={inputCls} /></div>
                      <div><label className={labelCls}>Ícone</label><input value={editForm.icon_name} onChange={(e) => setEditForm({ ...editForm, icon_name: e.target.value })} className={inputCls} /></div>
                      <div className="flex items-center gap-2 pt-5">
                        <input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} className="accent-shogun-accent" />
                        <span className="text-sm font-[var(--font-display)] text-shogun-text-secondary">Ativo</span>
                      </div>
                    </div>
                    <div><label className={labelCls}>System prompt</label><textarea value={editForm.system_prompt} onChange={(e) => setEditForm({ ...editForm, system_prompt: e.target.value })} rows={6} className={inputCls + " resize-none"} /></div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEdit(agent.id)} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-shogun-accent text-shogun-bg-base rounded text-xs font-[var(--font-display)] font-semibold hover:bg-shogun-accent/90 disabled:opacity-50">
                        <Check size={12} /> Salvar
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 px-3 py-1.5 border border-shogun-border rounded text-xs font-[var(--font-display)] text-shogun-text-secondary hover:text-shogun-text-primary">
                        <X size={12} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => moveOrder(agent, -1)} className="text-shogun-text-muted hover:text-shogun-text-primary transition-colors"><ChevronUp size={13} /></button>
                      <button onClick={() => moveOrder(agent, 1)} className="text-shogun-text-muted hover:text-shogun-text-primary transition-colors"><ChevronDown size={13} /></button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold font-[var(--font-display)] text-shogun-text-primary">{agent.name}</span>
                        {!agent.active && <span className="text-xs px-1.5 py-0.5 rounded bg-shogun-border text-shogun-text-muted font-[var(--font-display)]">inativo</span>}
                      </div>
                      {agent.category && <p className="text-xs text-shogun-text-muted font-[var(--font-display)]">{agent.category}</p>}
                      {agent.system_prompt && (
                        <p className="text-xs text-shogun-text-secondary font-[var(--font-display)] mt-1 truncate max-w-xl">{agent.system_prompt.slice(0, 120)}…</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleActive(agent)} className={`text-xs px-2 py-1 rounded font-[var(--font-display)] transition-colors ${agent.active ? "bg-shogun-accent/15 text-shogun-accent hover:bg-shogun-accent/25" : "bg-shogun-border text-shogun-text-muted hover:text-shogun-text-primary"}`}>
                        {agent.active ? "Ativo" : "Inativo"}
                      </button>
                      <button onClick={() => { setEditingId(agent.id); setEditForm({ name: agent.name, category: agent.category, icon_name: agent.icon_name, system_prompt: agent.system_prompt, active: agent.active }) }} className="p-1.5 text-shogun-text-muted hover:text-shogun-accent transition-colors">
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
