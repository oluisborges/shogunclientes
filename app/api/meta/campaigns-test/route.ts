import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Teste simples sem dependências
    return NextResponse.json({
      data: [
        {
          id: "test_1",
          name: "Campanha Teste 1",
          status: "ACTIVE",
          objective: "CONVERSIONS"
        },
        {
          id: "test_2", 
          name: "Campanha Teste 2",
          status: "PAUSED",
          objective: "TRAFFIC"
        }
      ]
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Erro no teste" },
      { status: 500 }
    )
  }
}
