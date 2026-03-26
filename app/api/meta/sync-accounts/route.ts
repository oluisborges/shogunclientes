import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

interface MetaAdAccount {
  id: string
  name: string
  account_status: number
  currency: string
}

interface MetaBusiness {
  id: string
  name: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { data: profile } = await supabase
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

  const cookieStore = await cookies()
  const accessToken = cookieStore.get("meta_access_token")?.value

  if (!accessToken) {
    return NextResponse.json(
      { error: "Token de acesso não encontrado. Faça login com Meta primeiro." },
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

    const businessesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/businesses?` +
        `access_token=${accessToken}&` +
        `fields=id,name&` +
        `limit=100`
    )

    let businesses: MetaBusiness[] = []
    if (businessesResponse.ok) {
      const businessesData = await businessesResponse.json()
      businesses = businessesData.data || []
    }

    const syncedClients = []
    const errors = []

    for (const account of adAccounts) {
      const accountId = account.id.replace("act_", "")
      const businessName =
        businesses.find((b) => account.name.includes(b.name))?.name ||
        account.name

      try {
        const { data: existingClient } = await supabase
          .from("clients")
          .select("id")
          .eq("meta_account_id", account.id)
          .single()

        if (existingClient) {
          const { error: updateError } = await supabase
            .from("clients")
            .update({
              meta_access_token: accessToken,
              meta_token_expires: new Date(
                Date.now() + 60 * 24 * 60 * 60 * 1000
              ).toISOString(),
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
              name: businessName,
              updated: true,
            })
          }
        } else {
          const { data: newClient, error: insertError } = await supabase
            .from("clients")
            .insert({
              business_name: businessName,
              meta_account_id: account.id,
              meta_access_token: accessToken,
              meta_token_expires: new Date(
                Date.now() + 60 * 24 * 60 * 60 * 1000
              ).toISOString(),
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
              name: businessName,
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
    console.error("Sync error:", err)
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erro ao sincronizar contas",
      },
      { status: 500 }
    )
  }
}
