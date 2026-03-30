import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function assertAdminOrModerador() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  return profile?.role === "admin" || profile?.role === "moderador" ? user : null
}

// GET /api/admin/settings — return all settings as { key: value }
export async function GET() {
  const user = await assertAdminOrModerador()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin.from("app_settings").select("key, value")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const settings: Record<string, string> = {}
  for (const row of data ?? []) settings[row.key] = row.value ?? ""
  return NextResponse.json(settings)
}

// PUT /api/admin/settings — upsert { key, value } pairs
export async function PUT(req: NextRequest) {
  const user = await assertAdminOrModerador()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body: Record<string, string> = await req.json()
  const admin = createAdminClient()

  const rows = Object.entries(body).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await admin
    .from("app_settings")
    .upsert(rows, { onConflict: "key" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
