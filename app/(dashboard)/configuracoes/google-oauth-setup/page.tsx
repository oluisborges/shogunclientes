"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"

export default function GoogleOAuthSetupPage() {
  const router = useRouter()
  const [credentials, setCredentials] = useState({
    clientId: "",
    clientSecret: "",
    redirectUri: "http://localhost:3000/api/auth/google/calendar"
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const handleSave = () => {
    setError("")
    
    if (!credentials.clientId || !credentials.clientSecret) {
      setError("Preencha todos os campos obrigatórios")
      return
    }

    // Salvar no localStorage (em produção, salvar em .env.local)
    localStorage.setItem("google_oauth_config", JSON.stringify(credentials))
    setSaved(true)
    
    // Mostrar instruções para adicionar ao .env.local
    setTimeout(() => {
      setSaved(false)
    }, 3000)
  }

  const getEnvInstructions = () => {
    return `# Adicione ao seu arquivo .env.local:

GOOGLE_CLIENT_ID="${credentials.clientId}"
GOOGLE_CLIENT_SECRET="${credentials.clientSecret}"
GOOGLE_REDIRECT_URI="${credentials.redirectUri}"

# Depois de adicionar, reinicie o servidor:
# npm run dev`
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push("/configuracoes")}
          className="flex items-center gap-2 text-shogun-text-secondary hover:text-shogun-text-primary mb-4"
        >
          <ArrowLeft size={20} />
          Voltar para Configurações
        </button>
        
        <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary">
          Configurar Google Calendar OAuth
        </h1>
        <p className="text-shogun-text-secondary mt-2">
          Siga os passos abaixo para configurar as credenciais OAuth e poder convidar participantes automaticamente.
        </p>
      </div>

      <div className="space-y-6">
        {/* Passo 1 */}
        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
          <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
            Passo 1: Criar Credenciais OAuth
          </h2>
          
          <div className="space-y-4 text-sm text-shogun-text-secondary">
            <p>
              <strong className="text-shogun-text-primary">1. Acesse o Google Cloud Console:</strong>
            </p>
            <a
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-shogun-accent hover:underline"
            >
              https://console.cloud.google.com/
              <ExternalLink size={16} />
            </a>

            <p className="mt-4">
              <strong className="text-shogun-text-primary">2. Selecione seu projeto</strong> ou crie um novo
            </p>

            <p>
              <strong className="text-shogun-text-primary">3. Vá para APIs & Services → Credentials</strong>
            </p>

            <p>
              <strong className="text-shogun-text-primary">4. Clique em "Create Credentials" → "OAuth client ID"</strong>
            </p>

            <p>
              <strong className="text-shogun-text-primary">5. Selecione "Web application"</strong>
            </p>

            <p>
              <strong className="text-shogun-text-primary">6. Adicione o redirect URI:</strong>
            </p>
            <div className="p-3 bg-shogun-bg-base border border-shogun-border rounded font-mono text-xs">
              {credentials.redirectUri}
            </div>

            <p>
              <strong className="text-shogun-text-primary">7. Copie o Client ID e Client Secret</strong>
            </p>
          </div>
        </div>

        {/* Passo 2 */}
        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
          <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
            Passo 2: Inserir Credenciais
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-[var(--font-display)] font-semibold text-shogun-text-secondary mb-2">
                Client ID *
              </label>
              <input
                type="text"
                value={credentials.clientId}
                onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-shogun-text-primary font-mono text-sm"
                placeholder="seu-client-id.apps.googleusercontent.com"
              />
            </div>

            <div>
              <label className="block text-sm font-[var(--font-display)] font-semibold text-shogun-text-secondary mb-2">
                Client Secret *
              </label>
              <input
                type="password"
                value={credentials.clientSecret}
                onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
                className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-shogun-text-primary font-mono text-sm"
                placeholder="GOCSPX-..."
              />
            </div>

            <div>
              <label className="block text-sm font-[var(--font-display)] font-semibold text-shogun-text-secondary mb-2">
                Redirect URI
              </label>
              <input
                type="text"
                value={credentials.redirectUri}
                onChange={(e) => setCredentials({ ...credentials, redirectUri: e.target.value })}
                className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-shogun-text-primary font-mono text-sm"
              />
            </div>

            {error && (
              <div className="p-3 bg-shogun-danger/10 border border-shogun-danger/20 rounded">
                <p className="text-sm text-shogun-danger">{error}</p>
              </div>
            )}

            {saved && (
              <div className="p-3 bg-shogun-success/10 border border-shogun-success/20 rounded">
                <p className="text-sm text-shogun-success">Credenciais salvas! Adicione ao .env.local abaixo.</p>
              </div>
            )}

            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-shogun-accent hover:bg-shogun-accent-muted text-shogun-bg-base font-[var(--font-display)] font-semibold px-4 py-2 rounded transition-colors"
            >
              <CheckCircle size={18} />
              Salvar Credenciais
            </button>
          </div>
        </div>

        {/* Passo 3 */}
        {credentials.clientId && credentials.clientSecret && (
          <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
            <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
              Passo 3: Adicionar ao .env.local
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-shogun-text-secondary">
                Copie e cole as variáveis abaixo no seu arquivo <code className="bg-shogun-bg-base px-2 py-1 rounded">.env.local</code>:
              </p>

              <div className="p-4 bg-shogun-bg-base border border-shogun-border rounded">
                <pre className="text-xs text-shogun-text-primary font-mono overflow-x-auto">
                  {getEnvInstructions()}
                </pre>
              </div>

              <div className="p-3 bg-shogun-bg-elevated border border-shogun-border rounded">
                <p className="text-sm text-shogun-text-secondary">
                  <strong className="text-shogun-text-primary">Importante:</strong> Depois de adicionar as variáveis, 
                  reinicie o servidor com <code className="bg-shogun-bg-base px-2 py-1 rounded">npm run dev</code>
                </p>
              </div>

              <button
                onClick={() => navigator.clipboard.writeText(getEnvInstructions())}
                className="flex items-center gap-2 px-4 py-2 border border-shogun-border text-shogun-text-primary hover:bg-shogun-bg-base rounded transition-colors"
              >
                Copiar variáveis
              </button>
            </div>
          </div>
        )}

        {/* Passo 4 */}
        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
          <h2 className="text-lg font-[var(--font-display)] font-semibold text-shogun-text-primary mb-4">
            Passo 4: Conectar e Testar
          </h2>

          <div className="space-y-4 text-sm text-shogun-text-secondary">
            <p>
              <strong className="text-shogun-text-primary">1. Reinicie o servidor</strong> com as novas variáveis
            </p>

            <p>
              <strong className="text-shogun-text-primary">2. Volte para a página de Configurações</strong>
            </p>

            <p>
              <strong className="text-shogun-text-primary">3. Clique em "Conectar Google Calendar"</strong>
            </p>

            <p>
              <strong className="text-shogun-text-primary">4. Faça login e autorize o acesso</strong>
            </p>

            <p>
              <strong className="text-shogun-text-primary">5. Teste um agendamento</strong> - os participantes serão convidados!
            </p>

            <div className="p-3 bg-shogun-success/10 border border-shogun-success/20 rounded">
              <p className="text-sm text-shogun-success">
                ✅ Pronto! Seus agendamentos agora convidarão todos os participantes automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
