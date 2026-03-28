import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST() {
  // Require an authenticated admin to run setup operations
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 })
  }

  try {
    const { error: createTableError } = await adminClient.rpc("create_system_settings_table")

    if (createTableError) {
      const { error: insertError } = await adminClient
        .from("system_settings")
        .upsert({ key: "test", value: "test" }, { onConflict: "key" })

      if (insertError) {
        // Return the SQL without exposing internal error details
        return NextResponse.json(
          { error: "Tabela system_settings não existe. Execute o SQL manualmente no painel do Supabase." },
          { status: 400 }
        )
      }

      // Clean up test record
      await adminClient.from("system_settings").delete().eq("key", "test")
    }

    return NextResponse.json({
      success: true,
      message: "Tabela system_settings pronta para uso",
    })
  } catch {
    return NextResponse.json(
      { error: "Erro ao configurar tabela" },
      { status: 500 }
    )
  }
}
