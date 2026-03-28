import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// This endpoint is restricted to admins only.
// It must never be reachable by regular authenticated users.
export async function POST(request: NextRequest) {
  // Block entirely in production unless explicitly unlocked
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEBUG_ROUTES !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  // Verify the caller is an admin before allowing role changes
  const adminClient = createAdminClient()
  const { data: callerProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 })
  }

  const body = await request.json()
  const { role } = body

  if (!role || !["admin", "gestor", "client"].includes(role)) {
    return NextResponse.json(
      { error: "Role inválido. Use: admin, gestor ou client" },
      { status: 400 }
    )
  }

  const { data: profile } = await adminClient
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
        { error: "Erro ao criar perfil" },
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
      { error: "Erro ao atualizar role" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: `Role atualizado para: ${role}`,
    profile: updatedProfile,
  })
}
