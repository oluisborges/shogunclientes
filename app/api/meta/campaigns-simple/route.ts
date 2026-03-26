import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("client_id")
  
  console.log("Simple campaigns - Client ID:", clientId)
  
  if (!clientId) {
    return NextResponse.json({ error: "client_id obrigatório" }, { status: 400 })
  }
  
  try {
    // Dados mock para teste
    return NextResponse.json({
      data: [
        {
          id: "mock_1",
          name: "Campanha Mock 1",
          status: "ACTIVE",
          objective: "CONVERSIONS"
        },
        {
          id: "mock_2", 
          name: "Campanha Mock 2",
          status: "PAUSED",
          objective: "TRAFFIC"
        }
      ]
    })
  } catch (error) {
    console.error("Simple campaigns error:", error)
    return NextResponse.json({ error: "Erro simples" }, { status: 500 })
  }
}
