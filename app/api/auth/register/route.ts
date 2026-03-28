import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  const { full_name, business_name, cnpj, email, password } = await req.json()

  if (!full_name?.trim() || !business_name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Todos os campos obrigatórios devem ser preenchidos" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
  }

  const admin = createAdminClient()

  // Check if email is already in pending_registrations
  const { data: existing } = await admin
    .from("pending_registrations")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "Este e-mail já possui um cadastro aguardando aprovação" }, { status: 409 })
  }

  // Create auth user with pending status in metadata
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { status: "pending" },
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes("already registered")) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado" }, { status: 409 })
    }
    return NextResponse.json({ error: authError?.message ?? "Erro ao criar conta" }, { status: 400 })
  }

  // Store extra registration details
  const { error: regError } = await admin.from("pending_registrations").insert({
    user_id:       authData.user.id,
    full_name:     full_name.trim(),
    business_name: business_name.trim(),
    cnpj:          cnpj ? cnpj.replace(/\D/g, "") : null,
    email:         email.trim().toLowerCase(),
  })

  if (regError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: regError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
