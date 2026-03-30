"use client"

import { useState } from "react"
import { ClientSelector } from "./ClientSelector"
import { MobileNav, MobileMenuButton } from "./MobileNav"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

export function Topbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <header className="h-14 bg-shogun-bg-base border-b border-shogun-border flex items-center justify-between px-4 md:px-6 md:justify-end rounded-none">
        {/* Mobile menu button - only visible on mobile */}
        <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
        
        {/* Client selector and theme toggle */}
        <div className="flex items-center gap-3">
          <ClientSelector />
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <MobileNav 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
    </>
  )
}
