"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function DebugPerfilPage() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => {
    console.log(msg)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  useEffect(() => {
    const runDiagnostics = async () => {
      addLog("🔍 Iniciando diagnóstico...")

      try {
        // 1. Verificar autenticação
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          addLog(`❌ Erro de autenticação: ${authError.message}`)
          return
        }

        if (!user) {
          addLog("❌ Usuário não autenticado - REDIRECIONANDO PARA LOGIN")
          window.location.href = "/login"
          return
        }

        addLog(`✅ Autenticado: ${user.email} (ID: ${user.id})`)

        // 2. Verificar se consegue acessar a tabela profiles
        addLog("🔍 Testando acesso à tabela profiles...")
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          addLog(`❌ ERRO ao acessar profiles: ${profileError.message}`)
          addLog(`   Código: ${profileError.code}`)
          addLog(`   Hint: ${profileError.hint || 'N/A'}`)
          addLog(`   Details: ${profileError.details || 'N/A'}`)
        } else {
          addLog(`✅ Perfil encontrado: ${JSON.stringify(profile)}`)
        }

        // 3. Testar API de perfil
        addLog("🔍 Testando API /api/profile...")
        const apiRes = await fetch('/api/profile')
        const apiData = await apiRes.json()

        if (!apiRes.ok) {
          addLog(`❌ API retornou erro ${apiRes.status}: ${apiData.error}`)
        } else {
          addLog(`✅ API funcionando: ${JSON.stringify(apiData)}`)
        }

        // 4. Verificar se a página de perfil existe
        addLog("🔍 Verificando se /configuracoes/perfil está acessível...")
        addLog("✅ Você está nesta página agora: /configuracoes/perfil/debug")
        addLog("📍 A página principal deveria estar em: /configuracoes/perfil")

        addLog("✅ Diagnóstico concluído!")

      } catch (err) {
        addLog(`❌ ERRO GERAL: ${err}`)
      }
    }

    runDiagnostics()
  }, [])

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-red-600 mb-4">
        🔍 DIAGNÓSTICO - Acesso ao Perfil
      </h1>

      <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm space-y-1 mb-6">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h2 className="font-bold text-yellow-800 mb-2">📋 Instruções:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-900">
            <li>Leia os logs acima</li>
            <li>Procure por mensagens com ❌ (erros)</li>
            <li>Copie TODOS os logs e me envie</li>
            <li>Tente clicar no botão abaixo para ir ao perfil</li>
          </ol>
        </div>

        <a
          href="/configuracoes/perfil"
          className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          🔗 Ir para Meu Perfil (Página Principal)
        </a>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          <h2 className="font-bold text-blue-800 mb-2">❓ O que acontece quando você clica?</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-900">
            <li>A página carrega normalmente? ✅</li>
            <li>Dá erro 404 (página não encontrada)? ❌</li>
            <li>Fica em branco? ❌</li>
            <li>Redireciona para outro lugar? ❌</li>
            <li>Mostra algum erro no console? ❌</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
