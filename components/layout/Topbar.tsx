"use client"

import { ClientSelector } from "./ClientSelector"
import { CalendarDays } from "lucide-react"

export function Topbar() {
  const today = new Date()
  const monthYear = today.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })

  return (
    <header className="h-14 bg-shogun-bg-base border-b border-shogun-border flex items-center justify-between px-6 rounded-none">
      <ClientSelector />

      <div className="flex items-center gap-2 text-shogun-text-secondary text-sm font-[var(--font-display)]">
        <CalendarDays size={16} />
        <span className="capitalize">{monthYear}</span>
      </div>
    </header>
  )
}
