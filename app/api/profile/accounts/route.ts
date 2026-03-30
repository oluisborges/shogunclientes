import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/profile/accounts - retorna as contas de anúncio que o usuário tem acesso
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const admin = createAdminClient()

    // Busca contas próprias (onde o usuário é o profile_id)
    const { data: ownClients } = await admin
      .from("clients")
      .select("id, business_name, meta_account_id")
      .eq("profile_id", user.id)
      .eq("active", true)

    // Busca contas com acesso via user_client_access
    const { data: accessClients } = await admin
      .from("user_client_access")
      .select(`
        id,
        client_id,
        access_level,
        clients (
          id,
          business_name,
          meta_account_id
        )
      `)
      .eq("user_id", user.id)

    // Combina os resultados
    const accounts: Array<{
      id: string
      client_id: string
      business_name: string
      meta_account_id: string | null
      access_level: string
      is_owner: boolean
    }> = []

    // Adiciona contas próprias
    if (ownClients) {
      for (const client of ownClients) {
        accounts.push({
          id: client.id,
          client_id: client.id,
          business_name: client.business_name,
          meta_account_id: client.meta_account_id,
          access_level: "owner",
          is_owner: true,
        })
      }
    }

    // Adiciona contas com acesso
    if (accessClients) {
      for (const access of accessClients) {
        const client = access.clients as unknown as { id: string; business_name: string; meta_account_id: string | null } | null
        if (client && !accounts.find(a => a.client_id === client.id)) {
          accounts.push({
            id: access.id,
            client_id: client.id,
            business_name: client.business_name,
            meta_account_id: client.meta_account_id,
            access_level: access.access_level,
            is_owner: false,
          })
        }
      }
    }

    // Ordena por nome
    accounts.sort((a, b) => a.business_name.localeCompare(b.business_name))

    return NextResponse.json(accounts)
  } catch (err) {
    return NextResponse.json({ error: "Erro ao carregar contas" }, { status: 500 })
  }
}
