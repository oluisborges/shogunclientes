import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST — create a new conversation record
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { agent_id, agent_name, messages } = body
  if (!agent_id || !agent_name) {
    return NextResponse.json({ error: "agent_id e agent_name são obrigatórios" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("agent_conversations")
    .insert({ user_id: user.id, agent_id, agent_name, messages: messages ?? [] })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
