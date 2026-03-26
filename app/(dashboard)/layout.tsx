import { ClientProvider } from "@/lib/hooks/useClientContext"
import { DateRangeProvider } from "@/lib/hooks/useDateRangeContext"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verifica se o usuário logado é admin para exibir menu restrito
  let isAdmin = false
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      isAdmin = profile?.role === "admin"
    }
  } catch {
    // Sessão inválida — middleware já redireciona para /login
  }

  return (
    <ClientProvider>
      <DateRangeProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar isAdmin={isAdmin} />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar />
            <main className="flex-1 overflow-y-auto p-6 bg-shogun-bg-base">
              {children}
            </main>
          </div>
        </div>
      </DateRangeProvider>
    </ClientProvider>
  )
}
