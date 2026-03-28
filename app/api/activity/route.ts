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
  const { action_type, page_label, path, details } = body
  if (!action_type || !path) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  // Try with details (requires migration 012); fall back without it
  const { error: insertError } = await admin.from("user_activity_logs").insert({
    user_id: user.id,
    action_type,
    page_label: page_label ?? null,
    path,
    details: details ?? null,
  })

  if (insertError) {
    // Retry without details in case column doesn't exist yet
    await admin.from("user_activity_logs").insert({
      user_id: user.id,
      action_type,
      page_label: page_label ?? null,
      path,
    })
  }

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

  // Fetch logs (without profile join — FK goes to auth.users, not profiles)
  let logsQuery = admin
    .from("user_activity_logs")
    .select("id, action_type, page_label, path, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (userId) logsQuery = logsQuery.eq("user_id", userId)

  const { data: rows, error: logsError } = await logsQuery
  if (logsError) return NextResponse.json({ error: logsError.message }, { status: 500 })

  // Try to also fetch details column (exists only after migration 012)
  const detailsMap = new Map<string, unknown>()
  try {
    let detailsQuery = admin
      .from("user_activity_logs")
      .select("id, details")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (userId) detailsQuery = detailsQuery.eq("user_id", userId)
    const { data: detailsRows } = await detailsQuery
    for (const r of detailsRows ?? []) detailsMap.set(r.id, r.details)
  } catch { /* column may not exist yet */ }

  // Build name map from profiles table
  const userIds = [...new Set((rows ?? []).map((r) => r.user_id as string))]
  const nameMap = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds)
    for (const p of profiles ?? []) nameMap.set(p.id, p.full_name ?? "—")
  }

  const logs = (rows ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    action_type: row.action_type,
    page_label: row.page_label,
    path: row.path,
    details: detailsMap.get(row.id) ?? null,
    created_at: row.created_at,
    user_name: nameMap.get(row.user_id) ?? "—",
  }))

  return NextResponse.json(logs)
}
