import { cn } from "@/lib/utils"
import type { StatusType } from "@/types/app"

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; className: string }
> = {
  active: {
    label: "ATIVO",
    className:
      "bg-shogun-accent/12 text-shogun-accent border-shogun-accent",
  },
  paused: {
    label: "PAUSADO",
    className:
      "bg-shogun-text-secondary/10 text-shogun-text-secondary border-shogun-text-muted",
  },
  behind: {
    label: "ATRASADO",
    className:
      "bg-shogun-danger/12 text-shogun-danger border-shogun-danger",
  },
  "on-track": {
    label: "NO CAMINHO",
    className: "bg-shogun-accent/12 text-shogun-accent border-shogun-accent",
  },
  unlocked: {
    label: "DESBLOQUEADO",
    className: "bg-shogun-accent/12 text-shogun-accent border-shogun-accent",
  },
  locked: {
    label: "BLOQUEADO",
    className:
      "bg-shogun-text-secondary/10 text-shogun-text-secondary border-shogun-text-muted",
  },
}

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-[var(--font-display)] font-semibold uppercase tracking-wider",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
