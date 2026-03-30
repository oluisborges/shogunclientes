import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "admin" && profile?.role !== "moderador") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

    const { id: userId } = await params
    const body = await request.json()
    const { email, password, full_name, business_name, cnpj, meta_account_id, niche, gestor_id } = body

    // Atualiza auth (email e/ou senha)
    const authUpdate: { email?: string; password?: string } = {}
    if (email) authUpdate.email = email
    if (password) authUpdate.password = password
    if (Object.keys(authUpdate).length > 0) {
      const { error } = await admin.auth.admin.updateUserById(userId, authUpdate)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Atualiza perfil (nome)
    if (full_name !== undefined) {
      await admin.from("profiles").update({ full_name }).eq("id", userId)
    }

    // Atualiza dados do cliente
    const clientUpdate: Record<string, unknown> = {}
    if (business_name !== undefined) clientUpdate.business_name = business_name
    if (cnpj !== undefined) clientUpdate.cnpj = cnpj ? cnpj.replace(/\D/g, "") : null
    if (meta_account_id !== undefined) clientUpdate.meta_account_id = meta_account_id || null
    if (niche !== undefined) clientUpdate.niche = niche || null
    if (gestor_id !== undefined) clientUpdate.gestor_id = gestor_id || null

    if (Object.keys(clientUpdate).length > 0) {
      await admin.from("clients").update(clientUpdate).eq("profile_id", userId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
