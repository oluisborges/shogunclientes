import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCurrentCycle,
  isBookingWindowOpen,
} from "@/lib/services/google-calendar"

export async function POST(request: Request) {
  try {
    if (!isBookingWindowOpen()) {
      return NextResponse.json(
        { error: "A janela de agendamento abre no dia 25 de cada mês." },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { slot, clientId: clientIdParam } = await request.json() as { slot: string; clientId?: string }
    if (!slot) return NextResponse.json({ error: "Slot inválido" }, { status: 400 })

    const adminClient = createAdminClient()

    const { data: profile } = await adminClient
      .from("profiles").select("role").eq("id", user.id).single()
    const isAdmin = profile?.role === "admin" || profile?.role === "moderador" || profile?.role === "gestor"

    // Carrega cliente com gestor e perfil do usuário
    let clientQuery = adminClient
      .from("clients")
      .select(`
        id, booking_credits, booking_credits_cycle, business_name, niche, profile_id,
        gestor:gestor_id ( email ),
        profile:profile_id ( full_name )
      `)

    if (isAdmin && clientIdParam) {
      clientQuery = clientQuery.eq("id", clientIdParam) as typeof clientQuery
    } else {
      clientQuery = clientQuery.eq("profile_id", user.id) as typeof clientQuery
    }

    const { data: client } = await clientQuery.single()

    if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })

    // Busca email do cliente via auth
    const { data: authUser } = await adminClient.auth.admin.getUserById(client.profile_id)
    const clientEmail = authUser?.user?.email ?? user.email

    const cycle = getCurrentCycle()

    // Reset de créditos se novo ciclo
    let credits = client.booking_credits ?? 2
    if (client.booking_credits_cycle !== cycle) {
      credits = 2
      await adminClient
        .from("clients")
        .update({ booking_credits: 2, booking_credits_cycle: cycle })
        .eq("id", client.id)
    }

    if (credits <= 0) {
      return NextResponse.json(
        { error: "Você não tem mais créditos para agendar neste ciclo." },
        { status: 403 }
      )
    }

    // Verifica se já tem agendamento ativo no ciclo
    const [cycleYear, cycleMonth] = cycle.split("-").map(Number)
    const cycleStart = new Date(cycleYear, cycleMonth - 1, 1).toISOString()
    const cycleEnd   = new Date(cycleYear, cycleMonth, 0, 23, 59, 59).toISOString()

    const { data: existing } = await adminClient
      .from("bookings")
      .select("id, google_event_id")
      .eq("client_id", client.id)
      .eq("status", "confirmed")
      .gte("scheduled_at", cycleStart)
      .lte("scheduled_at", cycleEnd)
      .maybeSingle()

    // Cancela agendamento anterior (remarcação)
    if (existing) {
      await adminClient
        .from("bookings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", existing.id)
      if (existing.google_event_id) {
        await deleteCalendarEvent(existing.google_event_id).catch(() => {})
      }
    }

    // Resolve nome do cliente e gestor
    const profileData = client.profile as { full_name?: string } | null
    const gestorData  = client.gestor  as { email?: string }     | null

    const clientName  = profileData?.full_name ?? client.business_name
    const gestorEmail = gestorData?.email

    // Cria evento no Google Calendar
    const scheduledAt = new Date(`${slot}:00-03:00`) // São Paulo UTC-3
    const googleEventId = await createCalendarEvent({
      scheduledAt,
      clientName,
      businessName: client.business_name,
      niche:        client.niche ?? undefined,
      clientEmail,
      gestorEmail,
    })

    // Cria novo agendamento no banco
    const { data: booking, error: insertError } = await adminClient
      .from("bookings")
      .insert({
        client_id:       client.id,
        google_event_id: googleEventId,
        scheduled_at:    scheduledAt.toISOString(),
        status:          "confirmed",
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Desconta 1 crédito
    await adminClient
      .from("clients")
      .update({ booking_credits: credits - 1, booking_credits_cycle: cycle })
      .eq("id", client.id)

    return NextResponse.json({ booking, credits: credits - 1 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    console.error("Erro ao criar agendamento:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
