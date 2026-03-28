import { createAdminClient } from "@/lib/supabase/admin"

interface ClientCredentials {
  accountId: string
  accessToken: string
}

/**
 * Returns the Meta account ID and access token for a given client.
 * Falls back to the global token (app_settings.meta_global_token) if the
 * client has no per-client token configured.
 */
export async function getClientMetaCredentials(
  clientId: string
): Promise<ClientCredentials | { error: string; status: number }> {
  const admin = createAdminClient()

  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("meta_account_id, meta_access_token")
    .eq("id", clientId)
    .single()

  if (clientError || !client?.meta_account_id) {
    return {
      error: "Conta Meta não configurada. Entre em contato com o suporte pelo grupo do Shogun.",
      status: 404,
    }
  }

  let accessToken: string | null = client.meta_access_token ?? null

  if (!accessToken) {
    const { data: setting } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "meta_global_token")
      .single()
    accessToken = setting?.value ?? null
  }

  if (!accessToken) {
    return {
      error: "Token Meta não configurado. Entre em contato com o suporte pelo grupo do Shogun.",
      status: 404,
    }
  }

  return { accountId: client.meta_account_id, accessToken }
}
