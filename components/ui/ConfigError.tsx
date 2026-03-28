"use client"

import { AlertTriangle } from "lucide-react"

interface ConfigErrorProps {
  message?: string
}

export function ConfigError({ message }: ConfigErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
      <div className="w-14 h-14 rounded-full bg-shogun-danger/10 border border-shogun-danger/20 flex items-center justify-center">
        <AlertTriangle size={26} className="text-shogun-danger" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <p className="text-sm font-semibold font-[var(--font-display)] text-shogun-text-primary">
          {message ?? "Algo não está configurado"}
        </p>
        <p className="text-sm text-shogun-text-secondary font-[var(--font-display)] leading-relaxed">
          Entre em contato com o suporte pelo{" "}
          <strong className="text-shogun-text-primary">grupo do Shogun</strong>{" "}
          e informe este erro para que possam te ajudar.
        </p>
      </div>
    </div>
  )
}
