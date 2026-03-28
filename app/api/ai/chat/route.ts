import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import Anthropic from "@anthropic-ai/sdk"

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { agent_id, messages } = await req.json()
  if (!agent_id || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing agent_id or messages" }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch agent
  const { data: agent, error: agentError } = await admin
    .from("ai_agents")
    .select("system_prompt, active")
    .eq("id", agent_id)
    .single()

  if (agentError || !agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  if (!agent.active) return NextResponse.json({ error: "Agent is disabled" }, { status: 403 })

  // Fetch Anthropic API key from app_settings
  const { data: setting } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "anthropic_api_key")
    .single()

  const apiKey = setting?.value || process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 503 })

  const client = new Anthropic({ apiKey })

  // Map messages to Anthropic format
  const anthropicMessages: Anthropic.MessageParam[] = messages.map(
    (m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })
  )

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: agent.system_prompt || "Você é um assistente útil da Shogun. Responda em português brasileiro.",
    messages: anthropicMessages,
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  return NextResponse.json({ content: text })
}
