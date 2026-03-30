import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// DELETE /api/admin/clients/[id] - apaga uma conta de anúncio
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientId = (await params).id
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verifica se é admin
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin" && profile?.role !== "moderador") {
      return NextResponse.json({ error: "Acesso restrito a administradores e moderadores" }, { status: 403 })
    }

    // Verifica se o cliente existe
    const { data: client, error: fetchError } = await admin
      .from("clients")
      .select("id, business_name")
      .eq("id", clientId)
      .single()

    if (fetchError || !client) {
      console.error("Cliente não encontrado:", fetchError)
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    // Remove acessos vinculados primeiro
    await admin
      .from("user_client_access")
      .delete()
      .eq("client_id", clientId)

    // Apaga o cliente
    const { error: deleteError } = await admin
      .from("clients")
      .delete()
      .eq("id", clientId)

    if (deleteError) {
      console.error("Erro ao deletar:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log("Cliente apagado com sucesso:", client.business_name)
    return NextResponse.json({ 
      message: `Conta "${client.business_name}" apagada com sucesso!` 
    })
  } catch (err) {
    console.error("Erro geral na API:", err)
    return NextResponse.json({ error: "Erro ao apagar conta" }, { status: 500 })
  }
}
