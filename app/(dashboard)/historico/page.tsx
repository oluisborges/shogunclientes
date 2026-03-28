"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Navigation,
  Calendar,
  GitCompare,
  Bot,
  CalendarCheck,
  CalendarX,
  RefreshCw,
  User,
  Filter,
} from "lucide-react"

interface ActivityLog {
  id: string
  user_id: string
  user_name: string
  action_type: string
  page_label: string | null
  path: string
  details: Record<string, string> | null
  created_at: string
}

interface UserOption {
  id: string
  name: string
}

const ACTION_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  navigation:    { label: "Acesso a menu",        icon: Navigation,    color: "text-blue-400"   },
  period_change: { label: "Período selecionado",  icon: Calendar,      color: "text-shogun-accent" },
  compare_change:{ label: "Comparação alterada",  icon: GitCompare,    color: "text-purple-400" },
  agent_chat:    { label: "Conversa com agente",  icon: Bot,           color: "text-yellow-400" },
  booking:       { label: "Reunião agendada",     icon: CalendarCheck, color: "text-emerald-400" },
  cancellation:  { label: "Reunião cancelada",    icon: CalendarX,     color: "text-red-400"    },
}

function getDescription(log: ActivityLog): string {
  const d = log.details
  switch (log.action_type) {
    case "navigation":
      return `Entrou em ${log.page_label ?? log.path}`
    case "period_change":
      return `Período: ${d?.period ?? log.path}`
    case "compare_change":
      return `Comparação: ${d?.compare ?? log.path}`
    case "agent_chat":
      return d?.agent ? `Conversou com ${d.agent}${d.category ? ` (${d.category})` : ""}` : "Conversou com agente"
    case "booking":
      return d?.label ? `Agendou para ${d.label}` : "Agendou reunião"
    case "cancellation":
      return "Cancelou reunião mensal"
    default:
      return log.page_label ?? log.path
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

export default function HistoricoPage() {
  const [logs, setLogs]       = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers]     = useState<UserOption[]>([])
  const [filterUser, setFilterUser] = useState<string>("")
  const [filterType, setFilterType] = useState<string>("")

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "500" })
      if (filterUser) params.set("userId", filterUser)
      const res = await fetch(`/api/activity?${params}`)
      if (!res.ok) return
      const data: ActivityLog[] = await res.json()
      setLogs(data)

      // Build unique user list from logs
      const seen = new Map<string, string>()
      for (const l of data) {
        if (!seen.has(l.user_id)) seen.set(l.user_id, l.user_name)
      }
      setUsers(Array.from(seen, ([id, name]) => ({ id, name })))
    } finally {
      setLoading(false)
    }
  }, [filterUser])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const filtered = filterType ? logs.filter((l) => l.action_type === filterType) : logs

  // Group by date
  const grouped = filtered.reduce<Record<string, ActivityLog[]>>((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString("pt-BR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
      timeZone: "America/Sao_Paulo",
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-shogun-text-primary">
          Histórico de Atividades
        </h1>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-shogun-border text-shogun-text-secondary hover:text-shogun-text-primary hover:border-shogun-accent transition-colors text-sm font-[var(--font-display)] disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={14} className="text-shogun-text-muted" />

        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="bg-shogun-bg-elevated border border-shogun-border rounded-lg px-3 py-2 text-sm font-[var(--font-display)] text-shogun-text-primary focus:outline-none focus:border-shogun-accent"
        >
          <option value="">Todos os clientes</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-shogun-bg-elevated border border-shogun-border rounded-lg px-3 py-2 text-sm font-[var(--font-display)] text-shogun-text-primary focus:outline-none focus:border-shogun-accent"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(ACTION_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>

        {filtered.length > 0 && (
          <span className="text-xs font-[var(--font-display)] text-shogun-text-muted ml-auto">
            {filtered.length} evento{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-shogun-text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-shogun-text-muted">
          <Navigation size={36} className="opacity-30" />
          <p className="text-sm font-[var(--font-display)]">Nenhuma atividade registrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-shogun-border" />
                <span className="text-xs font-[var(--font-display)] font-semibold text-shogun-text-muted uppercase tracking-wider whitespace-nowrap">
                  {date}
                </span>
                <div className="h-px flex-1 bg-shogun-border" />
              </div>

              <div className="bg-shogun-bg-elevated border border-shogun-border rounded-xl overflow-hidden">
                {entries.map((log, i) => {
                  const meta = ACTION_META[log.action_type]
                  const Icon = meta?.icon ?? Navigation
                  const color = meta?.color ?? "text-shogun-text-muted"

                  return (
                    <div
                      key={log.id}
                      className={`flex items-start gap-4 px-5 py-3.5 ${i < entries.length - 1 ? "border-b border-shogun-border/50" : ""}`}
                    >
                      {/* Icon */}
                      <div className="mt-0.5 w-8 h-8 rounded-lg bg-shogun-bg-base border border-shogun-border flex items-center justify-center shrink-0">
                        <Icon size={15} className={color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-[var(--font-display)] text-shogun-text-primary">
                            {getDescription(log)}
                          </span>
                          <span className={`text-[10px] font-[var(--font-display)] px-1.5 py-0.5 rounded-full border ${color} opacity-70 border-current`}>
                            {meta?.label ?? log.action_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <User size={11} className="text-shogun-text-muted shrink-0" />
                          <span className="text-xs font-[var(--font-display)] text-shogun-text-muted">
                            {log.user_name}
                          </span>
                          <span className="text-shogun-text-muted/40">·</span>
                          <span className="text-xs font-[var(--font-data)] text-shogun-text-muted">
                            {formatTime(log.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
