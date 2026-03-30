import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const adminClient = createAdminClient()

  // Check role: admins see all clients; others see based on access
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdminOrModerador = profile?.role === "admin" || profile?.role === "moderador"

  if (isAdminOrModerador) {
    // Admins e moderadores veem todos os clientes ativos
    const { data: clients, error } = await adminClient
      .from("clients")
      .select("id, business_name, meta_account_id")
      .eq("active", true)
      .not("profile_id", "is", null)
      .order("business_name")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(clients || [])
  }

  // Para não-admins: busca clientes via profile_id OU via user_client_access
  const [ownClientsResult, accessClientsResult] = await Promise.all([
    // Clientes onde o usuário é o dono (profile_id)
    adminClient
      .from("clients")
      .select("id, business_name, meta_account_id")
      .eq("profile_id", user.id)
      .eq("active", true),
    // Clientes com acesso via user_client_access
    adminClient
      .from("user_client_access")
      .select("client_id, clients(id, business_name, meta_account_id)")
      .eq("user_id", user.id)
  ])

  // Combina os resultados removendo duplicatas
  const clientsMap = new Map<string, { id: string; business_name: string; meta_account_id: string | null }>()

  // Adiciona clientes próprios
  if (ownClientsResult.data) {
    for (const client of ownClientsResult.data) {
      clientsMap.set(client.id, client)
    }
  }

  // Adiciona clientes com acesso
  if (accessClientsResult.data) {
    for (const access of accessClientsResult.data) {
      const clientData = access.clients as unknown as { id: string; business_name: string; meta_account_id: string | null } | null
      if (clientData && !clientsMap.has(clientData.id)) {
        clientsMap.set(clientData.id, clientData)
      }
    }
  }

  // Converte para array e ordena por nome
  const clients = Array.from(clientsMap.values()).sort((a, b) => 
    a.business_name.localeCompare(b.business_name)
  )

  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { business_name, meta_account_id } = body

    if (!business_name) {
      return NextResponse.json(
        { error: "Nome do cliente é obrigatório" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { data: client, error } = await adminClient
      .from("clients")
      .insert({
        business_name,
        meta_account_id: meta_account_id || null,
        active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 }
    )
  }
}
