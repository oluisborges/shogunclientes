import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST() {
  try {
    const adminClient = createAdminClient()
    
    // Criar tabela system_settings se não existir
    const { error: createTableError } = await adminClient.rpc('create_system_settings_table')
    
    if (createTableError) {
      // Se a RPC não existir, tentar criar manualmente
      console.log("Tentando criar tabela manualmente...")
      
      // Inserir um registro para testar se a tabela existe
      const { error: insertError } = await adminClient
        .from("system_settings")
        .upsert({
          key: "test",
          value: "test"
        }, {
          onConflict: "key"
        })
      
      if (insertError) {
        // Se der erro, a tabela não existe
        return NextResponse.json({
          error: "Tabela system_settings não existe. Execute o SQL manualmente.",
          sql: `
-- Criar tabela system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Criar policy para admin
CREATE POLICY "Admin full access" ON public.system_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
          `
        }, { status: 400 })
      } else {
        // Limpar o registro de teste
        await adminClient
          .from("system_settings")
          .delete()
          .eq("key", "test")
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Tabela system_settings pronta para uso"
    })
    
  } catch (error) {
    console.error("Erro ao configurar system_settings:", error)
    return NextResponse.json({
      error: "Erro ao configurar tabela",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 })
  }
}
