"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogIn, UserPlus, X } from "lucide-react"

const inputCls =
  "w-full bg-shogun-bg-base border border-shogun-border rounded px-4 py-2.5 text-shogun-text-primary text-sm font-[var(--font-display)] placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors"

const labelCls =
  "block text-xs font-[var(--font-display)] text-shogun-text-secondary uppercase tracking-wider mb-1"

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

function RegisterModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [reg, setReg] = useState({
    full_name: "", business_name: "", cnpj: "", email: "", password: "", confirm: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (reg.password !== reg.confirm) { setError("As senhas n\u00e3o coincidem."); return }
    if (reg.password.length < 6)      { setError("A senha deve ter pelo menos 6 caracteres."); return }

    setLoading(true)
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
      if (!res.ok) { setError(json.error); return }
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-shogun-bg-elevated border border-shogun-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-shogun-border">
          <div>
            <h2 className="text-base font-bold font-[var(--font-display)] text-shogun-text-primary">
              Criar conta
            </h2>
            <p className="text-xs text-shogun-text-muted font-[var(--font-display)] mt-0.5">
              Preencha os dados para solicitar acesso
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-shogun-text-muted hover:text-shogun-text-primary transition-colors p-1 rounded"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <label className={labelCls}>Nome completo *</label>
            <input type="text" value={reg.full_name} onChange={(e) => setReg({ ...reg, full_name: e.target.value })} className={inputCls} placeholder="Jo\u00e3o Silva" required />
          </div>
          <div>
            <label className={labelCls}>Nome da empresa *</label>
            <input type="text" value={reg.business_name} onChange={(e) => setReg({ ...reg, business_name: e.target.value })} className={inputCls} placeholder="Minha Empresa Ltda" required />
          </div>
          <div>
            <label className={labelCls}>CNPJ</label>
            <input type="text" value={reg.cnpj} onChange={(e) => setReg({ ...reg, cnpj: formatCnpj(e.target.value) })} className={inputCls} placeholder="00.000.000/0001-00" />
          </div>
          <div>
            <label className={labelCls}>E-mail *</label>
            <input type="email" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} className={inputCls} placeholder="seu@email.com" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Senha *</label>
              <input type="password" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} className={inputCls} placeholder="M\u00edn. 6 caracteres" required />
            </div>
            <div>
              <label className={labelCls}>Confirmar senha *</label>
              <input type="password" value={reg.confirm} onChange={(e) => setReg({ ...reg, confirm: e.target.value })} className={inputCls} placeholder="Repita a senha" required />
            </div>
          </div>
          {error && <p className="text-shogun-danger text-sm font-[var(--font-display)]">{error}</p>}
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-shogun-accent hover:bg-shogun-accent/90 text-shogun-bg-base font-[var(--font-display)] font-semibold py-2.5 rounded transition-colors disabled:opacity-50 mt-1">
            <UserPlus size={16} />
            {loading ? "Enviando..." : "Solicitar acesso"}
          </button>
        </form>
      </div>
    </div>
  )
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-shogun-bg-elevated border border-shogun-border rounded-xl shadow-2xl p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-shogun-accent/15 flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-7 h-7 text-shogun-accent">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="font-[var(--font-display)] text-lg font-bold text-shogun-text-primary">Cadastro enviado!</h2>
          <p className="text-shogun-text-secondary text-sm mt-2 leading-relaxed">
            <strong className="text-shogun-text-primary">Pe\u00e7a no grupo do Shogun para que liberem o seu acesso.</strong>
          </p>
          <p className="text-shogun-text-muted text-xs mt-2">Ap\u00f3s a aprovação você poderá entrar com seu e-mail e senha.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 bg-shogun-accent hover:bg-shogun-accent/90 text-shogun-bg-base text-sm font-semibold font-[var(--font-display)] rounded transition-colors">Entendido</button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail]         = useState("")
  const [password, setPassword]   = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showSuccess, setShowSuccess]   = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      const success = !error
      fetch("/api/auth/login-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, success }),
      }).catch(() => {})
      if (error) { setLoginError("Email ou senha inv\u00e1lidos."); return }
      const isPending = data.user?.user_metadata?.status === "pending"
      router.push(isPending ? "/aguardando-aprovacao" : "/dashboard")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => { setShowRegister(false); setShowSuccess(true) }}
        />
      )}
      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}

      <div className="w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/shogunlogo.png" 
              alt="Shogun Logo" 
              className="h-32 w-auto"
            />
          </div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-shogun-accent tracking-tight mb-1">
            Grupo Shogun
          </h1>
          <p className="text-shogun-text-secondary text-sm">Dash de Performance</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-label block mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-shogun-bg-elevated border border-shogun-border rounded px-4 py-3 text-shogun-text-primary text-sm font-[var(--font-display)] placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors" placeholder="seu@email.com" required />
          </div>
          <div>
            <label className="text-label block mb-2">Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-shogun-bg-elevated border border-shogun-border rounded px-4 py-3 text-shogun-text-primary text-sm font-[var(--font-display)] placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" required />
          </div>
          {loginError && <p className="text-shogun-danger text-sm font-[var(--font-display)]">{loginError}</p>}
          <button type="submit" disabled={loading} className="w-full bg-shogun-accent hover:bg-shogun-accent-muted text-shogun-bg-base font-[var(--font-display)] font-semibold py-3 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <LogIn size={18} />
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setShowRegister(true)} className="text-shogun-text-secondary text-sm font-[var(--font-display)] hover:text-shogun-accent transition-colors">
            N\u00e3o tem conta?{" "}
            <span className="text-shogun-accent font-semibold">Criar conta</span>
          </button>
        </div>
      </div>
    </>
  )
}
