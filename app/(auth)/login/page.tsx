"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogIn, UserPlus, ArrowLeft } from "lucide-react"

const inputCls =
  "w-full bg-shogun-bg-elevated border border-shogun-border rounded px-4 py-3 text-shogun-text-primary text-sm font-[var(--font-display)] placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors"

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register" | "success">("login")

  // Login state
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const router = useRouter()

  // Register state
  const [reg, setReg] = useState({
    full_name: "", business_name: "", cnpj: "", email: "", password: "", confirm: "",
  })
  const [regError, setRegError] = useState<string | null>(null)
  const [regLoading, setRegLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setLoginError("Email ou senha inválidos."); return }

      // Check if pending
      const isPending = data.user?.user_metadata?.status === "pending"
      if (isPending) {
        router.push("/aguardando-aprovacao")
      } else {
        router.push("/dashboard")
      }
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError(null)

    if (!reg.full_name.trim() || !reg.business_name.trim() || !reg.email.trim() || !reg.password) {
      setRegError("Preencha todos os campos obrigatórios."); return
    }
    if (reg.password !== reg.confirm) {
      setRegError("As senhas não coincidem."); return
    }
    if (reg.password.length < 6) {
      setRegError("A senha deve ter pelo menos 6 caracteres."); return
    }

    setRegLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name:     reg.full_name.trim(),
          business_name: reg.business_name.trim(),
          cnpj:          reg.cnpj,
          email:         reg.email.trim(),
          password:      reg.password,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setRegError(json.error); return }
      setMode("success")
    } finally {
      setRegLoading(false)
    }
  }

  if (mode === "success") {
    return (
      <div className="w-full max-w-sm mx-auto px-6 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-shogun-accent/15 flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7 text-shogun-accent">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="font-[var(--font-display)] text-xl font-bold text-shogun-text-primary">
            Cadastro enviado!
          </h2>
          <p className="text-shogun-text-secondary text-sm mt-2 leading-relaxed">
            Seu cadastro está aguardando aprovação.{" "}
            <strong className="text-shogun-text-primary">
              Peça no grupo do Shogun para que liberem o seu acesso.
            </strong>
          </p>
          <p className="text-shogun-text-muted text-xs mt-3">
            Após a aprovação, você poderá entrar normalmente com seu e-mail e senha.
          </p>
        </div>
        <button
          onClick={() => { setMode("login"); setReg({ full_name: "", business_name: "", cnpj: "", email: reg.email, password: "", confirm: "" }) }}
          className="text-shogun-accent text-sm font-[var(--font-display)] hover:underline"
        >
          Voltar para o login
        </button>
      </div>
    )
  }

  if (mode === "register") {
    return (
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-shogun-text-primary tracking-tight">
            SHOGUN
          </h1>
          <p className="text-shogun-text-secondary text-sm mt-1">Criar conta</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          <div>
            <label className="block text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider mb-1">
              Nome completo *
            </label>
            <input
              type="text"
              value={reg.full_name}
              onChange={(e) => setReg({ ...reg, full_name: e.target.value })}
              className={inputCls}
              placeholder="João Silva"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider mb-1">
              Nome da empresa *
            </label>
            <input
              type="text"
              value={reg.business_name}
              onChange={(e) => setReg({ ...reg, business_name: e.target.value })}
              className={inputCls}
              placeholder="Minha Empresa Ltda"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider mb-1">
              CNPJ
            </label>
            <input
              type="text"
              value={reg.cnpj}
              onChange={(e) => setReg({ ...reg, cnpj: formatCnpj(e.target.value) })}
              className={inputCls}
              placeholder="00.000.000/0001-00"
            />
          </div>

          <div>
            <label className="block text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider mb-1">
              E-mail *
            </label>
            <input
              type="email"
              value={reg.email}
              onChange={(e) => setReg({ ...reg, email: e.target.value })}
              className={inputCls}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider mb-1">
              Senha *
            </label>
            <input
              type="password"
              value={reg.password}
              onChange={(e) => setReg({ ...reg, password: e.target.value })}
              className={inputCls}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider mb-1">
              Confirmar senha *
            </label>
            <input
              type="password"
              value={reg.confirm}
              onChange={(e) => setReg({ ...reg, confirm: e.target.value })}
              className={inputCls}
              placeholder="Repita a senha"
              required
            />
          </div>

          {regError && (
            <p className="text-shogun-danger text-sm font-[var(--font-display)]">{regError}</p>
          )}

          <button
            type="submit"
            disabled={regLoading}
            className="w-full bg-shogun-accent hover:bg-shogun-accent-muted text-shogun-bg-base font-[var(--font-display)] font-semibold py-3 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <UserPlus size={18} />
            {regLoading ? "Enviando..." : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => { setMode("login"); setRegError(null) }}
          className="mt-5 w-full flex items-center justify-center gap-1.5 text-shogun-text-secondary text-sm font-[var(--font-display)] hover:text-shogun-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Voltar para o login
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto px-6">
      <div className="text-center mb-10">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-shogun-text-primary tracking-tight">
          SHOGUN
        </h1>
        <p className="text-shogun-text-secondary text-sm mt-1">Relatórios de Performance</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-label block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
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
            className={inputCls}
            placeholder="••••••••"
            required
          />
        </div>

        {loginError && (
          <p className="text-shogun-danger text-sm font-[var(--font-display)]">{loginError}</p>
        )}

        <button
          type="submit"
          disabled={loginLoading}
          className="w-full bg-shogun-accent hover:bg-shogun-accent-muted text-shogun-bg-base font-[var(--font-display)] font-semibold py-3 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <LogIn size={18} />
          {loginLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => { setMode("register"); setLoginError(null) }}
          className="text-shogun-text-secondary text-sm font-[var(--font-display)] hover:text-shogun-accent transition-colors"
        >
          Não tem conta?{" "}
          <span className="text-shogun-accent font-semibold">Criar conta</span>
        </button>
      </div>
    </div>
  )
}
