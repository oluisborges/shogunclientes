import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from("profiles").select("role").eq("id", user.id).single()
  if (!data || !["admin", "moderador", "gestor"].includes(data.role)) return null
  return user
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const { id } = await params
  const { name, email, active } = await request.json()

  const admin = createAdminClient()
  const updates: Record<string, unknown> = {}
  if (name  !== undefined) updates.name   = name.trim()
  if (email !== undefined) updates.email  = email.trim().toLowerCase()
  if (active !== undefined) updates.active = active

  const { data, error } = await admin
    .from("gestores")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()

  // Desvincula clientes antes de deletar
  await admin.from("clients").update({ gestor_id: null }).eq("gestor_id", id)

  const { error } = await admin.from("gestores").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
