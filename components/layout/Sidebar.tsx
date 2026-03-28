"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Megaphone,
  Target,
  CalendarClock,
  Trophy,
  Bot,
  Settings,
  Users,
  CalendarRange,
  PanelLeftClose,
  PanelLeft,
  BookOpen,
  Gift,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Client nav (ordered as requested) ───────────────────────────────────────
const CLIENT_NAV = [
  { label: "Dashboard",      href: "/metricas",     icon: BarChart3 },
  { label: "Campanhas",      href: "/campanhas",    icon: Megaphone },
  { label: "Metas",          href: "/metas",        icon: Target },
  { label: "Reunião Mensal", href: "/agendamento",  icon: CalendarClock },
  { label: "Shogun IA",      href: "/agentes",      icon: Bot },
  { label: "Academia",       href: "/academia",     icon: BookOpen },
  { label: "Indicações",     href: "/indicacoes",   icon: Gift },
  { label: "Conquistas",     href: "/conquistas",   icon: Trophy },
]

// ─── Admin-only submenu under "Configurações" ─────────────────────────────────
const ADMIN_NAV = [
  { label: "Configuração Geral", href: "/configuracoes",  icon: Settings },
  { label: "Config. Agenda",     href: "/disponibilidade", icon: CalendarRange },
  { label: "Usuários",           href: "/usuarios",        icon: Users },
]

const ADMIN_HREFS = new Set(ADMIN_NAV.map((i) => i.href))

export function Sidebar() {
  const [collapsed, setCollapsed]         = useState(false)
  const [isAdmin, setIsAdmin]             = useState(false)
  const [configOpen, setConfigOpen]       = useState(false)
  const [userRole, setUserRole]           = useState<string | null>(null)
  const pathname                          = usePathname()
  const prevPathRef                       = useRef<string | null>(null)

  // Fetch role once on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setIsAdmin(data.role === "admin")
        setUserRole(data.role)
      })
      .catch(() => {})
  }, [])

  // Auto-expand Configurações if currently on an admin page
  useEffect(() => {
    if (ADMIN_HREFS.has(pathname)) setConfigOpen(true)
  }, [pathname])

  // Log navigation for non-admin users
  useEffect(() => {
    if (userRole === null) return           // role not loaded yet
    if (userRole === "admin") return        // never log admin
    if (prevPathRef.current === pathname) return
    prevPathRef.current = pathname

    const match = CLIENT_NAV.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action_type: "navigation",
        page_label: match?.label ?? null,
        path: pathname,
      }),
    }).catch(() => {})
  }, [pathname, userRole])

  const isAdminPath = ADMIN_HREFS.has(pathname)

  return (
    <aside
      className={cn(
        "h-screen bg-shogun-bg-base border-r border-shogun-border flex flex-col rounded-none transition-all duration-200",
        collapsed ? "w-16" : "w-[220px]"
      )}
    >
      {/* Logo / collapse toggle */}
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

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {/* ── Client nav ── */}
        {CLIENT_NAV.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-sm font-[var(--font-display)]",
                isActive && !isAdminPath
                  ? "text-shogun-accent bg-shogun-accent/8"
                  : "text-shogun-text-secondary hover:text-shogun-text-primary hover:bg-shogun-bg-elevated"
              )}
            >
              <Icon size={20} className={cn("shrink-0", isActive && !isAdminPath ? "text-shogun-accent" : "text-shogun-text-secondary")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}

        {/* ── Admin Configurações dropdown ── */}
        {isAdmin && (
          <>
            {/* Divider */}
            <div className="my-2 border-t border-shogun-border/40" />

            {/* Trigger */}
            <button
              onClick={() => !collapsed && setConfigOpen((v) => !v)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-sm font-[var(--font-display)]",
                isAdminPath
                  ? "text-shogun-accent bg-shogun-accent/8"
                  : "text-shogun-text-secondary hover:text-shogun-text-primary hover:bg-shogun-bg-elevated"
              )}
              title={collapsed ? "Configurações" : undefined}
            >
              <Settings size={20} className={cn("shrink-0", isAdminPath ? "text-shogun-accent" : "text-shogun-text-secondary")} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">Configurações</span>
                  {configOpen
                    ? <ChevronDown size={14} className="shrink-0 opacity-60" />
                    : <ChevronRight size={14} className="shrink-0 opacity-60" />
                  }
                </>
              )}
            </button>

            {/* Submenu items */}
            {(configOpen || collapsed) && ADMIN_NAV.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded transition-colors text-sm font-[var(--font-display)]",
                    collapsed ? "px-3 py-2.5" : "pl-9 pr-3 py-2",
                    isActive
                      ? "text-shogun-accent bg-shogun-accent/8"
                      : "text-shogun-text-secondary hover:text-shogun-text-primary hover:bg-shogun-bg-elevated"
                  )}
                >
                  <Icon size={collapsed ? 20 : 16} className={cn("shrink-0", isActive ? "text-shogun-accent" : "text-shogun-text-secondary")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </>
        )}
      </nav>
    </aside>
  )
}
