export function calcPace(unitsSold: number, daysElapsed: number): number {
  return daysElapsed > 0 ? Math.round(unitsSold / daysElapsed) : 0
}

export function calcRequiredPace(
  totalTarget: number,
  unitsSold: number,
  daysRemaining: number
): number {
  const remaining = totalTarget - unitsSold
  return daysRemaining > 0 ? Math.ceil(remaining / daysRemaining) : 0
}

export function isOnTrack(currentPace: number, requiredPace: number): boolean {
  return currentPace >= requiredPace * 0.95
}

export function calcProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(Math.round((current / target) * 100), 100)
}

export function calcROI(revenue: number, spend: number): number {
  if (spend <= 0) return 0
  return ((revenue - spend) / spend) * 100
}
