"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Lock, MessageCircle, Phone } from "lucide-react"

export default function BlockedPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verifica se o usuário realmente está bloqueado
    const checkBlockedStatus = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = "/login"
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('blocked')
        .eq('id', session.user.id)
        .single()

      if (!profile?.blocked) {
        window.location.href = "/dashboard"
        return
      }

      setLoading(false)
    }

    checkBlockedStatus()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-shogun-bg-base flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shogun-accent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-shogun-bg-base flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-shogun-bg-elevated border border-shogun-border rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-shogun-text-primary mb-4">
          Sua conta foi bloqueada
        </h1>
        
        <p className="text-shogun-text-secondary mb-8">
          Entre em contato com nosso suporte para regularizar sua situação e continuar usando nossos serviços.
        </p>

        <div className="space-y-4">
          <div className="bg-shogun-bg-base border border-shogun-border rounded-lg p-4">
            <div className="flex items-center gap-3 text-shogun-text-primary">
              <MessageCircle className="w-5 h-5 text-shogun-accent" />
              <div className="text-left">
                <p className="font-semibold">WhatsApp</p>
                <p className="text-sm text-shogun-text-secondary">Chame no grupo de suporte</p>
              </div>
            </div>
          </div>

          <div className="bg-shogun-bg-base border border-shogun-border rounded-lg p-4">
            <div className="flex items-center gap-3 text-shogun-text-primary">
              <Phone className="w-5 h-5 text-shogun-accent" />
              <div className="text-left">
                <p className="font-semibold">Telefone</p>
                <p className="text-sm text-shogun-text-secondary">(XX) XXXXX-XXXX</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-shogun-border">
          <p className="text-xs text-shogun-text-muted">
            Para desbloquear sua conta, entre em contato com o administrador do sistema.
          </p>
        </div>

        <button
          onClick={() => {
            const supabase = createClient()
            supabase.auth.signOut()
            window.location.href = "/login"
          }}
          className="mt-6 w-full px-4 py-2 bg-shogun-bg-base border border-shogun-border rounded text-sm font-[var(--font-display)] text-shogun-text-secondary hover:text-shogun-text-primary transition-colors"
        >
          Sair
        </button>
      </div>
    </div>
  )
}
