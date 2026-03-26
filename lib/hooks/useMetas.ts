"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "./useClientContext"
import { createClient } from "@/lib/supabase/client"
import type { Goal, GoalProgress } from "@/types/database"
import type { PaceData, WeeklyProgress } from "@/types/app"
import { calcPace, calcRequiredPace, isOnTrack } from "@/lib/utils/pace"
import { getDaysElapsedInMonth, getDaysRemainingInMonth } from "@/lib/utils/dates"

interface UseMetasReturn {
  goal: Goal | null
  weeklyProgress: WeeklyProgress[]
  paceData: PaceData | null
  loading: boolean
  error: string | null
}

export function useMetas(): UseMetasReturn {
  const { selectedClientId } = useClientContext()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([])
  const [paceData, setPaceData] = useState<PaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedClientId) {
      setLoading(false)
      return
    }

    async function fetchData() {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      // Fetch current month goal
      const { data: goalData, error: goalError } = await supabase
        .from("goals")
        .select("*")
        .eq("client_id", selectedClientId)
        .eq("year", year)
        .eq("month", month)
        .single()

      if (goalError || !goalData) {
        setGoal(null)
        setLoading(false)
        return
      }

      setGoal(goalData)

      // Fetch weekly progress
      const { data: progressData } = await supabase
        .from("goal_progress")
        .select("*")
        .eq("goal_id", goalData.id)
        .order("week_number")

      const weeklyTarget = Math.ceil(goalData.target_units / 4)
      const weeks: WeeklyProgress[] = [1, 2, 3, 4].map((weekNum) => {
        const progress = progressData?.find((p: GoalProgress) => p.week_number === weekNum)
        return {
          weekNumber: weekNum,
          unitsSold: progress?.units_sold ?? 0,
          target: weeklyTarget,
          label: `Semana ${weekNum}`,
        }
      })

      setWeeklyProgress(weeks)

      // Calculate pace
      const totalSold = weeks.reduce((sum, w) => sum + w.unitsSold, 0)
      const daysElapsed = getDaysElapsedInMonth()
      const daysRemaining = getDaysRemainingInMonth()
      const currentPace = calcPace(totalSold, daysElapsed)
      const requiredPace = calcRequiredPace(
        goalData.target_units,
        totalSold,
        daysRemaining
      )

      setPaceData({
        currentPace,
        requiredPace,
        isOnTrack: isOnTrack(currentPace, requiredPace),
        totalTarget: goalData.target_units,
        totalSold,
        daysElapsed,
        daysRemaining,
      })

      setLoading(false)
    }

    fetchData()
  }, [selectedClientId])

  return { goal, weeklyProgress, paceData, loading, error }
}
