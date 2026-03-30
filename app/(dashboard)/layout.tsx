export const dynamic = "force-dynamic"

import { ClientProvider } from "@/lib/hooks/useClientContext"
import { DateRangeProvider } from "@/lib/hooks/useDateRangeContext"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
// import { BlockedCheck } from "@/components/auth/BlockedCheck"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // <BlockedCheck>
      <ClientProvider>
        <DateRangeProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar - hidden on mobile */}
            <div className="hidden md:block">
              <Sidebar />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              <Topbar />
              <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-shogun-bg-base">
                {children}
              </main>
            </div>
          </div>
        </DateRangeProvider>
      </ClientProvider>
    // </BlockedCheck>
  )
}
