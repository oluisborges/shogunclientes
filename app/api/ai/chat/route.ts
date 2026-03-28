import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

interface AgentRow {
  system_prompt: string
  active: boolean
  api_key: string | null
}

interface Message {
  role: string
  content: string
}

function detectProvider(key: string): "anthropic" | "openai" | "google" {
  if (key.startsWith("sk-ant-")) return "anthropic"
  if (key.startsWith("sk-"))     return "openai"
  if (key.startsWith("AIza"))    return "google"
  // fallback: env vars tell us which provider
  if (process.env.ANTHROPIC_API_KEY === key) return "anthropic"
  if (process.env.OPENAI_API_KEY === key)    return "openai"
  return "anthropic"
}

async function callAnthropic(apiKey: string, systemPrompt: string, messages: Message[]) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: systemPrompt || "Você é um assistente útil da Shogun. Responda em português brasileiro.",
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? "Anthropic API error")
  return data.content?.[0]?.text ?? ""
}

async function callOpenAI(apiKey: string, systemPrompt: string, messages: Message[]) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt || "Você é um assistente útil. Responda em português brasileiro." },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? "OpenAI API error")
  return data.choices?.[0]?.message?.content ?? ""
}

async function callGemini(apiKey: string, systemPrompt: string, messages: Message[]) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))
  const body: Record<string, unknown> = {
    contents,
    generationConfig: { maxOutputTokens: 1024 },
  }
  if (systemPrompt) body.system_instruction = { parts: [{ text: systemPrompt }] }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? "Gemini API error")
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { agent_id, messages } = await req.json()
  if (!agent_id || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing agent_id or messages" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: agent, error: agentError } = await admin
    .from("ai_agents")
    .select("system_prompt, active, api_key")
    .eq("id", agent_id)
    .single()

  if (agentError || !agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  const a = agent as AgentRow
  if (!a.active) return NextResponse.json({ error: "Agent is disabled" }, { status: 403 })

  // API key: per-agent > env fallback (any key configured)
  const apiKey = a.api_key?.trim() ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY || ""

  if (!apiKey) {
    return NextResponse.json(
      { error: "Chave API não configurada para este agente." },
      { status: 503 }
    )
  }

  // Provider is inferred from key format — no manual selection needed
  const provider = detectProvider(apiKey)

  try {
    let text = ""
    if (provider === "openai") {
      text = await callOpenAI(apiKey, a.system_prompt, messages)
    } else if (provider === "google") {
      text = await callGemini(apiKey, a.system_prompt, messages)
    } else {
      text = await callAnthropic(apiKey, a.system_prompt, messages)
    }
    return NextResponse.json({ content: text })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao processar" },
      { status: 500 }
    )
  }
}
