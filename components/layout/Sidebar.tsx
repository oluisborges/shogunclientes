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
  BrainCircuit,
  User,
  Building2,
  Shield,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Client nav (ordered as requested) ───────────────────────────────────────
const CLIENT_NAV = [
  { label: "Dashboard",      href: "/dashboard",    icon: BarChart3 },
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
  { label: "Config. Admin",      href: "/config-admin",   icon: Shield },
  { label: "Config. ShogunIA",   href: "/shogunia",       icon: BrainCircuit },
  { label: "Config. Agenda",     href: "/disponibilidade", icon: CalendarRange },
  { label: "Usuários Clientes",   href: "/usuarios",        icon: Users },
]

const ADMIN_HREFS = new Set(ADMIN_NAV.map((i) => i.href))

export function Sidebar() {
  const [collapsed, setCollapsed]         = useState(false)
  const [isAdmin, setIsAdmin]             = useState(false)
  const [configOpen, setConfigOpen]       = useState(false)
  const [userRole, setUserRole]           = useState<string | null>(null)
  const [userName, setUserName]           = useState<string | null>(null)
  const [userCompanies, setUserCompanies] = useState<string[]>([])
  const pathname                          = usePathname()
  const prevPathRef                       = useRef<string | null>(null)

  // Fetch role and user info once on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setIsAdmin(data.role === "admin" || data.role === "moderador")
        setUserRole(data.role)
        setUserName(data.full_name || data.email)
      })
      .catch(() => {})

    // Fetch user companies
    fetch("/api/user/companies")
      .then((r) => r.json())
      .then((data) => {
        if (data.companies && Array.isArray(data.companies)) {
          setUserCompanies(data.companies.map((c: any) => c.business_name).filter(Boolean))
        }
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
          "h-16 flex items-center border-b border-shogun-border px-4 relative",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {collapsed && (
          <div className="flex items-center justify-center">
            <img 
              src="/shogunlogo.png" 
              alt="Shogun Logo" 
              className="h-10 w-auto"
            />
          </div>
        )}
        {!collapsed && (
          <>
            <div className="flex items-center gap-3">
              <img 
                src="/shogunlogo.png" 
                alt="Shogun Logo" 
                className="h-10 w-auto"
              />
              <div className="flex flex-col">
                <span className="font-[var(--font-display)] text-white font-bold text-sm tracking-wide leading-tight">
                  Grupo Shogun
                </span>
                <span className="font-[var(--font-display)] text-shogun-accent font-bold text-sm tracking-wide leading-tight">
                  Dash
                </span>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-shogun-text-secondary hover:text-shogun-text-primary transition-colors"
            >
              <PanelLeftClose size={18} />
            </button>
          </>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-shogun-text-secondary hover:text-shogun-text-primary transition-colors absolute right-1 top-1/2 -translate-y-1/2"
          >
            <PanelLeft size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {/* User Profile Section */}
        <div className="mb-4">
          <Link
            href="/meu-perfil"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
              pathname === "/meu-perfil"
                ? "bg-shogun-accent/10 text-shogun-accent border border-shogun-accent/20"
                : "hover:bg-shogun-bg-elevated text-shogun-text-secondary"
            )}
            title={collapsed ? "Perfil" : undefined}
          >
            <div className="relative">
              <div className="w-8 h-8 bg-shogun-accent/20 rounded-full flex items-center justify-center">
                <User size={16} className={cn(
                  "shrink-0",
                  pathname === "/meu-perfil" ? "text-shogun-accent" : "text-shogun-text-secondary"
                )} />
              </div>
              {userRole === "admin" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-shogun-bg-base" title="Admin" />
              )}
              {userRole === "moderador" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-shogun-bg-base" title="Moderador" />
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-shogun-text-primary truncate">
                  {userName || "Carregando..."}
                </div>
                <div className="text-xs text-shogun-text-muted truncate">
                  {userRole === "admin" ? "Administrador" : 
                   userRole === "moderador" ? "Moderador" :
                   userCompanies.length > 0 
                    ? userCompanies.slice(0, 2).join(", ") + (userCompanies.length > 2 ? ` +${userCompanies.length - 2}` : "")
                    : "Nenhuma empresa vinculada"}
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Divider */}
        <div className="my-2 border-t border-shogun-border/40" />

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
            {(configOpen || collapsed) && ADMIN_NAV.map((item, index) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <Link
                  key={item.href + index}
                  href={item.href}
                  prefetch={false}
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
        
        {/* Divider before logout */}
        <div className="my-2 border-t border-shogun-border/40" />
        
        {/* Logout */}
        <button
          onClick={async () => {
            try {
              await fetch("/api/auth/logout", { method: "POST" })
              window.location.href = "/login"
            } catch (error) {
              console.error("Error logging out:", error)
              window.location.href = "/login"
            }
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-sm font-[var(--font-display)] text-shogun-text-secondary hover:text-red-500 hover:bg-red-500/10"
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span className="truncate">Sair</span>}
        </button>
      </nav>
    </aside>
  )
}
