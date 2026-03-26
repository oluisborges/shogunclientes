import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Shogun Relatórios",
  description: "Painel de performance marketing — Grupo Shogun",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-[var(--font-display)]">
        {children}
      </body>
    </html>
  )
}
