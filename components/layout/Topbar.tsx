"use client"

import { ClientSelector } from "./ClientSelector"
import { CalendarDays } from "lucide-react"

export function Topbar() {
  return (
    <header className="h-14 bg-shogun-bg-base border-b border-shogun-border flex items-center justify-end px-6 rounded-none">
      <ClientSelector />
    </header>
  )
}
