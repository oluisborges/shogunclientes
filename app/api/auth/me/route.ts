import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ 
        role: null,
        full_name: null,
        email: null
      })
    }

    // Usa admin client para ignorar RLS
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single()

    return NextResponse.json({ 
      role: profile?.role ?? null,
      full_name: profile?.full_name || null,
      email: user.email || null
    })
  } catch {
    return NextResponse.json({ 
      role: null,
      full_name: null,
      email: null
    })
  }
}
