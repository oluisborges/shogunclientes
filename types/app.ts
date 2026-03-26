export type StatusType = "active" | "paused" | "behind" | "on-track" | "unlocked" | "locked"

export type TrendDirection = "up" | "down" | "neutral"

export interface KpiCardProps {
  label: string
  value: string
  trend?: {
    value: string
    direction: TrendDirection
    isGood?: boolean
  }
  subtitle?: string
  topAccent?: boolean
}

export interface NavItem {
  label: string
  href: string
  icon: string
}

export interface ClientOption {
  id: string
  business_name: string
}

export interface DateRange {
  from: Date
  to: Date
}

export interface InsightComparison {
  metric: string
  current: number
  previous: number
  delta: number
  deltaPercent: number
  isPositive: boolean
}

export interface WeeklyProgress {
  weekNumber: number
  unitsSold: number
  target: number
  label: string
}

export interface PaceData {
  currentPace: number
  requiredPace: number
  isOnTrack: boolean
  totalTarget: number
  totalSold: number
  daysElapsed: number
  daysRemaining: number
}
