"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/lib/hooks/useThemeContext"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-shogun-bg-elevated border border-shogun-border hover:bg-shogun-bg-surface transition-colors group"
      title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {theme === "dark" ? (
        <Moon className="w-5 h-5 text-shogun-text-secondary group-hover:text-shogun-text-primary transition-colors" />
      ) : (
        <Sun className="w-5 h-5 text-shogun-text-secondary group-hover:text-shogun-text-primary transition-colors" />
      )}
    </button>
  )
}
