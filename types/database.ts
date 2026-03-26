export type UserRole = "admin" | "gestor" | "client"

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Client {
  id: string
  profile_id: string
  business_name: string
  cnpj: string | null
  meta_account_id: string | null
  meta_access_token: string | null
  meta_token_expires: string | null
  active: boolean
  created_at: string
}

export interface Goal {
  id: string
  client_id: string
  year: number
  month: number
  target_units: number
  target_revenue: number | null
  notes: string | null
  created_at: string
}

export interface GoalProgress {
  id: string
  goal_id: string
  week_number: number
  units_sold: number
  revenue: number
  notes: string | null
  updated_at: string
}

export interface SalesHistory {
  id: string
  client_id: string
  week_ref: string
  period_start: string
  period_end: string
  units_sold: number | null
  revenue: number | null
  avg_ticket: number | null
  meta_spend: number | null
  meta_synced_at: string | null
  notes: string | null
  created_at: string
}

export interface MetaCache {
  id: string
  client_id: string
  cache_key: string
  payload: Record<string, unknown>
  fetched_at: string
  expires_at: string
}
