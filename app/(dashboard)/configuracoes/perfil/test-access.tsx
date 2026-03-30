"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function TestAccessPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [apiResponse, setApiResponse] = useState<any>(null)

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const runTests = async () => {
      addLog("🔍 Iniciando testes de acesso ao perfil...")

      // Teste 1: Verificar autenticação
      try {
        const supabase = createClient()
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          addLog(`❌ Erro de autenticação: ${authError.message}`)
          return
        }

        if (!authUser) {
          addLog("❌ Usuário não autenticado")
          return
        }

        addLog(`✅ Usuário autenticado: ${authUser.email}`)
        setUser(authUser)

        // Teste 2: Verificar acesso direto ao perfil via Supabase
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (profileError) {
            addLog(`❌ Erro ao buscar perfil direto: ${profileError.message}`)
            addLog(`   Código: ${profileError.code}`)
            addLog(`   Detalhes: ${profileError.details}`)
          } else {
            addLog(`✅ Perfil encontrado via Supabase direto`)
            setProfile(profileData)
          }
        } catch (err) {
          addLog(`❌ Exceção ao buscar perfil: ${err}`)
        }

        // Teste 3: Verificar API de perfil
        try {
          const apiRes = await fetch('/api/profile')
          const apiData = await apiRes.json()

          if (!apiRes.ok) {
            addLog(`❌ API de perfil retornou erro: ${apiData.error}`)
            addLog(`   Status: ${apiRes.status}`)
          } else {
            addLog(`✅ API de perfil funcionando`)
            setApiResponse(apiData)
          }
        } catch (err) {
          addLog(`❌ Erro ao chamar API: ${err}`)
        }

        // Teste 4: Verificar permissões RLS
        if (profile) {
          try {
            const { data: testUpdate, error: updateError } = await supabase
              .from('profiles')
              .update({ full_name: profile.full_name || 'Test' })
              .eq('id', authUser.id)
              .select()

            if (updateError) {
              addLog(`❌ Sem permissão para atualizar perfil: ${updateError.message}`)
            } else {
              addLog(`✅ Permissão de atualização OK`)
            }
          } catch (err) {
            addLog(`❌ Erro ao testar atualização: ${err}`)
          }
        }

        addLog("✅ Testes concluídos!")

      } catch (err) {
        addLog(`❌ Erro geral: ${err}`)
      }
    }

    runTests()
  }, [])

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-shogun-text-primary mb-6">
        🔍 Teste de Acesso ao Perfil
      </h1>

      <div className="space-y-6">
        {/* Logs */}
        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-shogun-text-primary mb-3">Logs:</h2>
          <div className="space-y-1 font-mono text-xs">
            {logs.map((log, i) => (
              <div key={i} className={`${log.includes('❌') ? 'text-red-500' : log.includes('✅') ? 'text-green-500' : 'text-shogun-text-secondary'}`}>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-shogun-text-primary mb-3">Usuário:</h2>
            <pre className="text-xs text-shogun-text-secondary overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}

        {/* Profile Info */}
        {profile && (
          <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-shogun-text-primary mb-3">Perfil (Supabase):</h2>
            <pre className="text-xs text-shogun-text-secondary overflow-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        )}

        {/* API Response */}
        {apiResponse && (
          <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-shogun-text-primary mb-3">API Response:</h2>
            <pre className="text-xs text-shogun-text-secondary overflow-auto">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
