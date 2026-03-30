import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const admin = createAdminClient()

    // 1. Buscar todos os perfis admin e moderador
    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("*")
      .in("role", ["admin", "moderador"])
      .order("created_at", { ascending: false })

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // 2. Para cada perfil, buscar o email do auth.users
    const profilesWithEmails = await Promise.all(
      (profiles || []).map(async (profile) => {
        try {
          const { data: { user: authUser } } = await admin.auth.admin.getUserById(profile.id)
          return {
            ...profile,
            email: authUser?.email || "N/A",
            authUserExists: !!authUser,
            authUserCreated: authUser?.created_at
          }
        } catch (error) {
          return {
            ...profile,
            email: "ERROR",
            authUserExists: false,
            error: error instanceof Error ? error.message : String(error)
          }
        }
      })
    )

    // 3. Buscar todos os usuários do auth que não têm perfil
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 })
    
    const authUsersWithoutProfiles = []
    if (!authError && authUsers.users) {
      const profileIds = (profiles || []).map(p => p.id)
      for (const authUser of authUsers.users) {
        if (!profileIds.includes(authUser.id)) {
          authUsersWithoutProfiles.push({
            id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at,
            user_metadata: authUser.user_metadata
          })
        }
      }
    }

    return NextResponse.json({
      profiles: profilesWithEmails,
      authUsersWithoutProfiles,
      summary: {
        totalProfiles: profiles?.length || 0,
        totalAuthUsers: authUsers?.users?.length || 0,
        usersWithoutProfiles: authUsersWithoutProfiles.length
      }
    })
  } catch (err) {
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}
