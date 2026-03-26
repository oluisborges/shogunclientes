import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const adminClient = createAdminClient()

    // Buscar todas as contas Meta únicas dos clientes
    const { data: clients, error } = await adminClient
      .from("clients")
      .select("meta_account_id, business_name")
      .not("meta_account_id", "is", null)
      .eq("active", true)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Agrupar por meta_account_id e mostrar quais clientes já usam
    const accountsMap = new Map()
    
    clients?.forEach(client => {
      const accountId = client.meta_account_id
      if (!accountsMap.has(accountId)) {
        accountsMap.set(accountId, {
          meta_account_id: accountId,
          clients: []
        })
      }
      accountsMap.get(accountId).clients.push(client.business_name)
    })

    const accounts = Array.from(accountsMap.values())

    return NextResponse.json(accounts)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar contas disponíveis" },
      { status: 500 }
    )
  }
}
