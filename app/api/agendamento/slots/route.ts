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

    const admin = createAdminClient()
    const { data: blocked } = await admin
      .from("booking_blocked_dates")
      .select("blocked_date")
      .gte("blocked_date", `${year}-${String(month).padStart(2, "0")}-01`)
      .lte("blocked_date", `${year}-${String(month).padStart(2, "0")}-31`)

    const blockedSet = new Set<string>((blocked ?? []).map((r: { blocked_date: string }) => r.blocked_date))

    const slots = await getAvailableSlots(year, month, blockedSet)
    return NextResponse.json({ open: true, slots, cycle: getCurrentCycle() })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    console.error("Erro ao buscar slots:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
