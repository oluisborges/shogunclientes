"use client"

import { useCallback } from "react"
import { usePathname } from "next/navigation"

type ActionType =
  | "navigation"
  | "period_change"
  | "compare_change"
  | "agent_chat"
  | "booking"
  | "cancellation"

export function useActivityLog() {
  const pathname = usePathname()

  const log = useCallback(
    (
      action_type: ActionType,
      page_label: string | null,
      details?: Record<string, unknown>
    ) => {
      fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_type, page_label, path: pathname, details: details ?? null }),
      }).catch(() => {})
    },
    [pathname]
  )

  return log
}
