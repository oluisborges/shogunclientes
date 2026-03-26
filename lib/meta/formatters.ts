import type { MetaCampaign, MetaAdSet, MetaAd } from "@/types/meta"
import type {
  ParsedCampaignMetrics,
  ParsedAdSetMetrics,
  ParsedAdMetrics,
  AggregatedMetrics,
} from "./types"

function getActionValue(
  actions: Array<{ action_type: string; value: string }> | undefined,
  actionType: string
): number {
  if (!actions) return 0
  const action = actions.find((a) => a.action_type === actionType)
  return action ? parseFloat(action.value) : 0
}

export function parseCampaign(campaign: MetaCampaign): ParsedCampaignMetrics {
  const insights = campaign.insights?.data?.[0]
  const spend = insights ? parseFloat(insights.spend) : 0
  const conversions = insights
    ? getActionValue(insights.actions, "purchase")
    : 0
  const revenue = insights
    ? getActionValue(insights.action_values, "purchase")
    : 0

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    objective: campaign.objective,
    spend,
    impressions: insights ? parseInt(insights.impressions) : 0,
    clicks: insights ? parseInt(insights.clicks) : 0,
    ctr: insights ? parseFloat(insights.ctr) : 0,
    cpc: insights ? parseFloat(insights.cpc) : 0,
    conversions,
    revenue,
    cpa: conversions > 0 ? spend / conversions : 0,
    roas: spend > 0 ? revenue / spend : 0,
  }
}

export function parseAdSet(adset: MetaAdSet): ParsedAdSetMetrics {
  const insights = adset.insights?.data?.[0]
  const spend = insights ? parseFloat(insights.spend) : 0
  const conversions = insights
    ? getActionValue(insights.actions, "purchase")
    : 0

  return {
    id: adset.id,
    name: adset.name,
    status: adset.status,
    campaignId: adset.campaign_id,
    dailyBudget: parseFloat(adset.daily_budget || "0"),
    spend,
    impressions: insights ? parseInt(insights.impressions) : 0,
    clicks: insights ? parseInt(insights.clicks) : 0,
    ctr: insights ? parseFloat(insights.ctr) : 0,
    cpc: insights ? parseFloat(insights.cpc) : 0,
    conversions,
    cpa: conversions > 0 ? spend / conversions : 0,
  }
}

export function parseAd(ad: MetaAd): ParsedAdMetrics {
  const insights = ad.insights?.data?.[0]
  const spend = insights ? parseFloat(insights.spend) : 0
  const conversions = insights
    ? getActionValue(insights.actions, "purchase")
    : 0

  return {
    id: ad.id,
    name: ad.name,
    status: ad.status,
    adsetId: ad.adset_id,
    thumbnailUrl: ad.creative?.thumbnail_url ?? null,
    creativeTitle: ad.creative?.title ?? null,
    creativeBody: ad.creative?.body ?? null,
    spend,
    impressions: insights ? parseInt(insights.impressions) : 0,
    clicks: insights ? parseInt(insights.clicks) : 0,
    ctr: insights ? parseFloat(insights.ctr) : 0,
    cpc: insights ? parseFloat(insights.cpc) : 0,
    conversions,
    cpa: conversions > 0 ? spend / conversions : 0,
  }
}

export function aggregateMetrics(
  campaigns: ParsedCampaignMetrics[]
): AggregatedMetrics {
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0)
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0)
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)

  return {
    totalSpend,
    totalConversions,
    totalRevenue,
    avgCpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
    avgRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    totalImpressions,
    totalClicks,
    avgCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
  }
}
