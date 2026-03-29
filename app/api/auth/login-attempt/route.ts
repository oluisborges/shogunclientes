import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const MAX_LIMIT = 500

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  )
}

// POST — log a login attempt (public, no auth required)
export async function POST(req: NextRequest) {
  // Rate limit: max 20 log calls per IP per minute (prevents log-flooding)
  const ip = getClientIp(req)
  const rl = rateLimit(ip, { prefix: "login-attempt", limit: 20, windowSec: 60 })
  if (!rl.success) {
    // Silent accept — don't leak rate limit info to potential attackers
    return NextResponse.json({ ok: true })
  }

  const body = await req.json()
  const { email, success } = body
  if (!email) return NextResponse.json({ ok: true })

  const resolvedIp = getIp(req)

  // Try Vercel edge geo headers first
  const country = req.headers.get("x-vercel-ip-country") ?? null
  const region  = req.headers.get("x-vercel-ip-country-region") ?? null
  const city    = req.headers.get("x-vercel-ip-city") ?? null

  let geoCountry = country
  let geoRegion  = region
  let geoCity    = city

  if (!geoCountry && resolvedIp !== "unknown" && resolvedIp !== "::1" && !resolvedIp.startsWith("127.")) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2000)
      const res = await fetch(`https://ipapi.co/${resolvedIp}/json/`, { signal: controller.signal })
      clearTimeout(timeout)
      if (res.ok) {
        const geo = await res.json()
        geoCountry = geo.country_name ?? null
        geoRegion  = geo.region ?? null
        geoCity    = geo.city ?? null
      }
    } catch { /* non-critical */ }
  }

  const admin = createAdminClient()
  await admin.from("login_attempts").insert({
    email: email.toLowerCase().trim(),
    success: success === true,
    ip: resolvedIp,
    country: geoCountry,
    region: geoRegion,
    city: geoCity,
  })

  return NextResponse.json({ ok: true })
}

// GET — fetch login attempts (admin only)
export async function GET(req: NextRequest) {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  // Cap the limit to prevent unbounded queries / memory exhaustion
  const rawLimit = parseInt(searchParams.get("limit") ?? "200")
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, rawLimit), MAX_LIMIT) : 200

  const { data, error } = await admin
    .from("login_attempts")
    .select("id, email, success, ip, country, region, city, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
  return NextResponse.json(data ?? [])
}
