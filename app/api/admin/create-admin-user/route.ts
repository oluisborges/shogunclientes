import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * API para criar usuário admin
 * 
 * Acesse: http://localhost:3000/api/admin/create-admin-user
 * 
 * Cria o usuário: leandrotogawa@gmail.com com senha: mudar@1234
 */
export async function GET() {
  try {
    const admin = createAdminClient()
    
    const email = 'leandrotogawa@gmail.com'
    const password = 'mudar@1234'
    const fullName = 'Leandro Togawa'

    // Tentar criar usuário
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    })

    // Se usuário já existe, atualizar
    if (authError?.message.includes('already registered')) {
      const { data: users } = await admin.auth.admin.listUsers()
      const existingUser = users?.users.find(u => u.email === email)
      
      if (!existingUser) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      // Atualizar senha
      await admin.auth.admin.updateUserById(existingUser.id, { password })

      // Atualizar perfil para admin
      const { error: profileError } = await admin
        .from('profiles')
        .update({ 
          role: 'admin',
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)

      if (profileError) {
        return NextResponse.json({ 
          error: profileError.message,
          details: 'Erro ao atualizar perfil'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Usuário admin atualizado com sucesso!',
        user: {
          id: existingUser.id,
          email,
          full_name: fullName,
          role: 'admin'
        },
        credentials: {
          email,
          password,
          note: 'Senha atualizada'
        }
      })
    }

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Usuário não foi criado' }, { status: 500 })
    }

    // Atualizar perfil para admin
    const { error: profileError } = await admin
      .from('profiles')
      .update({ 
        role: 'admin',
        full_name: fullName,
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id)

    // Se não conseguir atualizar, tentar inserir
    if (profileError) {
      await admin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário admin criado com sucesso!',
      user: {
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'admin'
      },
      credentials: {
        email,
        password,
        note: 'Use estas credenciais para fazer login'
      }
    })

  } catch (err) {
    return NextResponse.json({ 
      error: 'Erro ao criar usuário admin',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}
