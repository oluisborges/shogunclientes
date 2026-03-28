"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Send, Bot, Loader2, AlertCircle, Megaphone, BarChart3, UtensilsCrossed, Target, Sparkles } from "lucide-react"

interface Agent {
  id: string
  name: string
  category: string
  icon_name: string
}

interface Message {
  role: "user" | "assistant"
  content: string
}

// Map icon_name strings to lucide components
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Bot:             Bot,
  Megaphone:       Megaphone,
  BarChart3:       BarChart3,
  UtensilsCrossed: UtensilsCrossed,
  Target:          Target,
  Sparkles:        Sparkles,
}

function AgentIcon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICON_MAP[name] ?? Bot
  return <Icon size={size} className={className} />
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full bg-shogun-accent/60"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user"
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm font-[var(--font-display)] leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-shogun-accent text-shogun-bg-base rounded-br-sm"
            : "bg-shogun-bg-elevated border border-shogun-border text-shogun-text-primary rounded-bl-sm"
        }`}
      >
        {msg.content}
      </div>
    </div>
  )
}

export default function AgentesPage() {
  const [agents, setAgents]           = useState<Agent[]>([])
  const [loading, setLoading]         = useState(true)
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null)
  const [messages, setMessages]       = useState<Message[]>([])
  const [input, setInput]             = useState("")
  const [sending, setSending]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const messagesEndRef                = useRef<HTMLDivElement>(null)
  const textareaRef                   = useRef<HTMLTextAreaElement>(null)

  const loadAgents = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/admin/agents")
    if (res.ok) {
      const data: Agent[] = await res.json()
      setAgents(data)
      if (data.length > 0) setActiveAgent(data[0])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadAgents() }, [loadAgents])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sending])

  function selectAgent(agent: Agent) {
    if (agent.id === activeAgent?.id) return
    setActiveAgent(agent)
    setMessages([])
    setError(null)
    setInput("")
  }

  async function handleSend() {
    if (!input.trim() || !activeAgent || sending) return
    const userMsg: Message = { role: "user", content: input.trim() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput("")
    setSending(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: activeAgent.id, messages: nextMessages }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao processar")
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido")
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = "auto"
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-shogun-text-muted" />
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-shogun-text-muted">
        <Bot size={40} className="opacity-30" />
        <p className="text-sm font-[var(--font-display)]">Nenhum agente configurado ainda.</p>
        <p className="text-xs font-[var(--font-display)] text-shogun-text-muted">
          Acesse <span className="text-shogun-accent">Configurações → Config. ShogunIA</span> para adicionar agentes.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden rounded-2xl border border-shogun-border bg-shogun-bg-base">
      {/* ── Left sidebar: agent list ── */}
      <aside className="w-64 shrink-0 border-r border-shogun-border flex flex-col bg-shogun-bg-elevated overflow-y-auto">
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-0.5 h-4 rounded-full bg-shogun-accent" />
            <span className="text-xs font-[var(--font-display)] font-semibold text-shogun-text-secondary uppercase tracking-widest">
              Shogun IA
            </span>
          </div>
          <p className="text-[10px] font-[var(--font-display)] text-shogun-text-muted pl-2.5">
            Selecione um especialista
          </p>
        </div>

        <div className="flex-1 px-2 pb-4 space-y-1">
          {agents.map((agent) => {
            const isActive = agent.id === activeAgent?.id
            return (
              <button
                key={agent.id}
                onClick={() => selectAgent(agent)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                  isActive
                    ? "bg-shogun-accent/10 border border-shogun-accent/30"
                    : "hover:bg-shogun-bg-base border border-transparent hover:border-shogun-border"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? "bg-shogun-accent/20" : "bg-shogun-bg-base border border-shogun-border"
                  }`}
                >
                  <AgentIcon
                    name={agent.icon_name}
                    size={17}
                    className={isActive ? "text-shogun-accent" : "text-shogun-text-muted"}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold font-[var(--font-display)] truncate ${isActive ? "text-shogun-accent" : "text-shogun-text-primary"}`}>
                    {agent.name}
                  </p>
                  {agent.category && (
                    <p className="text-[10px] font-[var(--font-display)] text-shogun-text-muted truncate mt-0.5">
                      {agent.category}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── Right: chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        {activeAgent && (
          <div className="flex items-center gap-3 px-6 py-4 border-b border-shogun-border bg-shogun-bg-base shrink-0">
            <div className="w-9 h-9 rounded-xl bg-shogun-accent/15 flex items-center justify-center">
              <AgentIcon name={activeAgent.icon_name} size={18} className="text-shogun-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold font-[var(--font-display)] text-shogun-text-primary">{activeAgent.name}</p>
              {activeAgent.category && (
                <p className="text-[11px] font-[var(--font-display)] text-shogun-text-muted">{activeAgent.category}</p>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-shogun-accent" />
              <span className="text-[11px] font-[var(--font-display)] text-shogun-text-muted">online</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {messages.length === 0 && activeAgent && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-shogun-accent/10 border border-shogun-accent/20 flex items-center justify-center">
                <AgentIcon name={activeAgent.icon_name} size={26} className="text-shogun-accent" />
              </div>
              <div>
                <p className="font-semibold font-[var(--font-display)] text-shogun-text-primary">{activeAgent.name}</p>
                <p className="text-sm font-[var(--font-display)] text-shogun-text-muted mt-1">
                  {activeAgent.category}
                </p>
              </div>
              <p className="text-xs font-[var(--font-display)] text-shogun-text-muted max-w-xs leading-relaxed">
                Olá! Como posso te ajudar hoje? Digite sua mensagem abaixo para começar.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-shogun-bg-elevated border border-shogun-border rounded-2xl rounded-bl-sm">
                <TypingDots />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm font-[var(--font-display)] text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 pb-5 pt-3 border-t border-shogun-border bg-shogun-bg-base shrink-0">
          <div className="flex items-end gap-3 bg-shogun-bg-elevated border border-shogun-border rounded-2xl px-4 py-3 focus-within:border-shogun-accent transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={activeAgent ? `Mensagem para ${activeAgent.name}…` : "Selecione um agente…"}
              disabled={!activeAgent || sending}
              rows={1}
              className="flex-1 bg-transparent text-sm font-[var(--font-display)] text-shogun-text-primary placeholder:text-shogun-text-muted focus:outline-none resize-none leading-relaxed disabled:opacity-50"
              style={{ minHeight: "24px", maxHeight: "160px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !activeAgent || sending}
              className="shrink-0 w-9 h-9 rounded-xl bg-shogun-accent hover:bg-shogun-accent/90 text-shogun-bg-base flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
          <p className="text-center text-[10px] font-[var(--font-display)] text-shogun-text-muted mt-2">
            A IA pode cometer erros. Verifique as informações importantes.
          </p>
        </div>
      </div>
    </div>
  )
}
