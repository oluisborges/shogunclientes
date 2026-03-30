import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST /api/admin/users/[id]/block - bloqueia/desbloqueia um perfil
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verifica se é admin ou moderador
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin" && profile?.role !== "moderador") {
      return NextResponse.json({ error: "Acesso restrito a administradores e moderadores" }, { status: 403 })
    }

    const body = await request.json()
    const { blocked } = body

    if (typeof blocked !== "boolean") {
      return NextResponse.json({ error: "blocked deve ser booleano" }, { status: 400 })
    }

    const userId = params.id

    // Não permite bloquear outros admins
    if (blocked) {
      const { data: targetProfile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()

      if (targetProfile?.role === "admin") {
        return NextResponse.json({ error: "Não pode bloquear outro administrador" }, { status: 403 })
      }
    }

    // Bloqueia/desbloqueia o usuário no Supabase Auth
    const { error: authError } = await admin.auth.admin.updateUserById(
      userId,
      { 
        user_metadata: { 
          blocked,
          blocked_at: blocked ? new Date().toISOString() : null 
        } 
      }
    )

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Também atualiza na tabela profiles (backup)
    const { error: profileError } = await admin
      .from("profiles")
      .update({ 
        blocked,
        blocked_at: blocked ? new Date().toISOString() : null 
      })
      .eq("id", userId)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: blocked ? "Perfil bloqueado com sucesso!" : "Perfil desbloqueado com sucesso!" 
    })
  } catch (err) {
    return NextResponse.json({ error: "Erro ao bloquear/desbloquear perfil" }, { status: 500 })
  }
}
