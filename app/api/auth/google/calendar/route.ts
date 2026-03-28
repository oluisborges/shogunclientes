import { NextResponse } from "next/server"
import { google } from "googleapis"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL(`/configuracoes?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    // Redirecionar para autenticação Google
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = process.env.GOOGLE_REDIRECT_URI
    
    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: "Credenciais OAuth não configuradas" },
        { status: 500 }
      )
    }

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ].join(" "))
    authUrl.searchParams.set("access_type", "offline") // Importante para refresh token
    authUrl.searchParams.set("prompt", "consent") // Força consentimento

    return NextResponse.redirect(authUrl)
  }

  try {
    // Trocar code por tokens
    const clientId = process.env.GOOGLE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
    const redirectUri = process.env.GOOGLE_REDIRECT_URI!

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    )

    const { tokens } = await oauth2Client.getToken(code)
    
    console.log("Tokens recebidos:", {
      access_token: tokens.access_token?.substring(0, 20) + "...",
      refresh_token: tokens.refresh_token ? "RECEIVED" : "NOT RECEIVED",
      expiry_date: tokens.expiry_date
    })

    // Salvar refresh token se recebido
    if (tokens.refresh_token) {
      try {
        const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/save-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: tokens.refresh_token })
        })
        
        if (saveResponse.ok) {
          console.log("Refresh token salvo com sucesso")
        } else {
          console.error("Erro ao salvar refresh token")
        }
      } catch (saveError) {
        console.error("Erro ao salvar refresh token:", saveError)
      }
    }

    return NextResponse.redirect(
      new URL("/configuracoes?success=google_calendar_connected", request.url)
    )

  } catch (error) {
    console.error("Erro ao trocar código por tokens:", error)
    return NextResponse.redirect(
      new URL(`/configuracoes?error=token_exchange_failed`, request.url)
    )
  }
}
