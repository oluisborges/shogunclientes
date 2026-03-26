import type { LucideIcon } from "lucide-react"

interface PlaceholderPageProps {
  title: string
  description: string
  icon: LucideIcon
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-shogun-bg-elevated flex items-center justify-center">
        <Icon className="text-shogun-text-muted" size={32} />
      </div>
      <h2 className="text-shogun-text-primary font-[var(--font-display)] font-bold text-xl">
        {title}
      </h2>
      <p className="text-shogun-text-secondary font-[var(--font-display)] text-sm max-w-sm">
        {description}
      </p>
      <span className="text-xs text-shogun-text-muted font-[var(--font-data)]">
        EM BREVE
      </span>
    </div>
  )
}
