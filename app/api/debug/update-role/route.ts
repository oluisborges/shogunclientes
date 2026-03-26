import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const body = await request.json()
  const { role } = body

  if (!role || !["admin", "gestor", "client"].includes(role)) {
    return NextResponse.json(
      { error: "Role inválido. Use: admin, gestor ou client" },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single()

  if (!profile) {
    const { data: newProfile, error: insertError } = await adminClient
      .from("profiles")
      .insert({
        id: user.id,
        role: role,
        full_name: user.email?.split("@")[0] || "Usuário",
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: `Erro ao criar perfil: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Perfil criado com sucesso",
      profile: newProfile,
    })
  }

  const { data: updatedProfile, error: updateError } = await adminClient
    .from("profiles")
    .update({ role })
    .eq("id", user.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json(
      { error: `Erro ao atualizar role: ${updateError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: `Role atualizado para: ${role}`,
    profile: updatedProfile,
  })
}
