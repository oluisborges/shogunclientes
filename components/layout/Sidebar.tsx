"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Megaphone,
  History,
  Target,
  CalendarClock,
  Trophy,
  Bot,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Métricas", href: "/metricas", icon: BarChart3 },
  { label: "Campanhas", href: "/campanhas", icon: Megaphone },
  { label: "Histórico", href: "/historico", icon: History },
  { label: "Metas", href: "/metas", icon: Target },
  { label: "Agendamento", href: "/agendamento", icon: CalendarClock },
  { label: "Conquistas", href: "/conquistas", icon: Trophy },
  { label: "Agentes", href: "/agentes", icon: Bot },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "h-screen bg-shogun-bg-base border-r border-shogun-border flex flex-col rounded-none transition-all duration-200",
        collapsed ? "w-16" : "w-[220px]"
      )}
    >
      <div
        className={cn(
          "h-14 flex items-center border-b border-shogun-border px-4",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <span className="font-[var(--font-display)] text-shogun-text-primary font-bold text-sm tracking-wide">
            SHOGUN
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-shogun-text-secondary hover:text-shogun-text-primary transition-colors"
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-sm font-[var(--font-display)]",
                isActive
                  ? "text-shogun-accent bg-shogun-accent/8"
                  : "text-shogun-text-secondary hover:text-shogun-text-primary hover:bg-shogun-bg-elevated"
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "shrink-0",
                  isActive
                    ? "text-shogun-accent"
                    : "text-shogun-text-secondary"
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
