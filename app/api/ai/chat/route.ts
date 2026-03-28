import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import Anthropic from "@anthropic-ai/sdk"
import OpenAI from "openai"

interface AgentRow {
  system_prompt: string
  active: boolean
  provider: string
  model: string
  api_key: string | null
}

async function callAnthropic(apiKey: string, model: string, systemPrompt: string, messages: { role: string; content: string }[]) {
  const client = new Anthropic({ apiKey })
  const res = await client.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt || "Você é um assistente útil da Shogun. Responda em português brasileiro.",
    messages: messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  })
  return res.content[0].type === "text" ? res.content[0].text : ""
}

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, messages: { role: string; content: string }[]) {
  const client = new OpenAI({ apiKey })
  const res = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt || "Você é um assistente útil. Responda em português brasileiro." },
      ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    max_tokens: 1024,
  })
  return res.choices[0]?.message?.content ?? ""
}

async function callGemini(apiKey: string, model: string, systemPrompt: string, messages: { role: string; content: string }[]) {
  // Map messages to Gemini format (user/model alternating)
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const body = {
    system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    contents,
    generationConfig: { maxOutputTokens: 1024 },
  }

  const geminiModel = model || "gemini-1.5-flash"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    .select("system_prompt, active, provider, model, api_key")
    .eq("id", agent_id)
    .single()

  if (agentError || !agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  const a = agent as AgentRow
  if (!a.active) return NextResponse.json({ error: "Agent is disabled" }, { status: 403 })

  // Resolve API key: per-agent > env fallback per provider
  const apiKey = a.api_key?.trim() ||
    (a.provider === "openai"     ? process.env.OPENAI_API_KEY :
     a.provider === "google"     ? process.env.GOOGLE_AI_API_KEY :
     process.env.ANTHROPIC_API_KEY) || ""

  if (!apiKey) {
    return NextResponse.json({ error: `Chave API não configurada para o agente (provider: ${a.provider})` }, { status: 503 })
  }

  try {
    let text = ""
    if (a.provider === "openai") {
      text = await callOpenAI(apiKey, a.model || "gpt-4o-mini", a.system_prompt, messages)
    } else if (a.provider === "google") {
      text = await callGemini(apiKey, a.model || "gemini-1.5-flash", a.system_prompt, messages)
    } else {
      // default: anthropic
      text = await callAnthropic(apiKey, a.model || "claude-sonnet-4-6", a.system_prompt, messages)
    }
    return NextResponse.json({ content: text })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao processar"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
