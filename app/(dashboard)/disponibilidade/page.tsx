"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, ChevronRight, X, CalendarRange } from "lucide-react"

interface BlockedSlot { id: string; blocked_date: string; blocked_time: string | null; reason: string | null }
interface WindowConfig { target_month: string; window_end: string }

const WORKING_SLOTS = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30",
]
const DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

function pad(n: number) { return String(n).padStart(2, "0") }

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

function getSecondBusinessDay(year: number, month: number): number {
  let count = 0, day = 1
  while (count < 2) {
    const d = new Date(year, month - 1, day)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) count++
    if (count < 2) day++
  }
  return day
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export default function DisponibilidadePage() {
  const router = useRouter()
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    // Mostra o mês alvo (igual à lógica do agendamento)
    if (now.getDate() >= 25) return new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const [slots, setSlots]         = useState<BlockedSlot[]>([])
  const [window, setWindowCfg]    = useState<WindowConfig | null>(null)
  const [loading, setLoading]     = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [reason, setReason]       = useState("")
  const [saving, setSaving]       = useState(false)
  const [windowEndInput, setWindowEndInput] = useState("")
  const [savingWindow, setSavingWindow] = useState(false)

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth() + 1
  const monthKey = getMonthKey(viewDate)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/booking-config?month=${monthKey}`)
      if (!res.ok) return
      const data = await res.json()
      setSlots(data.slots ?? [])
      setWindowCfg(data.window ?? null)
      setWindowEndInput(data.window?.window_end ?? "")
    } finally {
      setLoading(false)
    }
  }, [monthKey])

  useEffect(() => { loadConfig() }, [loadConfig])

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      if (p?.role !== "admin") router.replace("/metricas")
    }
    check()
  }, [router])

  // Índices para lookup rápido
  const blockedFullDays = new Set(slots.filter(s => !s.blocked_time).map(s => s.blocked_date))
  const blockedTimeMap  = new Map<string, Map<string, BlockedSlot>>()
  for (const s of slots) {
    if (s.blocked_time) {
      if (!blockedTimeMap.has(s.blocked_date)) blockedTimeMap.set(s.blocked_date, new Map())
      blockedTimeMap.get(s.blocked_date)!.set(s.blocked_time, s)
    }
  }

  const secondBD  = getSecondBusinessDay(year, month)
  const daysTotal = getDaysInMonth(year, month)
  const windowEndDate = window?.window_end ? new Date(window.window_end + "T23:59:59") : null

  async function toggleFullDay(dateStr: string) {
    setSaving(true)
    try {
      if (blockedFullDays.has(dateStr)) {
        // Desbloquear: remove o registro de dia inteiro
        const slot = slots.find(s => s.blocked_date === dateStr && !s.blocked_time)
        if (slot) await fetch(`/api/admin/booking-config/${slot.id}`, { method: "DELETE" })
      } else {
        // Bloquear dia inteiro: remove time slots do dia e adiciona fullday
        const timeSlots = slots.filter(s => s.blocked_date === dateStr && s.blocked_time)
        await Promise.all(timeSlots.map(s => fetch(`/api/admin/booking-config/${s.id}`, { method: "DELETE" })))
        await fetch("/api/admin/booking-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocked_date: dateStr, reason: reason || null }),
        })
      }
      await loadConfig()
    } finally {
      setSaving(false)
      setReason("")
    }
  }

  async function toggleSlot(dateStr: string, time: string) {
    setSaving(true)
    try {
      const existing = blockedTimeMap.get(dateStr)?.get(time)
      if (existing) {
        await fetch(`/api/admin/booking-config/${existing.id}`, { method: "DELETE" })
      } else {
        await fetch("/api/admin/booking-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocked_date: dateStr, blocked_time: time, reason: reason || null }),
        })
      }
      await loadConfig()
    } finally {
      setSaving(false)
    }
  }

  async function saveWindowEnd() {
    if (!windowEndInput) return
    setSavingWindow(true)
    try {
      await fetch("/api/admin/booking-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_month: monthKey, window_end: windowEndInput }),
      })
      await loadConfig()
    } finally {
      setSavingWindow(false)
    }
  }

  // Gera grid do calendário (semanas × dias)
  const firstDow = new Date(year, month - 1, 1).getDay() // 0=Dom
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysTotal; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  function dayStatus(day: number): "weekend" | "before" | "after-window" | "full-blocked" | "partial-blocked" | "available" {
    const d = new Date(year, month - 1, day)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) return "weekend"
    if (day < secondBD) return "before"
    if (windowEndDate && d > windowEndDate) return "after-window"
    const dateStr = toDateStr(year, month, day)
    if (blockedFullDays.has(dateStr)) return "full-blocked"
    if ((blockedTimeMap.get(dateStr)?.size ?? 0) > 0) return "partial-blocked"
    return "available"
  }

  function dayStyle(status: ReturnType<typeof dayStatus>) {
    switch (status) {
      case "weekend":       return { bg: "#0a1215", border: "transparent", color: "#2a3d3a", cursor: "default" }
      case "before":        return { bg: "#0a1215", border: "#1a2e2a", color: "#3a5550", cursor: "default" }
      case "after-window":  return { bg: "#0d1a1a", border: "#1a2e2a", color: "#3a5550", cursor: "pointer" }
      case "full-blocked":  return { bg: "rgba(255,80,80,0.12)", border: "rgba(255,80,80,0.5)", color: "#ff6060", cursor: "pointer" }
      case "partial-blocked":return { bg: "rgba(255,160,40,0.1)", border: "rgba(255,160,40,0.5)", color: "#ffa028", cursor: "pointer" }
      case "available":     return { bg: "rgba(149,214,0,0.06)", border: "rgba(149,214,0,0.25)", color: "#95D600", cursor: "pointer" }
    }
  }

  const selectedDateStr = selectedDay
  const selFullBlocked  = selectedDateStr ? blockedFullDays.has(selectedDateStr) : false
  const selTimeBlocked  = selectedDateStr ? (blockedTimeMap.get(selectedDateStr) ?? new Map()) : new Map<string, BlockedSlot>()
  const selStatus       = selectedDay ? dayStatus(parseInt(selectedDay.split("-")[2])) : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CalendarRange size={22} className="text-shogun-accent" />
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-shogun-text-primary">Disponibilidade</h1>
      </div>

      {/* Navegação de mês + janela */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl"
        style={{ background: "#0F1E2A", border: "1px solid #1e3a4a" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewDate(new Date(year, month - 2, 1))}
            className="p-1.5 rounded-lg text-shogun-text-muted hover:text-shogun-text-primary hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-base font-semibold font-[var(--font-display)] text-shogun-text-primary min-w-[160px] text-center">
            {MONTHS_PT[month - 1]} {year}
          </span>
          <button
            onClick={() => setViewDate(new Date(year, month, 1))}
            className="p-1.5 rounded-lg text-shogun-text-muted hover:text-shogun-text-primary hover:bg-white/5 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-[var(--font-display)] text-shogun-text-muted">Fechar agenda em:</span>
          <input
            type="date"
            value={windowEndInput}
            onChange={(e) => setWindowEndInput(e.target.value)}
            className="bg-shogun-bg-base border border-shogun-border rounded px-2 py-1 text-sm text-shogun-text-primary font-[var(--font-display)] focus:outline-none focus:border-shogun-accent"
          />
          <button
            onClick={saveWindowEnd}
            disabled={savingWindow || !windowEndInput}
            className="px-3 py-1 rounded text-xs font-semibold font-[var(--font-display)] bg-shogun-accent text-shogun-bg-base hover:bg-shogun-accent/80 disabled:opacity-40 transition-colors"
          >
            {savingWindow ? "…" : "Salvar"}
          </button>
          {window?.window_end && (
            <span className="text-xs text-shogun-text-muted font-[var(--font-display)]">
              Até {window.window_end.split("-").reverse().join("/")}
            </span>
          )}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs font-[var(--font-display)]">
        {[
          { color: "rgba(149,214,0,0.4)", label: "Disponível" },
          { color: "rgba(255,80,80,0.5)",  label: "Dia bloqueado" },
          { color: "rgba(255,160,40,0.5)", label: "Horários parciais bloqueados" },
          { color: "#1e3a4a",              label: "Fora da janela" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-shogun-text-muted">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Calendário */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#0F1E2A", border: "1px solid #1e3a4a" }}>
          {/* Cabeçalho dias da semana */}
          <div className="grid grid-cols-7 border-b border-shogun-border">
            {DAYS_PT.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold font-[var(--font-display)] text-shogun-text-muted">
                {d}
              </div>
            ))}
          </div>

          {/* Semanas */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-shogun-accent" />
            </div>
          ) : (
            weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-shogun-border/30 last:border-0">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="h-16" />
                  const dateStr = toDateStr(year, month, day)
                  const status  = dayStatus(day)
                  const { bg, border, color, cursor } = dayStyle(status)
                  const isSelected = selectedDay === dateStr
                  const timeBlockCount = blockedTimeMap.get(dateStr)?.size ?? 0

                  return (
                    <button
                      key={di}
                      disabled={status === "weekend" || status === "before"}
                      onClick={() => {
                        if (status === "weekend" || status === "before") return
                        setSelectedDay(selectedDay === dateStr ? null : dateStr)
                        setReason("")
                      }}
                      className="h-16 flex flex-col items-center justify-center gap-0.5 transition-all relative"
                      style={{
                        background: isSelected ? (status === "full-blocked" ? "rgba(255,80,80,0.22)" : "rgba(149,214,0,0.14)") : bg,
                        border: `1px solid ${isSelected ? (status === "full-blocked" ? "rgba(255,80,80,0.8)" : "#95D600") : border}`,
                        color,
                        cursor,
                        margin: "2px",
                        borderRadius: "8px",
                      }}
                    >
                      <span className="text-sm font-semibold font-[var(--font-data)]">{day}</span>
                      {status === "full-blocked" && <span className="text-[9px] font-[var(--font-display)]">Bloqueado</span>}
                      {status === "partial-blocked" && <span className="text-[9px] font-[var(--font-display)]">{timeBlockCount} slot{timeBlockCount > 1 ? "s" : ""}</span>}
                      {status === "after-window" && <span className="text-[9px] font-[var(--font-display)] text-shogun-text-muted">Fora</span>}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Painel lateral do dia selecionado */}
        <div
          className="rounded-xl p-4 space-y-4"
          style={{ background: "#0F1E2A", border: "1px solid #1e3a4a", minHeight: "200px" }}
        >
          {!selectedDay ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <CalendarRange size={28} className="text-shogun-text-muted mb-2" />
              <p className="text-sm text-shogun-text-muted font-[var(--font-display)]">
                Clique em um dia para gerenciar disponibilidade
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold font-[var(--font-display)] text-shogun-text-primary">
                    {DAYS_PT[new Date(selectedDay + "T12:00:00").getDay()]}, {selectedDay.split("-").reverse().slice(0, 2).join("/")}
                  </p>
                  <p className="text-xs text-shogun-text-muted font-[var(--font-display)] mt-0.5">
                    {selStatus === "after-window" ? "Fora da janela de agendamento" : selFullBlocked ? "Dia inteiro bloqueado" : `${selTimeBlocked.size} horário(s) bloqueado(s)`}
                  </p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="text-shogun-text-muted hover:text-shogun-text-primary">
                  <X size={16} />
                </button>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs text-shogun-text-muted font-[var(--font-display)] mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Reunião interna, feriado…"
                  className="w-full bg-shogun-bg-base border border-shogun-border rounded px-2 py-1.5 text-xs text-shogun-text-primary font-[var(--font-display)] focus:outline-none focus:border-shogun-accent"
                />
              </div>

              {/* Botão bloquear/desbloquear dia inteiro */}
              <button
                onClick={() => toggleFullDay(selectedDay)}
                disabled={saving}
                className="w-full py-2 rounded-lg text-xs font-semibold font-[var(--font-display)] transition-all disabled:opacity-50"
                style={selFullBlocked
                  ? { background: "rgba(149,214,0,0.1)", border: "1px solid rgba(149,214,0,0.4)", color: "#95D600" }
                  : { background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.4)", color: "#ff6060" }
                }
              >
                {selFullBlocked ? "✓ Desbloquear dia inteiro" : "Bloquear dia inteiro"}
              </button>

              {/* Horários individuais (só se o dia não estiver totalmente bloqueado) */}
              {!selFullBlocked && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold font-[var(--font-display)] text-shogun-text-secondary">Horários individuais</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {WORKING_SLOTS.map((slot) => {
                      const isBlocked = selTimeBlocked.has(slot)
                      return (
                        <button
                          key={slot}
                          onClick={() => toggleSlot(selectedDay, slot)}
                          disabled={saving}
                          className="py-1.5 rounded text-[11px] font-[var(--font-data)] transition-all disabled:opacity-50"
                          style={isBlocked
                            ? { background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.5)", color: "#ff6060" }
                            : { background: "rgba(149,214,0,0.05)", border: "1px solid #1e3a4a", color: "#6a9a70" }
                          }
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
