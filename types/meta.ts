export interface MetaAction {
  action_type: string
  value: string
}

export interface MetaActionValue {
  action_type: string
  value: string
}

export interface MetaInsights {
  spend: string
  impressions: string
  clicks: string
  ctr: string
  cpc: string
  cpp: string
  actions?: MetaAction[]
  action_values?: MetaActionValue[]
  date_start: string
  date_stop: string
}

export interface MetaCampaign {
  id: string
  name: string
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED"
  objective: string
  insights?: { data: MetaInsights[] }
}

export interface MetaAdSet {
  id: string
  name: string
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED"
  campaign_id: string
  daily_budget: string
  targeting?: Record<string, unknown>
  insights?: { data: MetaInsights[] }
}

export interface MetaCreative {
  thumbnail_url: string | null
  title: string | null
  body: string | null
}

export interface MetaAd {
  id: string
  name: string
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED"
  adset_id: string
  creative?: MetaCreative
  insights?: { data: MetaInsights[] }
}

export interface MetaApiResponse<T> {
  data: T[]
  paging?: {
    cursors?: {
      before: string
      after: string
    }
    next?: string
  }
}

export interface MetaApiError {
  error: {
    message: string
    type: string
    code: number
    fbtrace_id: string
  }
}
