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
  landingPageViews: number
  reach: number
  menuConversionRate: number
  avgPurchaseValue: number
}

export interface ParsedAdSetMetrics {
  id: string
  name: string
  status: string
  campaignId: string
  campaignName: string
  dailyBudget: number
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  revenue: number
  cpa: number
  roas: number
  landingPageViews: number
  reach: number
  menuConversionRate: number
  avgPurchaseValue: number
}

export interface ParsedAdMetrics {
  id: string
  name: string
  status: string
  adsetId: string
  adsetName: string
  thumbnailUrl: string | null
  imageUrl: string | null
  creativeTitle: string | null
  creativeBody: string | null
  videoId: string | null
  objectType: string | null
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  revenue: number
  cpa: number
  roas: number
  landingPageViews: number
  reach: number
  menuConversionRate: number
  avgPurchaseValue: number
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
