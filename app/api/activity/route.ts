import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST /api/activity — log a navigation event (client users only, no admin)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Don't log admin actions
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role === "admin") return NextResponse.json({ ok: true })

  const body = await req.json()
  const { action_type, page_label, path } = body
  if (!action_type || !path) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  await admin.from("user_activity_logs").insert({
    user_id: user.id,
    action_type,
    page_label: page_label ?? null,
    path,
  })

  return NextResponse.json({ ok: true })
}

// GET /api/activity — fetch logs (admin only)
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId") ?? undefined
  const limit = parseInt(searchParams.get("limit") ?? "200")

  let query = admin
    .from("user_activity_logs")
    .select(`
      id, action_type, page_label, path, created_at, user_id,
      profiles:user_id ( full_name, email: id )
    `)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (userId) query = query.eq("user_id", userId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten profile into each log entry
  const logs = (data ?? []).map((row: Record<string, unknown>) => {
    const profile = row.profiles as { full_name: string | null; email: string } | null
    return {
      id: row.id,
      user_id: row.user_id,
      action_type: row.action_type,
      page_label: row.page_label,
      path: row.path,
      created_at: row.created_at,
      user_name: profile?.full_name ?? "—",
    }
  })

  return NextResponse.json(logs)
}
