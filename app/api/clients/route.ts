import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const adminClient = createAdminClient()

  // Check role: admins see all clients; clients see only their own
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"

  let query = adminClient
    .from("clients")
    .select("id, business_name, meta_account_id")
    .eq("active", true)
    .not("profile_id", "is", null)
    .order("business_name")

  if (!isAdmin) {
    query = query.eq("profile_id", user.id)
  }

  const { data: clients, error } = await query

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(clients || [])
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { business_name, meta_account_id, meta_access_token } = body

    if (!business_name) {
      return NextResponse.json(
        { error: "Nome do cliente é obrigatório" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { data: client, error } = await adminClient
      .from("clients")
      .insert({
        business_name,
        meta_account_id: meta_account_id || null,
        meta_access_token: meta_access_token || null,
        active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 }
    )
  }
}
