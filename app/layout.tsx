import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/lib/hooks/useThemeContext"

export const metadata: Metadata = {
  title: "Shogun Relatórios",
  description: "Painel de performance marketing — Grupo Shogun",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" }
    ],
    apple: { url: "/shogunlogo.png", sizes: "180x180", type: "image/png" },
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-[var(--font-display)]">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
