import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("client_id")

  if (!clientId) {
    return NextResponse.json(
      { error: "Parâmetro client_id é obrigatório" },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: client, error: clientError } = await adminClient
    .from("clients")
    .select("meta_account_id, meta_access_token")
    .eq("id", clientId)
    .single()

  if (clientError || !client?.meta_account_id || !client?.meta_access_token) {
    return NextResponse.json(
      { error: "Cliente sem conta Meta configurada" },
      { status: 404 }
    )
  }

  try {
    // Buscar informações da conta incluindo spend_cap
    const accountResponse = await fetch(
      `https://graph.facebook.com/v19.0/${client.meta_account_id}?` +
      `fields=account_status,balance,amount_spent,spend_cap,currency,funding_source_details&` +
      `access_token=${client.meta_access_token}`
    )

    if (!accountResponse.ok) {
      const error = await accountResponse.json()
      throw new Error(error.error?.message || "Erro ao buscar dados da conta")
    }

    const accountData = await accountResponse.json()
    console.log("Account data:", JSON.stringify(accountData, null, 2))

    // Balance = saldo atual que precisa ser pago (valor em centavos)
    const currentDebt = Math.abs(parseFloat(accountData.balance || "0")) / 100
    const amountSpent = parseFloat(accountData.amount_spent || "0") / 100
    
    let availableBalance = 0
    let totalFunds = 0
    
    // Método oficial da Meta: spend_cap - amount_spent = saldo disponível
    if (accountData.spend_cap) {
      const spendCap = parseFloat(accountData.spend_cap) / 100
      availableBalance = spendCap - amountSpent
      totalFunds = spendCap
      console.log(`Spend cap: ${spendCap}, Amount spent: ${amountSpent}, Available: ${availableBalance}`)
    } else {
      // Se não tem spend_cap, mostrar apenas o saldo devedor
      console.log(`No spend_cap found. Current debt: ${currentDebt}`)
    }

    return NextResponse.json({
      balance: availableBalance > 0 ? availableBalance : currentDebt,
      totalFunds: totalFunds,
      currentDebt: currentDebt,
      currency: accountData.currency || "BRL",
      amountSpent: amountSpent,
      accountStatus: accountData.account_status,
      fundingDisplay: accountData.funding_source_details?.display_string || "N/A",
      hasAvailableFunds: availableBalance > 0,
    })
  } catch (err) {
    console.error("Balance error:", err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Erro ao buscar saldo",
      },
      { status: 502 }
    )
  }
}
