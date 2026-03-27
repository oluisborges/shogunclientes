import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { deleteCalendarEvent } from "@/lib/services/google-calendar"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const adminClient = createAdminClient()

    // Verifica que o agendamento pertence ao cliente do usuário
    const { data: clientData } = await adminClient
      .from("clients")
      .select("id")
      .eq("profile_id", user.id)
      .single()

    if (!clientData) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })

    const { data: booking } = await adminClient
      .from("bookings")
      .select("id, google_event_id, client_id, status")
      .eq("id", id)
      .eq("client_id", clientData.id)
      .maybeSingle()

    if (!booking) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
    if (booking.status !== "confirmed") {
      return NextResponse.json({ error: "Agendamento já cancelado" }, { status: 400 })
    }

    // Cancela no banco
    await adminClient
      .from("bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)

    // Remove do Google Calendar (ignora erro se evento já não existe)
    if (booking.google_event_id) {
      await deleteCalendarEvent(booking.google_event_id).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    console.error("Erro ao cancelar agendamento:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
