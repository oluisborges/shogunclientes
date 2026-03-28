import { createAdminClient } from "@/lib/supabase/admin"

interface ClientCredentials {
  accountId: string
  accessToken: string
}

/**
 * Returns the Meta account ID and the global access token for a given client.
 */
export async function getClientMetaCredentials(
  clientId: string
): Promise<ClientCredentials | { error: string; status: number }> {
  const admin = createAdminClient()

  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("meta_account_id")
    .eq("id", clientId)
    .single()

  if (clientError || !client?.meta_account_id) {
    return {
      error: "Conta Meta não configurada. Entre em contato com o suporte pelo grupo do Shogun.",
      status: 404,
    }
  }

  const { data: setting } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "meta_global_token")
    .single()

  const accessToken = setting?.value ?? null

  if (!accessToken) {
    return {
      error: "Token Meta não configurado. Entre em contato com o suporte pelo grupo do Shogun.",
      status: 404,
    }
  }

  return { accountId: client.meta_account_id, accessToken }
}
