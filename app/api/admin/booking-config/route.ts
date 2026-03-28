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

  const [windowRes, slotsRes] = await Promise.all([
    month
      ? admin.from("booking_window_config").select("*").eq("target_month", month).maybeSingle()
      : { data: null, error: null },
    month
      ? admin.from("booking_blocked_slots").select("*").gte("blocked_date", `${month}-01`).lte("blocked_date", `${month}-31`).order("blocked_date").order("blocked_time")
      : admin.from("booking_blocked_slots").select("*").order("blocked_date").order("blocked_time"),
  ])

  return NextResponse.json({
    window: windowRes.data,
    slots: slotsRes.data ?? [],
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
    await admin.from("booking_blocked_slots")
      .delete().eq("blocked_date", blocked_date).eq("blocked_time", blocked_time)
  } else {
    await admin.from("booking_blocked_slots")
      .delete().eq("blocked_date", blocked_date).is("blocked_time", null)
  }

  const { data, error } = await admin
    .from("booking_blocked_slots")
    .insert({ blocked_date, blocked_time: blocked_time ?? null, reason: reason ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
