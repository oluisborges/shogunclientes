import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se é admin
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 })
    }

    const { email, full_name, role } = await request.json()

    if (!email || !full_name || !role) {
      return NextResponse.json({ error: "email, full_name e role são obrigatórios" }, { status: 400 })
    }

    if (!["admin", "moderador"].includes(role)) {
      return NextResponse.json({ error: "role deve ser 'admin' ou 'moderador'" }, { status: 400 })
    }

    // 1. Buscar usuário no Auth pelo email
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 })
    
    if (authError) {
      return NextResponse.json({ error: "Erro ao buscar usuários no Auth" }, { status: 500 })
    }

    const authUser = authUsers.users.find(u => u.email === email)
    
    if (!authUser) {
      return NextResponse.json({ error: "Usuário não encontrado no Auth" }, { status: 404 })
    }

    // 2. Verificar se já existe perfil
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single()

    if (existingProfile) {
      return NextResponse.json({ 
        error: "Usuário já tem perfil", 
        existingProfile 
      }, { status: 409 })
    }

    // 3. Criar o perfil perdido
    const { data: newProfile, error: profileError } = await admin
      .from("profiles")
      .insert({
        id: authUser.id,
        full_name,
        role
      })
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: `Erro ao criar perfil: ${profileError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Usuário resgatado com sucesso!",
      user: {
        id: authUser.id,
        email: authUser.email,
        full_name,
        role,
        created_at: authUser.created_at
      },
      profile: newProfile
    })

  } catch (err) {
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se é admin
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 })
    }

    // Buscar todos os usuários do Auth
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 })
    
    if (authError) {
      return NextResponse.json({ error: "Erro ao buscar usuários no Auth" }, { status: 500 })
    }

    // Buscar todos os perfis
    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("*")
    
    if (profilesError) {
      return NextResponse.json({ error: "Erro ao buscar perfis" }, { status: 500 })
    }

    // Encontrar usuários órfãos (estão no Auth mas não têm perfil)
    const profileIds = (profiles || []).map(p => p.id)
    const orphanUsers = authUsers.users.filter(user => !profileIds.includes(user.id))

    return NextResponse.json({
      totalAuthUsers: authUsers.users.length,
      totalProfiles: profiles?.length || 0,
      orphanUsers: orphanUsers.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: user.user_metadata,
        last_sign_in_at: user.last_sign_in_at
      }))
    })

  } catch (err) {
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}
