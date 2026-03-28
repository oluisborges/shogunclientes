"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import type { AvailableDay } from "@/lib/services/google-calendar"
import { useClientContext } from "@/lib/hooks/useClientContext"
import { useActivityLog } from "@/lib/hooks/useActivityLog"

interface Booking {
  id: string
  scheduled_at: string
  status: string
  google_event_id: string
}

interface MyBookingData {
  booking: Booking | null
  credits: number
  cycle: string
}

interface SlotsData {
  open: boolean
  message?: string
  slots: AvailableDay[]
}

function formatScheduledAt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

function getCycleLabel(cycle: string) {
  const [y, m] = cycle.split("-")
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  })
}

function getTargetMonth() {
  const now = new Date()
  // Dia 25+: próximo mês; dia 1-15: mês atual; dia 16-24: mês atual (janela fechada)
  const target = now.getDate() >= 25
    ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1)
  return { year: target.getFullYear(), month: target.getMonth() + 1 }
}

export default function AgendamentoPage() {
  const { selectedClientId } = useClientContext()
  const [myBooking, setMyBooking] = useState<MyBookingData | null>(null)
  const [slotsData, setSlotsData] = useState<SlotsData | null>(null)
  const [selectedDay, setSelectedDay] = useState<AvailableDay | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const { year, month } = getTargetMonth()
  const logActivity = useActivityLog()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const myBookingUrl = selectedClientId 
        ? `/api/agendamento/my-booking?clientId=${selectedClientId}`
        : `/api/agendamento/my-booking`
      
      const [mbRes, slotsRes] = await Promise.all([
        fetch(myBookingUrl),
        fetch(`/api/agendamento/slots?year=${year}&month=${month}`),
      ])
      const mb: MyBookingData = await mbRes.json()
      const sl: SlotsData = await slotsRes.json()
      setMyBooking(mb)
      setSlotsData(sl)
      setSelectedDay(null)
      setSelectedSlot(null)
    } catch {
      setError("Erro ao carregar dados. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }, [year, month, selectedClientId])

  useEffect(() => { loadData() }, [loadData])

  async function handleBook() {
    if (!selectedDay || !selectedSlot) return
    setBooking(true)
    setError(null)
    try {
      const res = await fetch("/api/agendamento/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: `${selectedDay.date}T${selectedSlot}`, clientId: selectedClientId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      logActivity("booking", "Reunião Mensal", {
        slot: `${selectedDay.date}T${selectedSlot}`,
        label: `${selectedDay.label} às ${selectedSlot}`,
      })
      await loadData()
      setConfirming(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao agendar")
    } finally {
      setBooking(false)
    }
  }

  async function handleCancel() {
    if (!myBooking?.booking) return
    setCancelling(true)
    setError(null)
    try {
      const cancelUrl = selectedClientId 
        ? `/api/agendamento/${myBooking.booking.id}?clientId=${selectedClientId}`
        : `/api/agendamento/${myBooking.booking.id}`
      
      const res = await fetch(cancelUrl, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      logActivity("cancellation", "Reunião Mensal", {
        booking_id: myBooking.booking.id,
        scheduled_at: myBooking.booking.scheduled_at,
      })
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cancelar")
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="animate-spin text-shogun-text-muted" />
      </div>
    )
  }

  const windowOpen = slotsData?.open ?? false
  const credits = myBooking?.credits ?? 2
  const cycle = myBooking?.cycle ?? ""
  const hasBooking = !!myBooking?.booking
  // Mostra o calendário sempre que a janela estiver aberta e não tiver agendamento ativo
  const showPicker = windowOpen && !hasBooking

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-display)] text-shogun-text-primary">
            Reunião Mensal
          </h1>
          {cycle && (
            <p className="text-sm text-shogun-text-muted font-[var(--font-display)] mt-0.5">
              Reunião mensal de {getCycleLabel(cycle)}
            </p>
          )}
        </div>

        {/* Créditos */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: "#1A3A31", border: "1px solid #2A5040" }}
        >
          <span className="text-xs font-[var(--font-display)] text-shogun-text-muted uppercase tracking-wider">
            Créditos
          </span>
          <span
            className="text-xl font-bold font-[var(--font-data)]"
            style={{ color: credits > 0 ? "#95D600" : "#FF6B35" }}
          >
            {credits}
          </span>
          <span className="text-xs font-[var(--font-display)] text-shogun-text-muted">/ 2</span>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.3)" }}
        >
          <AlertCircle size={16} style={{ color: "#FF6B35", flexShrink: 0 }} />
          <p className="text-sm font-[var(--font-display)]" style={{ color: "#FF6B35" }}>{error}</p>
        </div>
      )}

      {/* Janela fechada */}
      {!windowOpen && (
        <div
          className="p-6 rounded-xl flex items-start gap-4"
          style={{ background: "#1A3A31", border: "1px solid #2A5040" }}
        >
          <Calendar size={20} style={{ color: "#808080", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="font-semibold font-[var(--font-display)] text-shogun-text-primary">
              Janela de agendamento fechada
            </p>
            <p className="text-sm text-shogun-text-muted font-[var(--font-display)] mt-1">
              O agendamento abre no dia <strong className="text-shogun-text-primary">25 de cada mês</strong>.
              Aguarde para marcar sua reunião de {cycle ? getCycleLabel(cycle) : "próximo mês"}.
            </p>
          </div>
        </div>
      )}

      {/* Agendamento atual */}
      {hasBooking && myBooking?.booking && (
        <div
          className="p-5 rounded-xl"
          style={{ background: "#1A3A31", border: "1px solid rgba(149,214,0,0.35)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle size={18} style={{ color: "#95D600", flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="font-semibold font-[var(--font-display)] text-shogun-text-primary">
                  Reunião agendada
                </p>
                <p className="text-sm font-[var(--font-display)] mt-1" style={{ color: "#95D600" }}>
                  {formatScheduledAt(myBooking.booking.scheduled_at)}
                </p>
                <p className="text-xs text-shogun-text-muted font-[var(--font-display)] mt-1">
                  Duração: 30 minutos · Evento criado no Google Calendar do time
                </p>
              </div>
            </div>

            {windowOpen && credits > 0 && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-[var(--font-display)] transition-opacity disabled:opacity-50"
                style={{
                  border: "1px solid rgba(255,107,53,0.4)",
                  background: "rgba(255,107,53,0.08)",
                  color: "#FF6B35",
                }}
              >
                <XCircle size={12} />
                {cancelling ? "Cancelando…" : "Cancelar para remarcar"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Seletor de data/hora */}
      {showPicker && (
        <div
          className="p-5 rounded-xl space-y-5"
          style={{ background: "#1A3A31", border: "1px solid #2A5040" }}
        >
          <p className="text-sm font-semibold font-[var(--font-display)] text-shogun-text-primary">
            Escolha um dia disponível
          </p>

          {/* Grade de dias */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {(slotsData?.slots ?? []).map((day) => (
              <button
                key={day.date}
                onClick={() => { setSelectedDay(day); setSelectedSlot(null); setConfirming(false) }}
                className="p-2.5 rounded-lg text-center text-xs font-[var(--font-display)] font-medium transition-all"
                style={{
                  border: selectedDay?.date === day.date
                    ? "1px solid rgba(149,214,0,0.6)"
                    : "1px solid #2A5040",
                  background: selectedDay?.date === day.date
                    ? "rgba(149,214,0,0.12)"
                    : "#152E25",
                  color: selectedDay?.date === day.date ? "#95D600" : "#E8F0EB",
                }}
              >
                {day.label}
                <span
                  className="block text-[10px] mt-0.5"
                  style={{ color: selectedDay?.date === day.date ? "#6B9A00" : "#808080" }}
                >
                  {day.slots.length} horários
                </span>
              </button>
            ))}

            {(slotsData?.slots ?? []).length === 0 && (
              <p className="col-span-4 text-sm text-shogun-text-muted text-center py-4 font-[var(--font-display)]">
                Nenhum horário disponível para este mês.
              </p>
            )}
          </div>

          {/* Slots de horário */}
          {selectedDay && (
            <div className="space-y-3">
              <p className="text-sm font-semibold font-[var(--font-display)] text-shogun-text-primary flex items-center gap-2">
                <Clock size={14} style={{ color: "#808080" }} />
                Horários disponíveis — {selectedDay.label}
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {selectedDay.slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => { setSelectedSlot(slot); setConfirming(true) }}
                    className="py-2 rounded-lg text-xs font-[var(--font-data)] font-medium transition-all"
                    style={{
                      border: selectedSlot === slot
                        ? "1px solid rgba(149,214,0,0.6)"
                        : "1px solid #2A5040",
                      background: selectedSlot === slot
                        ? "rgba(149,214,0,0.12)"
                        : "#152E25",
                      color: selectedSlot === slot ? "#95D600" : "#E8F0EB",
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Confirmar */}
          {confirming && selectedDay && selectedSlot && (
            <div
              className="p-4 rounded-xl space-y-3"
              style={{
                border: credits > 0 ? "1px solid rgba(149,214,0,0.25)" : "1px solid rgba(255,107,53,0.3)",
                background: credits > 0 ? "rgba(149,214,0,0.06)" : "rgba(255,107,53,0.06)",
              }}
            >
              {credits > 0 ? (
                <>
                  <p className="text-sm font-[var(--font-display)] text-shogun-text-primary">
                    Confirmar agendamento para{" "}
                    <strong style={{ color: "#95D600" }}>
                      {selectedDay.label} às {selectedSlot}
                    </strong>
                    ?
                  </p>
                  <p className="text-xs text-shogun-text-muted font-[var(--font-display)]">
                    Isso usará 1 crédito. Você terá {credits - 1} crédito(s) restante(s) para remarcar.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleBook}
                      disabled={booking}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold font-[var(--font-display)] transition-opacity disabled:opacity-50"
                      style={{ background: "rgba(149,214,0,0.15)", border: "1px solid rgba(149,214,0,0.5)", color: "#95D600" }}
                    >
                      {booking ? "Agendando…" : "Confirmar"}
                    </button>
                    <button
                      onClick={() => { setConfirming(false); setSelectedSlot(null) }}
                      className="px-4 py-2.5 rounded-lg text-sm font-[var(--font-display)] text-shogun-text-muted"
                      style={{ border: "1px solid #2A5040", background: "#152E25" }}
                    >
                      Voltar
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} style={{ color: "#FF6B35", flexShrink: 0 }} />
                  <p className="text-sm font-[var(--font-display)]" style={{ color: "#FF6B35" }}>
                    Sem créditos disponíveis. Entre em contato com o time Shogun.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
