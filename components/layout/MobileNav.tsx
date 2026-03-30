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
  BookOpen,
  Gift,
  ChevronDown,
  ChevronRight,
  BrainCircuit,
  X,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

const ADMIN_NAV = [
  { label: "Configuração Geral", href: "/configuracoes",  icon: Settings },
  { label: "Config. ShogunIA",   href: "/shogunia",       icon: BrainCircuit },
  { label: "Config. Agenda",     href: "/disponibilidade", icon: CalendarRange },
  { label: "Usuários",           href: "/usuarios",        icon: Users },
]

const ADMIN_HREFS = new Set(ADMIN_NAV.map((i) => i.href))

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setIsAdmin(data.role === "admin"))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (ADMIN_HREFS.has(pathname)) setConfigOpen(true)
  }, [pathname])

  // Close menu when route changes (but not on initial mount)
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      onClose()
      prevPathname.current = pathname
    }
  }, [pathname, onClose])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const isAdminPath = ADMIN_HREFS.has(pathname)

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] bg-shogun-bg-base border-r border-shogun-border z-50 md:hidden",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between border-b border-shogun-border px-4">
          <span className="font-[var(--font-display)] text-shogun-text-primary font-bold text-sm tracking-wide">
            SHOGUN
          </span>
          <button
            onClick={onClose}
            className="text-shogun-text-secondary hover:text-shogun-text-primary transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {CLIENT_NAV.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded transition-colors text-sm font-[var(--font-display)]",
                  isActive && !isAdminPath
                    ? "text-shogun-accent bg-shogun-accent/8"
                    : "text-shogun-text-secondary hover:text-shogun-text-primary hover:bg-shogun-bg-elevated"
                )}
              >
                <Icon size={20} className={cn("shrink-0", isActive && !isAdminPath ? "text-shogun-accent" : "text-shogun-text-secondary")} />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="my-2 border-t border-shogun-border/40" />

              <button
                onClick={() => setConfigOpen((v) => !v)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded transition-colors text-sm font-[var(--font-display)]",
                  isAdminPath
                    ? "text-shogun-accent bg-shogun-accent/8"
                    : "text-shogun-text-secondary hover:text-shogun-text-primary hover:bg-shogun-bg-elevated"
                )}
              >
                <Settings size={20} className={cn("shrink-0", isAdminPath ? "text-shogun-accent" : "text-shogun-text-secondary")} />
                <span className="flex-1 text-left truncate">Configurações</span>
                {configOpen
                  ? <ChevronDown size={14} className="shrink-0 opacity-60" />
                  : <ChevronRight size={14} className="shrink-0 opacity-60" />
                }
              </button>

              {configOpen && ADMIN_NAV.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 pl-9 pr-3 py-2.5 rounded transition-colors text-sm font-[var(--font-display)]",
                      isActive
                        ? "text-shogun-accent bg-shogun-accent/8"
                        : "text-shogun-text-secondary hover:text-shogun-text-primary hover:bg-shogun-bg-elevated"
                    )}
                  >
                    <Icon size={16} className={cn("shrink-0", isActive ? "text-shogun-accent" : "text-shogun-text-secondary")} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </>
          )}
        </nav>
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 text-shogun-text-secondary hover:text-shogun-text-primary transition-colors"
      aria-label="Abrir menu"
    >
      <Menu size={24} />
    </button>
  )
}
