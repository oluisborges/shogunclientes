import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/admin/admin-users - Lista todos os usuários admin e moderador
export async function GET() {
  try {
    console.log("[GET /api/admin/admin-users] Iniciando...")
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log("[GET /api/admin/admin-users] Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log("[GET /api/admin/admin-users] Usuário autenticado:", user.id)

    // Verificar se é admin
    const admin = createAdminClient()
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    console.log("[GET /api/admin/admin-users] Perfil:", profile, "Erro:", profileError)

    if (profile?.role !== "admin" && profile?.role !== "moderador") {
      console.log("[GET /api/admin/admin-users] Usuário não é admin nem moderador, role:", profile?.role)
      return NextResponse.json({ error: "Acesso restrito a administradores e moderadores" }, { status: 403 })
    }

    // Buscar todos os usuários admin e moderador
    console.log("[GET /api/admin/admin-users] Buscando usuários admin e moderador...")
    const { data: adminProfiles, error } = await admin
      .from("profiles")
      .select("id, full_name, role, created_at")
      .in("role", ["admin", "moderador"])
      .order("created_at", { ascending: false })

    console.log("[GET /api/admin/admin-users] Perfis encontrados:", adminProfiles, "Erro:", error)

    if (error) {
      console.error("[GET /api/admin/admin-users] Erro ao buscar:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Buscar emails do auth.users para cada perfil
    const adminUsers = await Promise.all(
      (adminProfiles || []).map(async (profile) => {
        const { data: { user } } = await admin.auth.admin.getUserById(profile.id)
        return {
          ...profile,
          email: user?.email || "N/A"
        }
      })
    )

    console.log("[GET /api/admin/admin-users] Usuários com emails:", adminUsers)

    return NextResponse.json(adminUsers)
  } catch (err) {
    console.error("[GET /api/admin/admin-users] Erro geral:", err)
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 })
  }
}

// POST /api/admin/admin-users - Criar novo usuário admin ou moderador
export async function POST(request: Request) {
  try {
    console.log("[POST /api/admin/admin-users] Iniciando criação de usuário...")
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log("[POST] Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log("[POST] Usuário autenticado:", user.id)

    // Verificar se é admin
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    console.log("[POST] Perfil do solicitante:", profile)

    if (profile?.role !== "admin" && profile?.role !== "moderador") {
      console.log("[POST] Acesso negado, role:", profile?.role)
      return NextResponse.json({ error: "Acesso restrito a administradores e moderadores" }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, full_name, role } = body

    console.log("[POST] Dados recebidos:", { email, full_name, role, password: "***" })

    // Validações
    if (!email || !password || !full_name || !role) {
      console.log("[POST] Campos faltando")
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Moderador não pode criar admins
    if (profile?.role === "moderador" && role === "admin") {
      console.log("[POST] Moderador tentando criar admin - negado")
      return NextResponse.json({ error: "Moderadores não podem criar administradores" }, { status: 403 })
    }

    if (!["admin", "moderador"].includes(role)) {
      console.log("[POST] Role inválido:", role)
      return NextResponse.json({ error: "Role inválido" }, { status: 400 })
    }

    if (password.length < 8) {
      console.log("[POST] Senha muito curta")
      return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres" }, { status: 400 })
    }

    // Criar usuário no Supabase Auth
    console.log("[POST] Criando usuário no Auth...")
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    })

    if (authError) {
      console.error("[POST] Erro ao criar usuário no Auth:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (!authData.user) {
      console.error("[POST] Usuário não foi criado")
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }

    console.log("[POST] Usuário criado no Auth:", authData.user.id)

    // Criar ou atualizar perfil com role - sempre tentar INSERT primeiro
    console.log("[POST] Criando/atualizando perfil com role:", role)
    
    // Primeiro tentar inserir o perfil
    const { error: insertError } = await admin
      .from("profiles")
      .insert({
        id: authData.user.id,
        full_name,
        role
      })
    
    console.log("[POST] Resultado do INSERT perfil:", insertError)
    
    // Se o INSERT falhar porque já existe, tentar UPDATE
    if (insertError) {
      console.log("[POST] Perfil já existe, tentando UPDATE...")
      const { error: updateError } = await admin
        .from("profiles")
        .update({
          full_name,
          role
        })
        .eq("id", authData.user.id)
      
      console.log("[POST] Resultado do UPDATE perfil:", updateError)
      
      if (updateError) {
        console.error("[POST] Falha em ambas as operações de perfil:", insertError.message, updateError.message)
        return NextResponse.json({ error: `Erro ao criar perfil: ${updateError.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({
      id: authData.user.id,
      email,
      full_name,
      role,
      created_at: authData.user.created_at
    })
  } catch (err) {
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
  }
}
