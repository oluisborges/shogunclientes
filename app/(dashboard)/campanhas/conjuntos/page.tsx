"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { ConjuntosTable } from "@/components/campanhas/ConjuntosTable"

const TABS = [
  { key: "campanhas", label: "Campanhas", href: "/campanhas" },
  { key: "conjuntos", label: "Conjuntos", href: "/campanhas/conjuntos" },
  { key: "anuncios", label: "Anúncios", href: "/campanhas/anuncios" },
]

export default function ConjuntosPage() {
  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-shogun-border">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "px-4 py-2.5 text-sm font-[var(--font-display)] font-medium transition-colors border-b-2 -mb-px",
              tab.key === "conjuntos"
                ? "text-shogun-accent border-shogun-accent"
                : "text-shogun-text-secondary border-transparent hover:text-shogun-text-primary"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <ConjuntosTable />
    </div>
  )
}
