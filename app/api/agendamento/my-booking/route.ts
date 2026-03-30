import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getCurrentCycle } from "@/lib/services/google-calendar"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const adminClient = createAdminClient()

    // Admin/gestor pode passar clientId para agir em nome do cliente selecionado
    const { searchParams } = new URL(request.url)
    const clientIdParam = searchParams.get("clientId")

    const { data: profile } = await adminClient
      .from("profiles").select("role").eq("id", user.id).single()
    const isAdmin = profile?.role === "admin" || profile?.role === "moderador" || profile?.role === "gestor"

    let clientQuery = adminClient
      .from("clients")
      .select("id, booking_credits, booking_credits_cycle, business_name")

    if (isAdmin && clientIdParam) {
      clientQuery = clientQuery.eq("id", clientIdParam) as typeof clientQuery
    } else {
      clientQuery = clientQuery.eq("profile_id", user.id) as typeof clientQuery
    }

    const { data: client } = await clientQuery.single()

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
