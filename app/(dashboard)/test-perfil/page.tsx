"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function TestPerfilPage() {
  const [status, setStatus] = useState<string[]>([])
  const router = useRouter()

  const log = (msg: string) => {
    console.log(msg)
    setStatus(prev => [...prev, msg])
  }

  useEffect(() => {
    const test = async () => {
      log("🔍 Testando acesso ao perfil...")

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        log("❌ Usuário não autenticado")
        return
      }

      log(`✅ Usuário: ${user.email}`)

      // Testar navegação direta
      log("🔄 Tentando navegar para /configuracoes/perfil...")
      
      setTimeout(() => {
        router.push("/configuracoes/perfil")
      }, 2000)
    }

    test()
  }, [router])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teste de Navegação</h1>
      <div className="space-y-2">
        {status.map((s, i) => (
          <div key={i} className="text-sm">{s}</div>
        ))}
      </div>
      <div className="mt-6">
        <button
          onClick={() => router.push("/configuracoes/perfil")}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Ir para Meu Perfil (Clique Aqui)
        </button>
      </div>
    </div>
  )
}
