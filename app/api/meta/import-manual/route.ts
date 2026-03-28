import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

interface MetaAdAccount {
  id: string
  name: string
  account_status: number
  currency: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role === "client") {
    return NextResponse.json(
      { error: "Permissões insuficientes" },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { accessToken } = body

  if (!accessToken) {
    return NextResponse.json(
      { error: "Token de acesso é obrigatório" },
      { status: 400 }
    )
  }

  try {
    const adAccountsResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?` +
        `access_token=${accessToken}&` +
        `fields=id,name,account_status,currency&` +
        `limit=100`
    )

    if (!adAccountsResponse.ok) {
      const errorData = await adAccountsResponse.json()
      throw new Error(
        errorData.error?.message || "Erro ao buscar contas de anúncios"
      )
    }

    const adAccountsData = await adAccountsResponse.json()
    const adAccounts: MetaAdAccount[] = adAccountsData.data || []

    if (adAccounts.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma conta de anúncios encontrada" },
        { status: 404 }
      )
    }

    const syncedClients = []
    const errors = []

    for (const account of adAccounts) {
      try {
        const { data: existingClient } = await adminClient
          .from("clients")
          .select("id")
          .eq("meta_account_id", account.id)
          .single()

        if (existingClient) {
          const { error: updateError } = await adminClient
            .from("clients")
            .update({
              active: account.account_status === 1,
            })
            .eq("id", existingClient.id)

          if (updateError) {
            errors.push({
              account: account.name,
              error: updateError.message,
            })
          } else {
            syncedClients.push({
              id: existingClient.id,
              name: account.name,
              updated: true,
            })
          }
        } else {
          const { data: newClient, error: insertError } = await adminClient
            .from("clients")
            .insert({
              business_name: account.name,
              meta_account_id: account.id,
              active: account.account_status === 1,
            })
            .select()
            .single()

          if (insertError) {
            errors.push({
              account: account.name,
              error: insertError.message,
            })
          } else {
            syncedClients.push({
              id: newClient.id,
              name: account.name,
              updated: false,
            })
          }
        }
      } catch (err) {
        errors.push({
          account: account.name,
          error: err instanceof Error ? err.message : "Erro desconhecido",
        })
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedClients.length,
      total: adAccounts.length,
      clients: syncedClients,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error("Import error:", err)
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erro ao importar contas",
      },
      { status: 500 }
    )
  }
}
