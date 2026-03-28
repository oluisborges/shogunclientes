"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, AlertCircle, Calendar, Save, Eye, EyeOff } from "lucide-react"

function SearchParamsHandler({ setError }: { setError: (e: string | null) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      const messages: Record<string, string> = {
        access_denied: "Acesso negado ao Google Calendar",
        unauthorized: "Não autorizado",
      }
      setError(messages[errorParam] || "Erro desconhecido")
    }
  }, [searchParams, setError])
  return null
}

export default function ConfiguracoesPage() {
  const [error, setError] = useState<string | null>(null)

  // Global Meta token (app-level)
  const [globalToken, setGlobalToken] = useState("")
  const [globalTokenSaved, setGlobalTokenSaved] = useState("")
  const [showGlobalToken, setShowGlobalToken] = useState(false)
  const [savingGlobal, setSavingGlobal] = useState(false)
  const [globalSaveOk, setGlobalSaveOk] = useState(false)

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/admin/settings")
    if (res.ok) {
      const s = await res.json()
      if (s.meta_global_token) {
        setGlobalTokenSaved(s.meta_global_token)
        setGlobalToken(s.meta_global_token)
      }
    }
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  const handleSaveGlobalToken = async () => {
    setSavingGlobal(true)
    setGlobalSaveOk(false)
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meta_global_token: globalToken }),
    })
    setSavingGlobal(false)
    if (res.ok) {
      setGlobalTokenSaved(globalToken)
      setGlobalSaveOk(true)
      setTimeout(() => setGlobalSaveOk(false), 3000)
    }
  }

  const handleGoogleCalendarConnect = () => {
    window.location.href = "/api/auth/google/calendar"
  }

  return (
    <div className="p-6 max-w-4xl">
      <Suspense fallback={null}>
        <SearchParamsHandler setError={setError} />
      </Suspense>

      <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary mb-6">
        Configurações da Meta
      </h1>

      {error && (
        <div className="mb-4 px-4 py-3 bg-shogun-danger/10 border border-shogun-danger/30 rounded text-sm text-shogun-danger font-[var(--font-display)]">{error}</div>
      )}

      <div className="space-y-6">
        {/* ── Token Global Meta App ── */}
        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary">
              Token Global Meta
            </h2>
            {globalTokenSaved && (
              <span className="text-xs font-[var(--font-display)] px-2 py-0.5 rounded-full bg-shogun-accent/15 text-shogun-accent">
                Configurado
              </span>
            )}
          </div>
          <p className="text-sm text-shogun-text-secondary mb-4">
            Token de acesso do sistema (System User Token) com permissão às contas de anúncios de todos os clientes. Usado globalmente — não precisa configurar por cliente.
          </p>
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showGlobalToken ? "text" : "password"}
                value={globalToken}
                onChange={(e) => setGlobalToken(e.target.value)}
                placeholder="EAABs..."
                className="w-full bg-shogun-bg-base border border-shogun-border rounded px-4 py-3 pr-10 text-shogun-text-primary text-sm font-mono placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowGlobalToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-shogun-text-muted hover:text-shogun-text-primary transition-colors"
              >
                {showGlobalToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={handleSaveGlobalToken}
              disabled={savingGlobal || !globalToken.trim()}
              className="flex items-center gap-2 bg-shogun-accent hover:bg-shogun-accent/90 text-shogun-bg-base font-[var(--font-display)] font-semibold px-5 py-2.5 rounded transition-colors disabled:opacity-50"
            >
              {globalSaveOk
                ? <><CheckCircle size={16} /> Salvo!</>
                : <><Save size={16} /> {savingGlobal ? "Salvando…" : "Salvar Token"}</>
              }
            </button>
          </div>
        </div>

        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
          <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
            Google Calendar
          </h2>

          <div className="space-y-4">
            <p className="text-sm text-shogun-text-secondary">
              Conecte o Google Calendar para convidar automaticamente todos os participantes nos agendamentos.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleGoogleCalendarConnect}
                className="flex items-center gap-2 bg-shogun-accent hover:bg-shogun-accent-muted text-shogun-bg-base font-[var(--font-display)] font-semibold px-6 py-3 rounded transition-colors"
              >
                <Calendar size={18} />
                Conectar Google Calendar
              </button>

              <div className="flex items-center gap-2 p-3 bg-shogun-bg-base border border-shogun-border rounded">
                <AlertCircle size={16} className="text-shogun-text-muted" />
                <div className="flex-1">
                  <p className="text-xs text-shogun-text-secondary">
                    <strong className="text-shogun-text-primary">Precisa configurar?</strong>{" "}
                    <a
                      href="/configuracoes/google-oauth-setup"
                      className="text-shogun-accent hover:underline"
                    >
                      Configure as credenciais OAuth aqui
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-shogun-bg-base border border-shogun-border rounded">
              <p className="text-xs text-shogun-text-secondary">
                <strong className="text-shogun-text-primary">Como funciona:</strong>
                <br />
                1. Clique em "Conectar Google Calendar"
                <br />
                2. Faça login com sua conta Google
                <br />
                3. Autorize o acesso ao Calendar
                <br />
                4. Os agendamentos convidarão participantes automaticamente
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
