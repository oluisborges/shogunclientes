export interface ParsedCampaignMetrics {
  id: string
  name: string
  status: string
  objective: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  revenue: number
  cpa: number
  roas: number
}

export interface ParsedAdSetMetrics {
  id: string
  name: string
  status: string
  campaignId: string
  dailyBudget: number
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  cpa: number
}

export interface ParsedAdMetrics {
  id: string
  name: string
  status: string
  adsetId: string
  thumbnailUrl: string | null
  creativeTitle: string | null
  creativeBody: string | null
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  cpa: number
}

export interface AggregatedMetrics {
  totalSpend: number
  totalConversions: number
  totalRevenue: number
  avgCpa: number
  avgRoas: number
  totalImpressions: number
  totalClicks: number
  avgCtr: number
}

export interface DailyMetrics {
  date: string
  spend: number
  revenue: number
  conversions: number
  cpa: number
}
