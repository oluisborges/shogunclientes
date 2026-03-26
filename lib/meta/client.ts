const META_GRAPH_BASE = "https://graph.facebook.com/v19.0"

interface MetaRequestOptions {
  endpoint: string
  accessToken: string
  params?: Record<string, string>
}

export async function metaFetch<T>({
  endpoint,
  accessToken,
  params = {},
}: MetaRequestOptions): Promise<T> {
  const searchParams = new URLSearchParams({
    access_token: accessToken,
    ...params,
  })

  const response = await fetch(`${META_GRAPH_BASE}${endpoint}?${searchParams}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Meta API error: ${error.error?.message ?? response.statusText}`
    )
  }

  return response.json()
}

export const CAMPAIGN_FIELDS = [
  "id",
  "name",
  "status",
  "objective",
  "insights.date_preset(last_30d){spend,impressions,clicks,ctr,cpc,cpp,actions,action_values}",
].join(",")

export const ADSET_FIELDS = [
  "id",
  "name",
  "status",
  "campaign_id",
  "daily_budget",
  "targeting",
  "insights.date_preset(last_30d){spend,impressions,clicks,ctr,cpc,cpp,actions,action_values}",
].join(",")

export const AD_FIELDS = [
  "id",
  "name",
  "status",
  "adset_id",
  "creative{thumbnail_url,title,body}",
  "insights.date_preset(last_30d){spend,impressions,clicks,ctr,cpc,cpp,actions,action_values}",
].join(",")
