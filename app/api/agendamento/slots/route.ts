import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAvailableSlots, getCurrentCycle, isBookingWindowOpen } from "@/lib/services/google-calendar"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const yearParam  = searchParams.get("year")
    const monthParam = searchParams.get("month")

    if (!yearParam || !monthParam) {
      return NextResponse.json({ error: "Parâmetros year e month são obrigatórios" }, { status: 400 })
    }

    const year  = parseInt(yearParam)
    const month = parseInt(monthParam)

    if (!isBookingWindowOpen()) {
      return NextResponse.json({
        open: false,
        message: "A janela de agendamento abre no dia 25 de cada mês.",
        slots: [],
      })
    }

    const monthStr = `${year}-${String(month).padStart(2, "0")}`
    const admin = createAdminClient()

    const [windowRes, slotsRes] = await Promise.all([
      admin.from("booking_window_config").select("window_end").eq("target_month", monthStr).maybeSingle(),
      admin.from("booking_blocked_slots").select("blocked_date, blocked_time")
        .gte("blocked_date", `${monthStr}-01`)
        .lte("blocked_date", `${monthStr}-31`),
    ])

    // Monta sets de bloqueio
    const blockedFullDays = new Set<string>()
    const blockedTimeSlots = new Map<string, Set<string>>()

    for (const row of (slotsRes.data ?? [])) {
      if (!row.blocked_time) {
        blockedFullDays.add(row.blocked_date)
      } else {
        if (!blockedTimeSlots.has(row.blocked_date)) blockedTimeSlots.set(row.blocked_date, new Set())
        blockedTimeSlots.get(row.blocked_date)!.add(row.blocked_time)
      }
    }

    // Padrão: fechar no dia 15 do mês alvo se não configurado
    const defaultWindowEnd = new Date(year, month - 1, 15, 23, 59, 59)
    const windowEnd = windowRes.data?.window_end
      ? new Date(windowRes.data.window_end + "T23:59:59")
      : defaultWindowEnd

    const slots = await getAvailableSlots(year, month, blockedFullDays, blockedTimeSlots, windowEnd)
    return NextResponse.json({ open: true, slots, cycle: getCurrentCycle() })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    console.error("Erro ao buscar slots:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
