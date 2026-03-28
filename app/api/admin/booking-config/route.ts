import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from("profiles").select("role").eq("id", user.id).single()
  if (!data || !["admin", "gestor"].includes(data.role)) return null
  return user
}

// GET ?month=YYYY-MM → retorna configuração completa do mês
export async function GET(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month") // "YYYY-MM"

  const admin = createAdminClient()

  // Calcula o último dia real do mês para evitar datas inválidas (ex: 2026-04-31)
  let slotsQuery = admin.from("booking_blocked_slots").select("*").order("blocked_date").order("blocked_time")
  let bookingsQuery = admin.from("bookings")
    .select("id, scheduled_at, client:clients(business_name, profile:profiles(full_name))")
    .eq("status", "confirmed")

  if (month) {
    const [y, m] = month.split("-").map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    const lastDate = `${month}-${String(lastDay).padStart(2, "0")}`
    slotsQuery = slotsQuery.gte("blocked_date", `${month}-01`).lte("blocked_date", lastDate)
    const monthStart = new Date(Date.UTC(y, m - 1, 1)).toISOString()
    const monthEnd   = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)).toISOString()
    bookingsQuery = bookingsQuery.gte("scheduled_at", monthStart).lte("scheduled_at", monthEnd)
  }

  const [windowRes, slotsRes, bookingsRes] = await Promise.all([
    month
      ? admin.from("booking_window_config").select("*").eq("target_month", month).maybeSingle()
      : { data: null, error: null },
    slotsQuery,
    bookingsQuery,
  ])

  // Converte scheduled_at (UTC) para horário de Brasília (UTC-3)
  type BookingRow = { id: string; scheduled_at: string; client: { business_name?: string; profile?: { full_name?: string } } | null }
  const bookings = (bookingsRes.data as BookingRow[] ?? []).map((b) => {
    const brtMs = new Date(b.scheduled_at).getTime() - 3 * 60 * 60 * 1000
    const brt   = new Date(brtMs)
    const date  = brt.toISOString().split("T")[0]
    const time  = `${String(brt.getUTCHours()).padStart(2, "0")}:${String(brt.getUTCMinutes()).padStart(2, "0")}`
    const clientName = b.client?.business_name ?? (b.client?.profile as { full_name?: string } | undefined)?.full_name ?? "?"
    return { id: b.id, date, time, clientName }
  })

  return NextResponse.json({
    window: windowRes.data,
    slots: slotsRes.data ?? [],
    bookings,
    ...(slotsRes.error ? { _slotsError: slotsRes.error.message } : {}),
  })
}

// POST { blocked_date, blocked_time?, reason? } → bloqueia slot ou dia inteiro
export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const body = await request.json()
  const { blocked_date, blocked_time, reason } = body
  if (!blocked_date) return NextResponse.json({ error: "Data obrigatória" }, { status: 400 })

  const admin = createAdminClient()

  // Remove qualquer bloqueio existente para o mesmo dia/slot antes de inserir
  if (blocked_time) {
    const delRes = await admin.from("booking_blocked_slots")
      .delete().eq("blocked_date", blocked_date).eq("blocked_time", blocked_time)
    if (delRes.error) return NextResponse.json({ error: `Erro ao remover slot existente: ${delRes.error.message}` }, { status: 500 })
  } else {
    const delRes = await admin.from("booking_blocked_slots")
      .delete().eq("blocked_date", blocked_date).is("blocked_time", null)
    if (delRes.error) return NextResponse.json({ error: `Erro ao remover dia existente: ${delRes.error.message}` }, { status: 500 })
  }

  const { data, error } = await admin
    .from("booking_blocked_slots")
    .insert({ blocked_date, blocked_time: blocked_time ?? null, reason: reason ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message, detail: error.details, hint: error.hint }, { status: 500 })
  return NextResponse.json(data)
}

// PUT { target_month, window_end } → define/atualiza janela do mês
export async function PUT(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const { target_month, window_end } = await request.json()
  if (!target_month || !window_end) return NextResponse.json({ error: "Campos obrigatórios" }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("booking_window_config")
    .upsert({ target_month, window_end }, { onConflict: "target_month" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
