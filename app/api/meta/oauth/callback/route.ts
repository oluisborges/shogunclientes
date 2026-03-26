import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL(`/configuracoes?error=${error}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/configuracoes?error=no_code", request.url)
    )
  }

  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/oauth/callback`

  if (!appId || !appSecret) {
    return NextResponse.redirect(
      new URL("/configuracoes?error=missing_credentials", request.url)
    )
  }

  try {
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `client_id=${appId}&` +
        `client_secret=${appSecret}&` +
        `code=${code}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}`
    )

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token")
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=unauthorized", request.url)
      )
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role === "client") {
      return NextResponse.redirect(
        new URL("/configuracoes?error=insufficient_permissions", request.url)
      )
    }

    const meResponse = await fetch(
      `https://graph.facebook.com/v19.0/me?access_token=${accessToken}&fields=id,name`
    )
    const meData = await meResponse.json()

    const response = NextResponse.redirect(
      new URL(
        `/configuracoes?success=true&token=${encodeURIComponent(accessToken)}&user_id=${meData.id}`,
        request.url
      )
    )

    response.cookies.set("meta_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 60,
    })

    return response
  } catch (err) {
    console.error("OAuth callback error:", err)
    return NextResponse.redirect(
      new URL("/configuracoes?error=token_exchange_failed", request.url)
    )
  }
}
