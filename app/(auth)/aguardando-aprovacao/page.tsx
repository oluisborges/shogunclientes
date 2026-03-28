"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Clock } from "lucide-react"

export default function AguardandoAprovacaoPage() {
  const router = useRouter()

  useEffect(() => {
    async function checkStatus() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      // If already approved, redirect to dashboard
      if (user.user_metadata?.status !== "pending") {
        router.replace("/dashboard")
      }
    }
    checkStatus()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/login")
  }

  return (
    <div className="w-full max-w-sm mx-auto px-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-shogun-accent/10 border border-shogun-accent/20 flex items-center justify-center mx-auto">
        <Clock size={28} className="text-shogun-accent" />
      </div>

      <div>
        <h1 className="font-[var(--font-display)] text-xl font-bold text-shogun-text-primary">
          Aguardando aprovação
        </h1>
        <p className="text-shogun-text-secondary text-sm mt-3 leading-relaxed">
          Seu cadastro foi recebido com sucesso.
        </p>
        <p className="text-shogun-text-secondary text-sm mt-2 leading-relaxed">
          <strong className="text-shogun-text-primary">
            Peça no grupo do Shogun para que liberem o seu acesso.
          </strong>
        </p>
        <p className="text-shogun-text-muted text-xs mt-4">
          Após a aprovação da equipe, você poderá entrar normalmente com seu e-mail e senha.
        </p>
      </div>

      <button
        onClick={handleLogout}
        className="text-shogun-text-muted text-xs font-[var(--font-display)] hover:text-shogun-text-secondary transition-colors underline"
      >
        Sair da conta
      </button>
    </div>
  )
}
