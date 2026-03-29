import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// Hard limits to prevent abuse of third-party API keys
const MAX_MESSAGES = 50
const MAX_MESSAGE_LENGTH = 8_000   // characters per message
const MAX_TOTAL_LENGTH  = 40_000  // total chars across all messages

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

  // Rate limit: max 30 AI calls per user per minute
  const rl = rateLimit(user.id, { prefix: "ai-chat", limit: 30, windowSec: 60 })
  if (!rl.success) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde um momento antes de continuar." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  // Also rate limit by IP to mitigate shared-account abuse
  const ip = getClientIp(req)
  const ipRl = rateLimit(ip, { prefix: "ai-chat-ip", limit: 60, windowSec: 60 })
  if (!ipRl.success) {
    return NextResponse.json(
      { error: "Muitas requisições a partir deste endereço. Tente novamente em breve." },
      { status: 429 }
    )
  }

  const { agent_id, messages } = await req.json()
  if (!agent_id || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing agent_id or messages" }, { status: 400 })
  }

  // Validate message array bounds
  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json(
      { error: `Máximo de ${MAX_MESSAGES} mensagens por requisição` },
      { status: 400 }
    )
  }

  // Validate each message structure and length
  let totalLength = 0
  for (const msg of messages) {
    if (
      typeof msg.role !== "string" ||
      !["user", "assistant"].includes(msg.role) ||
      typeof msg.content !== "string"
    ) {
      return NextResponse.json({ error: "Formato de mensagem inválido" }, { status: 400 })
    }
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Mensagem excede o limite de ${MAX_MESSAGE_LENGTH} caracteres` },
        { status: 400 }
      )
    }
    totalLength += msg.content.length
    if (totalLength > MAX_TOTAL_LENGTH) {
      return NextResponse.json(
        { error: "Total de mensagens excede o limite permitido" },
        { status: 400 }
      )
    }
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
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar a requisição. Tente novamente." },
      { status: 500 }
    )
  }
}
