import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id
    console.log("=== DEBUG CHECK CLIENT ===")
    console.log("Client ID:", clientId)
    
    const admin = createAdminClient()
    
    // Listar todos os clientes
    const { data: allClients, error: allError } = await admin
      .from("clients")
      .select("id, business_name, meta_account_id, active")
      .limit(20)
    
    console.log("Todos os clientes:", allClients?.length || 0)
    allClients?.forEach(c => {
      console.log(`- ${c.id}: ${c.business_name} (active: ${c.active})`)
    })
    
    // Buscar cliente específico
    const { data: client, error: fetchError } = await admin
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single()
    
    console.log("Cliente específico:", client)
    console.log("Erro busca específica:", fetchError)
    
    // Verificar se existe em user_client_access
    const { data: accessRecords, error: accessError } = await admin
      .from("user_client_access")
      .select("*")
      .eq("client_id", clientId)
    
    console.log("Registros de acesso:", accessRecords?.length || 0)
    console.log("Erro acesso:", accessError)
    
    return NextResponse.json({
      clientId,
      allClients: allClients || [],
      specificClient: client,
      fetchError: fetchError?.message,
      accessRecords: accessRecords || [],
      accessError: accessError?.message,
      found: !!client
    })
    
  } catch (err) {
    console.error("Erro no debug:", err)
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "Erro desconhecido" 
    }, { status: 500 })
  }
}
