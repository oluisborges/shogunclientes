import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

interface AgentRow {
  system_prompt: string
  active: boolean
  provider: string
  model: string | null
  api_key: string | null
}

interface Message {
  role: string
  content: string
}

async function callAnthropic(apiKey: string, model: string, systemPrompt: string, messages: Message[]) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt || "Você é um assistente útil da Shogun. Responda em português brasileiro.",
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? "Anthropic API error")
  return data.content?.[0]?.text ?? ""
}

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, messages: Message[]) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
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

async function callGemini(apiKey: string, model: string, systemPrompt: string, messages: Message[]) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))
  const body: Record<string, unknown> = {
    contents,
    generationConfig: { maxOutputTokens: 1024 },
  }
  if (systemPrompt) body.system_instruction = { parts: [{ text: systemPrompt }] }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
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
    .select("system_prompt, active, provider, model, api_key")
    .eq("id", agent_id)
    .single()

  if (agentError || !agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  const a = agent as AgentRow
  if (!a.active) return NextResponse.json({ error: "Agent is disabled" }, { status: 403 })

  // Model: comes from DB (configured by admin in ShogunIA)
  const model = a.model?.trim() || ""
  if (!model) {
    return NextResponse.json(
      { error: "Modelo não configurado para este agente. Configure em Config. ShogunIA." },
      { status: 503 }
    )
  }

  // API key: per-agent > env fallback
  const apiKey = a.api_key?.trim() ||
    (a.provider === "openai"  ? process.env.OPENAI_API_KEY :
     a.provider === "google"  ? process.env.GOOGLE_AI_API_KEY :
     process.env.ANTHROPIC_API_KEY) || ""

  if (!apiKey) {
    return NextResponse.json(
      { error: `Chave API não configurada para este agente (${a.provider ?? "anthropic"})` },
      { status: 503 }
    )
  }

  try {
    let text = ""
    if (a.provider === "openai") {
      text = await callOpenAI(apiKey, model, a.system_prompt, messages)
    } else if (a.provider === "google") {
      text = await callGemini(apiKey, model, a.system_prompt, messages)
    } else {
      text = await callAnthropic(apiKey, model, a.system_prompt, messages)
    }
    return NextResponse.json({ content: text })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao processar" },
      { status: 500 }
    )
  }
}
