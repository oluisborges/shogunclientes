import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  // Use admin client to update role
  const admin = createAdminClient()
  
  // First, check current role
  const { data: currentProfile } = await admin
    .from("profiles")
    .select("role, email, full_name")
    .eq("id", user.id)
    .single()

  // Update current user to admin role
  const { data: profile, error } = await admin
    .from("profiles")
    .update({ 
      role: "admin", 
      updated_at: new Date().toISOString() 
    })
    .eq("id", user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ 
      error: error.message,
      user: { id: user.id, email: user.email },
      currentProfile: currentProfile
    }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: "Role updated to admin successfully",
    user: { id: user.id, email: user.email },
    previousRole: currentProfile?.role,
    newProfile: profile
  })
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  // Check current role
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    profile: profile || null,
    error: error?.message || null,
    isAdmin: profile?.role === "admin"
  })
}
