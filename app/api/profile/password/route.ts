import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// PUT /api/profile/password - altera a senha do usuário
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { current_password, new_password } = body

    if (!current_password || !new_password) {
      return NextResponse.json(
        { error: "Senha atual e nova senha são obrigatórias" },
        { status: 400 }
      )
    }

    // Validação da nova senha
    if (new_password.length < 8) {
      return NextResponse.json(
        { error: "A nova senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      )
    }

    if (!/[A-Za-z]/.test(new_password) || !/[0-9]/.test(new_password)) {
      return NextResponse.json(
        { error: "A senha deve conter letras e números" },
        { status: 400 }
      )
    }

    // Verifica a senha atual fazendo login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: current_password,
    })

    if (signInError) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 400 }
      )
    }

    // Atualiza a senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    })

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: "Erro ao alterar senha" }, { status: 500 })
  }
}
