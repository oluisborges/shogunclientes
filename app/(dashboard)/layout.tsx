import { ClientProvider } from "@/lib/hooks/useClientContext"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClientProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 bg-shogun-bg-base">
            {children}
          </main>
        </div>
      </div>
    </ClientProvider>
  )
}
