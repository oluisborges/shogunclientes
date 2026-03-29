import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Routes only accessible by admins
const ADMIN_PATHS = [
  "/configuracoes",
  "/shogunia",
  "/disponibilidade",
  "/usuarios",
  "/clientes",
  "/criar-cliente",
]

// API paths that require admin role (server-side enforcement in addition to
// individual route checks — defence in depth)
const ADMIN_API_PATHS = [
  "/api/admin/",
  "/api/setup/",
  "/api/debug/",
]

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute       = pathname.startsWith("/login")
  const isAguardandoRoute = pathname === "/aguardando-aprovacao"
  const isApiRoute        = pathname.startsWith("/api/")
  const isPending         = user?.user_metadata?.status === "pending"

  // ── Admin API paths: require authenticated admin ──────────────────────────
  if (ADMIN_API_PATHS.some((p) => pathname.startsWith(p))) {
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    // Individual routes also perform admin checks — this is an extra layer
    // We only block clearly unauthenticated requests here to avoid the extra
    // DB round-trip on every admin API call (route-level check is authoritative)
    return supabaseResponse
  }

  // Regular API routes handle their own auth — never redirect them
  if (isApiRoute) return supabaseResponse

  // Unauthenticated: must go to login
  if (!user && !isAuthRoute && !isAguardandoRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Pending user: can only see /aguardando-aprovacao
  if (user && isPending && !isAguardandoRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/aguardando-aprovacao"
    return NextResponse.redirect(url)
  }

  // Approved/admin user on login page: go to dashboard
  if (user && !isPending && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // Admin-only pages: redirect non-admins to dashboard
  if (user && !isPending && ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
