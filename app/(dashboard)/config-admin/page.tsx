"use client"

import { useState, useEffect } from "react"
import { Shield, UserPlus, Trash2, Edit2, Save, X, CheckCircle, AlertCircle } from "lucide-react"

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: "admin" | "moderador"
  created_at: string
}

export default function ConfigAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "moderador" as "admin" | "moderador"
  })

  const [editForm, setEditForm] = useState({
    full_name: "",
    role: "moderador" as "admin" | "moderador"
  })

  useEffect(() => {
    loadAdminUsers()
  }, [])

  const loadAdminUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log("[Config Admin] Carregando usuários...")
      const res = await fetch("/api/admin/admin-users")
      console.log("[Config Admin] Response status:", res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log("[Config Admin] Usuários carregados:", data)
        console.log("[Config Admin] Verificando IDs:", data.map((u: any) => ({ id: u.id, email: u.email })))
        setUsers(data)
      } else {
        const errorData = await res.json()
        console.error("[Config Admin] Erro na resposta:", errorData)
        setError(`Erro ao carregar usuários: ${errorData.error || res.statusText}`)
      }
    } catch (err) {
      console.error("[Config Admin] Erro ao carregar:", err)
      setError(`Erro ao carregar usuários: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      setError("Preencha todos os campos")
      return
    }

    if (newUser.password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres")
      return
    }

    try {
      const res = await fetch("/api/admin/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao criar usuário")
        return
      }

      setSuccess(`Usuário ${newUser.role} criado com sucesso!`)
      setShowCreateModal(false)
      setNewUser({ email: "", password: "", full_name: "", role: "moderador" })
      loadAdminUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Erro ao criar usuário")
    }
  }

  const handleUpdateUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/admin-users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao atualizar usuário")
        return
      }

      setSuccess("Usuário atualizado com sucesso!")
      setEditingUser(null)
      loadAdminUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Erro ao atualizar usuário")
    }
  }

  const handleDeleteUser = async (userId: string, userRole: string) => {
    if (!confirm(`Tem certeza que deseja remover este ${userRole}?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/admin-users/${userId}`, {
        method: "DELETE"
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao remover usuário")
        return
      }

      setSuccess("Usuário removido com sucesso!")
      loadAdminUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Erro ao remover usuário")
    }
  }

  const startEdit = (user: AdminUser) => {
    setEditingUser(user.id)
    setEditForm({
      full_name: user.full_name,
      role: user.role
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shogun-accent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-shogun-text-primary flex items-center gap-2">
            <Shield className="w-6 h-6 text-shogun-accent" />
            Configuração de Administradores
          </h1>
          <p className="text-sm text-shogun-text-secondary mt-1">
            Gerencie perfis de admin e moderador
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-shogun-accent hover:bg-shogun-accent/90 text-shogun-bg-base px-4 py-2 rounded font-semibold transition-colors"
        >
          <UserPlus size={18} />
          Criar Novo
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={16} className="text-red-600" />
          </button>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Admin
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Acesso total ao sistema</li>
            <li>✅ Pode ver todos os clientes</li>
            <li>✅ Pode criar/editar/remover admins e moderadores</li>
            <li>✅ Pode gerenciar todas as configurações</li>
          </ul>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Moderador
          </h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>✅ Pode ver todos os clientes</li>
            <li>✅ Pode gerenciar clientes e campanhas</li>
            <li>❌ Não pode criar/editar/remover admins</li>
            <li>❌ Não pode alterar configurações de sistema</li>
          </ul>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-shogun-bg-base border-b border-shogun-border">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-shogun-text-secondary">Nome</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-shogun-text-secondary">Email</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-shogun-text-secondary">Perfil</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-shogun-text-secondary">Criado em</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-shogun-text-secondary">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-shogun-text-secondary">
                  Nenhum usuário administrativo encontrado
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-shogun-border last:border-0">
                  <td className="px-4 py-3">
                    {editingUser === user.id ? (
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="w-full bg-shogun-bg-base border border-shogun-border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="text-shogun-text-primary font-medium">{user.full_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-shogun-text-secondary">{user.email}</td>
                  <td className="px-4 py-3">
                    {editingUser === user.id ? (
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as "admin" | "moderador" })}
                        className="bg-shogun-bg-base border border-shogun-border rounded px-2 py-1 text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="moderador">Moderador</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        user.role === "admin" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {user.role === "admin" ? "Admin" : "Moderador"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-shogun-text-secondary">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {editingUser === user.id ? (
                        <>
                          <button
                            onClick={() => {
                              console.log("[ConfigAdmin] Salvando usuário:", user.id, user)
                              handleUpdateUser(user.id)
                            }}
                            className="p-1 hover:bg-green-100 rounded text-green-600"
                            title="Salvar"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-600"
                            title="Cancelar"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(user)}
                            className="p-1 hover:bg-blue-100 rounded text-blue-600"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.role)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-shogun-bg-elevated border border-shogun-border rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-shogun-text-primary">Criar Novo Usuário</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-shogun-text-secondary hover:text-shogun-text-primary">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-shogun-text-secondary mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-shogun-text-primary"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-shogun-text-secondary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-shogun-text-primary"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-shogun-text-secondary mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-shogun-text-primary"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-shogun-text-secondary mb-1">
                  Perfil
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "admin" | "moderador" })}
                  className="w-full bg-shogun-bg-base border border-shogun-border rounded px-3 py-2 text-shogun-text-primary"
                >
                  <option value="moderador">Moderador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateUser}
                className="flex-1 bg-shogun-accent hover:bg-shogun-accent/90 text-shogun-bg-base px-4 py-2 rounded font-semibold transition-colors"
              >
                Criar Usuário
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-shogun-border rounded text-shogun-text-secondary hover:bg-shogun-bg-base transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
