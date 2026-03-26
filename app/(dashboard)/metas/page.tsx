"use client"

import { MetasSummary } from "@/components/metas/MetasSummary"
import { WeeklyBars } from "@/components/metas/WeeklyBars"
import { PaceIndicator } from "@/components/metas/PaceIndicator"
import { MetasTable } from "@/components/metas/MetasTable"
import type { PaceData, WeeklyProgress } from "@/types/app"

// Mock data for demonstration
const MOCK_WEEKS: WeeklyProgress[] = [
  { weekNumber: 1, unitsSold: 280, target: 300, label: "Semana 1" },
  { weekNumber: 2, unitsSold: 310, target: 300, label: "Semana 2" },
  { weekNumber: 3, unitsSold: 195, target: 300, label: "Semana 3" },
  { weekNumber: 4, unitsSold: 85, target: 300, label: "Semana 4" },
]

const MOCK_PACE: PaceData = {
  currentPace: 142,
  requiredPace: 158,
  isOnTrack: false,
  totalTarget: 1200,
  totalSold: 870,
  daysElapsed: 20,
  daysRemaining: 10,
}

export default function MetasPage() {
  const weeks = MOCK_WEEKS
  const paceData = MOCK_PACE
  const targetUnits = 1200

  return (
    <div className="space-y-8">
      <MetasSummary paceData={paceData} targetUnits={targetUnits} />
      <WeeklyBars weeks={weeks} />
      <PaceIndicator paceData={paceData} />
      <MetasTable weeks={weeks} />
    </div>
  )
}
