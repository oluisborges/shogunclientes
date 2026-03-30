// lib/auth/permissions.ts
// Funções helper para verificar permissões de Admin vs Moderador

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type UserRole = "admin" | "moderador" | "gestor" | "cliente"

export interface AuthCheckResult {
  user: any | null
  role: UserRole | null
  isAdmin: boolean
  isModerador: boolean
  isAdminOrModerador: boolean
  error?: string
  statusCode?: number
}

/**
 * Verifica autenticação e permissões do usuário
 */
export async function checkAuth(): Promise<AuthCheckResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      role: null,
      isAdmin: false,
      isModerador: false,
      isAdminOrModerador: false,
      error: "Não autorizado",
      statusCode: 401
    }
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = profile?.role as UserRole
  const isAdmin = role === "admin"
  const isModerador = role === "moderador"
  const isAdminOrModerador = isAdmin || isModerador

  return {
    user,
    role,
    isAdmin,
    isModerador,
    isAdminOrModerador
  }
}

/**
 * Verifica se é Admin (apenas admin, não moderador)
 */
export async function requireAdmin(): Promise<AuthCheckResult> {
  const auth = await checkAuth()

  if (auth.error) return auth

  if (!auth.isAdmin) {
    return {
      ...auth,
      error: "Acesso restrito a administradores",
      statusCode: 403
    }
  }

  return auth
}

/**
 * Verifica se é Admin ou Moderador
 */
export async function requireAdminOrModerador(): Promise<AuthCheckResult> {
  const auth = await checkAuth()

  if (auth.error) return auth

  if (!auth.isAdminOrModerador) {
    return {
      ...auth,
      error: "Acesso restrito a administradores e moderadores",
      statusCode: 403
    }
  }

  return auth
}

/**
 * Verifica se pode gerenciar um perfil específico
 * - Admin pode gerenciar qualquer um
 * - Moderador pode gerenciar todos EXCETO outros admins
 */
export async function canManageProfile(targetUserId: string): Promise<AuthCheckResult> {
  const auth = await checkAuth()

  if (auth.error) return auth

  // Se não é admin nem moderador, não pode gerenciar ninguém
  if (!auth.isAdminOrModerador) {
    return {
      ...auth,
      error: "Acesso restrito",
      statusCode: 403
    }
  }

  // Admin pode tudo
  if (auth.isAdmin) {
    return auth
  }

  // Moderador: verificar se o alvo é admin
  const admin = createAdminClient()
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", targetUserId)
    .single()

  if (targetProfile?.role === "admin") {
    return {
      ...auth,
      error: "Moderadores não podem gerenciar administradores",
      statusCode: 403
    }
  }

  return auth
}

/**
 * Verifica se pode criar um perfil com determinada role
 * - Admin pode criar qualquer role
 * - Moderador pode criar: moderador, gestor, cliente (NÃO admin)
 */
export async function canCreateRole(role: UserRole): Promise<AuthCheckResult> {
  const auth = await checkAuth()

  if (auth.error) return auth

  if (!auth.isAdminOrModerador) {
    return {
      ...auth,
      error: "Acesso restrito",
      statusCode: 403
    }
  }

  // Admin pode criar qualquer coisa
  if (auth.isAdmin) {
    return auth
  }

  // Moderador não pode criar admin
  if (role === "admin") {
    return {
      ...auth,
      error: "Moderadores não podem criar administradores",
      statusCode: 403
    }
  }

  return auth
}

/**
 * Verifica se pode alterar a role de um usuário
 * - Admin pode alterar qualquer role
 * - Moderador pode alterar para: moderador, gestor, cliente (NÃO admin)
 * - Moderador NÃO pode alterar a role de um admin existente
 */
export async function canUpdateRole(
  targetUserId: string, 
  newRole: UserRole
): Promise<AuthCheckResult> {
  const auth = await checkAuth()

  if (auth.error) return auth

  if (!auth.isAdminOrModerador) {
    return {
      ...auth,
      error: "Acesso restrito",
      statusCode: 403
    }
  }

  // Admin pode fazer tudo
  if (auth.isAdmin) {
    return auth
  }

  // Moderador não pode promover para admin
  if (newRole === "admin") {
    return {
      ...auth,
      error: "Moderadores não podem promover usuários a administradores",
      statusCode: 403
    }
  }

  // Verificar role atual do alvo
  const admin = createAdminClient()
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", targetUserId)
    .single()

  // Moderador não pode alterar a role de um admin existente
  if (targetProfile?.role === "admin") {
    return {
      ...auth,
      error: "Moderadores não podem alterar a role de administradores",
      statusCode: 403
    }
  }

  return auth
}
