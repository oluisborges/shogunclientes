"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogIn } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Login iniciado...")
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      console.log("Supabase client criado")
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("Resposta do login:", { data, error: authError })

      if (authError) {
        console.error("Erro de autenticação:", authError)
        setError("Email ou senha inválidos. Tente novamente.")
        setLoading(false)
        return
      }

      console.log("Login bem-sucedido, redirecionando...")
      router.push("/metricas")
    } catch (err) {
      console.error("Erro inesperado:", err)
      setError("Erro ao fazer login. Verifique o console.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto px-6">
      <div className="text-center mb-10">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-shogun-text-primary tracking-tight">
          SHOGUN
        </h1>
        <p className="text-shogun-text-secondary text-sm mt-1">
          Relatórios de Performance
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-label block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-shogun-bg-elevated border border-shogun-border rounded px-4 py-3 text-shogun-text-primary text-sm font-[var(--font-display)] placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div>
          <label className="text-label block mb-2">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-shogun-bg-elevated border border-shogun-border rounded px-4 py-3 text-shogun-text-primary text-sm font-[var(--font-display)] placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <p className="text-shogun-danger text-sm font-[var(--font-display)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-shogun-accent hover:bg-shogun-accent-muted text-shogun-bg-base font-[var(--font-display)] font-semibold py-3 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <LogIn size={18} />
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  )
}
