"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { RefreshCw, CheckCircle, AlertCircle, ExternalLink, Calendar } from "lucide-react"

interface SyncedClient {
  id: string
  name: string
  updated: boolean
}

interface SyncError {
  account: string
  error: string
}

export default function ConfiguracoesPage() {
  const searchParams = useSearchParams()
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    synced: number
    total: number
    clients: SyncedClient[]
    errors?: SyncError[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasToken, setHasToken] = useState(false)
  const [manualToken, setManualToken] = useState("")
  const [showManualImport, setShowManualImport] = useState(true)

  useEffect(() => {
    const success = searchParams.get("success")
    const token = searchParams.get("token")
    const errorParam = searchParams.get("error")

    if (success === "true" && token) {
      setHasToken(true)
      setError(null)
    } else if (success === "google_calendar_connected") {
      setError(null)
      // Mostrar mensagem de sucesso
    } else if (errorParam) {
      setError(getErrorMessage(errorParam))
    }
  }, [searchParams])

  const getErrorMessage = (code: string): string => {
    const messages: Record<string, string> = {
      no_code: "Código de autorização não recebido",
      missing_credentials: "Credenciais da Meta não configuradas no servidor",
      token_exchange_failed: "Falha ao trocar código por token",
      insufficient_permissions: "Você precisa ser admin ou gestor",
      unauthorized: "Não autorizado",
      access_denied: "Acesso negado ao Google Calendar",
    }
    return messages[code] || "Erro desconhecido"
  }

  const handleMetaLogin = () => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID || ""
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/oauth/callback`
    const scope = "ads_read,business_management"

    const authUrl =
      `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${appId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scope}&` +
      `response_type=code`

    window.location.href = authUrl
  }

  const handleGoogleCalendarConnect = () => {
    window.location.href = "/api/auth/google/calendar"
  }

  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    setSyncResult(null)

    try {
      const response = await fetch("/api/meta/sync-accounts", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao sincronizar")
      }

      setSyncResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao sincronizar")
    } finally {
      setSyncing(false)
    }
  }

  const handleManualImport = async () => {
    if (!manualToken.trim()) {
      setError("Por favor, insira um token de acesso")
      return
    }

    setSyncing(true)
    setError(null)
    setSyncResult(null)

    try {
      const response = await fetch("/api/meta/import-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken: manualToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao importar")
      }

      setSyncResult(data)
      setManualToken("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary mb-6">
        Configurações da Meta
      </h1>

      <div className="space-y-6">
        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
          <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
            Importar Clientes da Meta
          </h2>

          {showManualImport && (
            <div className="space-y-4">
              <p className="text-sm text-shogun-text-secondary">
                Cole seu token de acesso da Meta para importar suas contas de anúncios.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-[var(--font-display)] font-semibold text-shogun-text-secondary uppercase tracking-wide block mb-2">
                    Token de Acesso da Meta
                  </label>
                  <input
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Cole seu token aqui..."
                    className="w-full bg-shogun-bg-base border border-shogun-border rounded px-4 py-3 text-shogun-text-primary text-sm font-mono placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors"
                  />
                </div>

                <button
                  onClick={handleManualImport}
                  disabled={syncing || !manualToken.trim()}
                  className="flex items-center gap-2 bg-shogun-accent hover:bg-shogun-accent-muted text-shogun-bg-base font-[var(--font-display)] font-semibold px-6 py-3 rounded transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
                  {syncing ? "Importando..." : "Importar Clientes"}
                </button>
              </div>

              <div className="mt-4 p-3 bg-shogun-bg-base border border-shogun-border rounded">
                <p className="text-xs text-shogun-text-secondary">
                  <strong className="text-shogun-text-primary">Como obter o token:</strong>
                  <br />
                  1. Acesse:{" "}
                  <a
                    href="https://developers.facebook.com/tools/explorer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-shogun-accent hover:underline"
                  >
                    Graph API Explorer
                  </a>
                  <br />
                  2. Selecione seu app no topo
                  <br />
                  3. Clique em "Generate Access Token"
                  <br />
                  4. Autorize as permissões: ads_read, business_management
                  <br />
                  5. Copie o token gerado e cole acima
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 text-shogun-danger bg-shogun-danger/10 border border-shogun-danger/20 rounded p-4">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-[var(--font-display)] font-semibold">
                  Erro
                </p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {syncResult && (
            <div className="mt-4 bg-shogun-bg-base border border-shogun-border rounded p-4">
              <div className="flex items-center gap-2 text-shogun-success mb-3">
                <CheckCircle size={20} />
                <span className="text-sm font-[var(--font-display)] font-semibold">
                  Sincronização concluída
                </span>
              </div>

              <p className="text-sm text-shogun-text-secondary mb-4">
                {syncResult.synced} de {syncResult.total} contas sincronizadas
              </p>

              {syncResult.clients.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-[var(--font-display)] font-semibold text-shogun-text-secondary uppercase tracking-wide">
                    Clientes
                  </p>
                  <div className="space-y-1">
                    {syncResult.clients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between text-sm py-2 px-3 bg-shogun-bg-elevated rounded"
                      >
                        <span className="text-shogun-text-primary">
                          {client.name}
                        </span>
                        <span className="text-xs text-shogun-text-muted">
                          {client.updated ? "Atualizado" : "Novo"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {syncResult.errors && syncResult.errors.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-[var(--font-display)] font-semibold text-shogun-danger uppercase tracking-wide">
                    Erros
                  </p>
                  <div className="space-y-1">
                    {syncResult.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="text-sm py-2 px-3 bg-shogun-danger/10 border border-shogun-danger/20 rounded"
                      >
                        <p className="text-shogun-text-primary font-semibold">
                          {err.account}
                        </p>
                        <p className="text-shogun-text-secondary text-xs mt-1">
                          {err.error}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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

        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
          <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
            Informações
          </h2>

          <div className="space-y-3 text-sm text-shogun-text-secondary">
            <p>
              <strong className="text-shogun-text-primary">
                Como funciona:
              </strong>
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Clique em "Conectar com Meta" para autorizar o acesso</li>
              <li>
                Você será redirecionado para o Facebook para fazer login
              </li>
              <li>
                Após autorizar, clique em "Sincronizar Contas" para importar
                suas contas de anúncios
              </li>
              <li>
                Os clientes serão criados automaticamente no sistema
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
