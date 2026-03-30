import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// PUT /api/admin/admin-users/[id] - Atualizar usuário admin ou moderador
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    console.log("[PUT /api/admin/admin-users] Iniciando atualização para ID:", userId)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log("[PUT] Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se é admin
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    console.log("[PUT] Perfil do solicitante:", profile, "User ID:", user.id)

    if (profile?.role !== "admin" && profile?.role !== "moderador") {
      console.log("[PUT] Acesso negado, role:", profile?.role)
      return NextResponse.json({ error: "Acesso restrito a administradores e moderadores" }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, role } = body

    console.log("[PUT] Dados recebidos:", { full_name, role, targetId: userId })

    // Moderador não pode promover alguém para admin ou alterar admins
    if (profile?.role === "moderador") {
      const { data: targetProfile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()
      
      if (targetProfile?.role === "admin") {
        return NextResponse.json({ error: "Moderadores não podem alterar administradores" }, { status: 403 })
      }
      
      if (role === "admin") {
        return NextResponse.json({ error: "Moderadores não podem promover usuários a administradores" }, { status: 403 })
      }
    }

    // Validações
    if (!full_name || !role) {
      console.log("[PUT] Campos faltando")
      return NextResponse.json({ error: "Nome e role são obrigatórios" }, { status: 400 })
    }

    if (!["admin", "moderador"].includes(role)) {
      console.log("[PUT] Role inválido:", role)
      return NextResponse.json({ error: "Role inválido" }, { status: 400 })
    }

    console.log("[PUT] Atualizando perfil ID:", userId)

    // Atualizar perfil
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        full_name,
        role,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)

    if (updateError) {
      console.error("[PUT] Erro ao atualizar:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log("[PUT] Sucesso! Usuário atualizado:", userId)

    return NextResponse.json({ message: "Usuário atualizado com sucesso" })
  } catch (err) {
    console.error("[PUT] Erro 500:", err)
    return NextResponse.json({ error: "Erro ao atualizar usuário", details: String(err) }, { status: 500 })
  }
}

// DELETE /api/admin/admin-users/[id] - Remover usuário admin ou moderador
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    console.log("[DELETE /api/admin/admin-users] Removendo usuário:", userId)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se é admin
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin" && profile?.role !== "moderador") {
      return NextResponse.json({ error: "Acesso restrito a administradores e moderadores" }, { status: 403 })
    }

    // Moderador não pode deletar admins
    if (profile?.role === "moderador") {
      const { data: targetProfile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()
      
      if (targetProfile?.role === "admin") {
        return NextResponse.json({ error: "Moderadores não podem remover administradores" }, { status: 403 })
      }
    }

    // Não permitir que admin delete a si mesmo
    if (userId === user.id) {
      return NextResponse.json({ error: "Você não pode remover seu próprio usuário" }, { status: 403 })
    }

    // Verificar se o usuário a ser deletado é admin ou moderador
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (!targetProfile || !["admin", "moderador"].includes(targetProfile.role)) {
      return NextResponse.json({ error: "Usuário não encontrado ou não é admin/moderador" }, { status: 404 })
    }

    // Deletar usuário do Auth
    const { error: authError } = await admin.auth.admin.deleteUser(userId)

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // O perfil será deletado automaticamente por cascade

    return NextResponse.json({ message: "Usuário removido com sucesso" })
  } catch (err) {
    return NextResponse.json({ error: "Erro ao remover usuário" }, { status: 500 })
  }
}
