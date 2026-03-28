import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  return profile?.role === "admin" ? user : null
}

// GET /api/admin/agents — all agents (admin) or active only (client)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  const isAdmin = profile?.role === "admin"

  const fields = isAdmin
    ? "id, name, category, icon_name, system_prompt, active, display_order, api_key"
    : "id, name, category, icon_name, system_prompt, active, display_order"
  let query = admin.from("ai_agents").select(fields).order("display_order")
  if (!isAdmin) query = query.eq("active", true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/admin/agents — create agent (admin only)
export async function POST(req: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("ai_agents")
    .insert({
      name:          body.name,
      category:      body.category ?? "",
      icon_name:     body.icon_name ?? "Bot",
      system_prompt: body.system_prompt ?? "",
      active:        body.active ?? true,
      display_order: body.display_order ?? 0,
      api_key:       body.api_key ?? "",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
