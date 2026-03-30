"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function BlockedCheck({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkBlockedStatus = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          console.log("BlockedCheck: Usuário não autenticado, redirecionando para login")
          router.push("/login")
          return
        }

        console.log("BlockedCheck: Verificando bloqueio para usuário:", session.user.id)

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('blocked')
          .eq('id', session.user.id)
          .single()

        console.log("BlockedCheck: Resultado:", { profile, error })

        // Se houver erro de permissão, assume que não está bloqueado
        if (error) {
          console.log("BlockedCheck: Erro ao verificar bloqueio, assumindo não bloqueado:", error)
          setLoading(false)
          return
        }

        if (profile?.blocked) {
          console.log("BlockedCheck: Usuário bloqueado, redirecionando")
          router.push("/blocked")
          return
        }

        console.log("BlockedCheck: Usuário não bloqueado, permitindo acesso")
        setLoading(false)
      } catch (err) {
        console.error("BlockedCheck: Erro geral:", err)
        setLoading(false) // Em caso de erro, permite acesso
      }
    }

    checkBlockedStatus()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-shogun-bg-base flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shogun-accent"></div>
      </div>
    )
  }

  return <>{children}</>
}
