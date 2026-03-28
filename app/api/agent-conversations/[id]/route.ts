import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// PATCH — update messages in a conversation
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { messages } = await req.json()

  const admin = createAdminClient()
  const { error } = await admin
    .from("agent_conversations")
    .update({ messages, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// GET — fetch a single conversation (admin only)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { data, error } = await admin
    .from("agent_conversations")
    .select("id, agent_name, messages, created_at, user_id")
    .eq("id", id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  // Fetch user name separately (no direct FK to profiles)
  let userName = "\u2014"
  const { data: prof } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", data.user_id)
    .single()
  if (prof?.full_name) userName = prof.full_name

  return NextResponse.json({
    id: data.id,
    agent_name: data.agent_name,
    messages: data.messages,
    created_at: data.created_at,
    user_name: userName,
  })
}
