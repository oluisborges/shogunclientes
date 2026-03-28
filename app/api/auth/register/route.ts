import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// Basic RFC-5322 simplified email check
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  // Rate limit: max 5 registrations per IP per 10 minutes
  const ip = getClientIp(req)
  const rl = rateLimit(ip, { prefix: "register", limit: 5, windowSec: 600 })
  if (!rl.success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  const body = await req.json()
  const { full_name, business_name, cnpj, email, password } = body

  if (!full_name?.trim() || !business_name?.trim() || !email?.trim() || !password) {
    return NextResponse.json(
      { error: "Todos os campos obrigatórios devem ser preenchidos" },
      { status: 400 }
    )
  }

  // Email format validation
  if (!EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Endereço de e-mail inválido" }, { status: 400 })
  }

  // Password strength: min 8 chars, at least one letter and one number
  if (password.length < 8) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 8 caracteres" },
      { status: 400 }
    )
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json(
      { error: "A senha deve conter letras e números" },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // Check if email is already in pending_registrations
  const { data: existing } = await admin
    .from("pending_registrations")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: "Este e-mail já possui um cadastro aguardando aprovação" },
      { status: 409 }
    )
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
    // Generic message — don't leak internal details
    return NextResponse.json({ error: "Erro ao criar conta. Verifique os dados e tente novamente." }, { status: 400 })
  }

  // Store extra registration details
  const { error: regError } = await admin.from("pending_registrations").insert({
    user_id: authData.user.id,
    full_name: full_name.trim(),
    business_name: business_name.trim(),
    cnpj: cnpj ? cnpj.replace(/\D/g, "") : null,
    email: email.trim().toLowerCase(),
  })

  if (regError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: "Erro ao registrar dados. Tente novamente." }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
