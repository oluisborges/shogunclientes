"use client"

import { useState, useEffect } from "react"
import { User, Mail, Lock, Save, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function MeuPerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Profile data
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setEmail(user.email || "")
        setFullName(user.user_metadata?.full_name || "")
      }

      // Tentar pegar do perfil também
      const res = await fetch("/api/profile")
      if (res.ok) {
        const data = await res.json()
        setFullName(data.full_name || "")
        setEmail(data.email || "")
      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      setError("O nome não pode estar vazio")
      return
    }

    setSaving(true)
    setError(null)
    setSaveSuccess(false)

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar perfil")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem")
      return
    }
    if (newPassword.length < 8) {
      setPasswordError("A senha deve ter pelo menos 8 caracteres")
      return
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError("A senha deve conter letras e números")
      return
    }

    setSavingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(false)

    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : "Erro ao alterar senha")
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shogun-accent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-[var(--font-display)] font-bold text-shogun-text-primary mb-2">
        Perfil
      </h1>
      <p className="text-sm text-shogun-text-secondary mb-6">
        Gerencie suas informações pessoais e senha de acesso
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-green-700 text-sm">Perfil atualizado com sucesso!</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Informações básicas */}
        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-shogun-text-primary mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações Básicas
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-[var(--font-display)] text-shogun-text-secondary mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-shogun-bg-base border border-shogun-border rounded px-4 py-3 text-shogun-text-primary text-sm placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-[var(--font-display)] text-shogun-text-secondary mb-1">
                E-mail
              </label>
              <div className="flex items-center gap-2 px-4 py-3 bg-shogun-bg-base border border-shogun-border rounded">
                <Mail className="w-4 h-4 text-shogun-text-muted" />
                <span className="text-shogun-text-primary text-sm">{email}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="mt-6 flex items-center gap-2 bg-shogun-accent hover:bg-shogun-accent/90 text-shogun-bg-base font-[var(--font-display)] font-semibold px-5 py-2.5 rounded transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>

        {/* Alterar senha */}
        <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-shogun-text-primary mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha
          </h2>

          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="text-red-700 text-sm">{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-green-700 text-sm">Senha alterada com sucesso!</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-[var(--font-display)] text-shogun-text-secondary mb-1">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-shogun-bg-base border border-shogun-border rounded px-4 py-3 pr-10 text-shogun-text-primary text-sm placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-shogun-text-muted hover:text-shogun-text-primary transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-[var(--font-display)] text-shogun-text-secondary mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-shogun-bg-base border border-shogun-border rounded px-4 py-3 pr-10 text-shogun-text-primary text-sm placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors"
                  placeholder="Digite a nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-shogun-text-muted hover:text-shogun-text-primary transition-colors"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-shogun-text-muted mt-1">Mínimo 8 caracteres, com letras e números</p>
            </div>

            <div>
              <label className="block text-sm font-[var(--font-display)] text-shogun-text-secondary mb-1">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-shogun-bg-base border border-shogun-border rounded px-4 py-3 text-shogun-text-primary text-sm placeholder:text-shogun-text-muted focus:outline-none focus:border-shogun-accent transition-colors"
                placeholder="Digite a nova senha novamente"
              />
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={savingPassword}
            className="mt-6 flex items-center gap-2 bg-shogun-accent hover:bg-shogun-accent/90 text-shogun-bg-base font-[var(--font-display)] font-semibold px-5 py-2.5 rounded transition-colors disabled:opacity-50"
          >
            <Lock size={16} />
            {savingPassword ? "Alterando..." : "Alterar Senha"}
          </button>
        </div>
      </div>
    </div>
  )
}
