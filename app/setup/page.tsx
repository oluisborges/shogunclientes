"use client"

import { useState } from "react"

export default function SetupPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSetAdmin() {
    setStatus("loading")
    try {
      const res = await fetch("/api/debug/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro desconhecido")
      setStatus("ok")
      setMessage(data.message ?? "Role atualizado!")
    } catch (err) {
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "Erro")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 w-full max-w-sm text-center space-y-4">
        <h1 className="text-white text-xl font-bold">Setup — Tornar admin</h1>
        <p className="text-gray-400 text-sm">
          Clique abaixo para definir sua conta como <strong className="text-white">admin</strong>.
          Faça isso apenas uma vez.
        </p>

        {status === "ok" ? (
          <div className="space-y-3">
            <p className="text-green-400 font-medium">{message}</p>
            <a
              href="/metricas"
              className="block px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-medium transition-colors"
            >
              Ir para o sistema →
            </a>
          </div>
        ) : status === "error" ? (
          <div className="space-y-3">
            <p className="text-red-400 text-sm">{message}</p>
            <button
              onClick={handleSetAdmin}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <button
            onClick={handleSetAdmin}
            disabled={status === "loading"}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors"
          >
            {status === "loading" ? "Aguarde…" : "Definir como admin"}
          </button>
        )}
      </div>
    </div>
  )
}
