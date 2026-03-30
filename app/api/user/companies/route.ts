import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const admin = createAdminClient()

    // Buscar clientes vinculados ao usuário
    const { data: profileClients, error: profileError } = await admin
      .from("clients")
      .select("business_name, meta_account_id, active")
      .eq("profile_id", user.id)
      .eq("active", true)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Buscar acessos adicionais a outros clientes
    const { data: accessClients, error: accessError } = await admin
      .from("user_client_access")
      .select(`
        clients!inner (
          business_name,
          meta_account_id,
          active
        )
      `)
      .eq("user_id", user.id)
      .eq("clients.active", true)

    if (accessError) {
      return NextResponse.json({ error: accessError.message }, { status: 500 })
    }

    // Combinar e remover duplicatas
    const allCompanies = [
      ...(profileClients || []),
      ...(accessClients?.map((access: any) => access.clients) || [])
    ]

    // Remover duplicatas pelo business_name
    const uniqueCompanies = allCompanies.filter((company, index, self) =>
      index === self.findIndex((c) => c.business_name === company.business_name)
    )

    return NextResponse.json({
      companies: uniqueCompanies,
      total: uniqueCompanies.length
    })

  } catch (err) {
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "Erro ao buscar empresas" 
    }, { status: 500 })
  }
}
