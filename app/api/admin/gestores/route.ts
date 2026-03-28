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

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("gestores")
    .select("*")
    .order("name")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const { name, email } = await request.json()
  if (!name || !email) return NextResponse.json({ error: "name e email são obrigatórios" }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("gestores")
    .insert({ name: name.trim(), email: email.trim().toLowerCase() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
