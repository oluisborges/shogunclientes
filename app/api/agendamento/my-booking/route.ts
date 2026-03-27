import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getCurrentCycle } from "@/lib/services/google-calendar"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const adminClient = createAdminClient()

    // Busca o cliente vinculado ao usuário
    const { data: client } = await adminClient
      .from("clients")
      .select("id, booking_credits, booking_credits_cycle, business_name")
      .eq("profile_id", user.id)
      .single()

    if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })

    const cycle = getCurrentCycle()

    // Reseta créditos se for um novo ciclo
    let credits = client.booking_credits ?? 2
    if (client.booking_credits_cycle !== cycle) {
      await adminClient
        .from("clients")
        .update({ booking_credits: 2, booking_credits_cycle: cycle })
        .eq("id", client.id)
      credits = 2
    }

    // Busca agendamento ativo do ciclo atual
    const [cycleYear, cycleMonth] = cycle.split("-").map(Number)
    const cycleStart = new Date(cycleYear, cycleMonth - 1, 1).toISOString()
    const cycleEnd = new Date(cycleYear, cycleMonth, 0, 23, 59, 59).toISOString()

    const { data: booking } = await adminClient
      .from("bookings")
      .select("*")
      .eq("client_id", client.id)
      .eq("status", "confirmed")
      .gte("scheduled_at", cycleStart)
      .lte("scheduled_at", cycleEnd)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ booking, credits, cycle })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    console.error("Erro em my-booking:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
