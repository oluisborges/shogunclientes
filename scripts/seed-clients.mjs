/**
 * seed-clients.mjs
 *
 * Creates client users in Supabase with role "client".
 * Each user gets: auth account + profile + client record.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/seed-clients.mjs
 *
 * Or with a .env.local file (requires dotenv):
 *   node --env-file=.env.local scripts/seed-clients.mjs
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PASSWORD = "mudar@1234"

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Lista de clientes ────────────────────────────────────────────────────────
const clients = [
  { name: "Joao apolinario",              email: "jb_apolinario@hotmail.com",                    cnpj: "32938817000100" },
  { name: "Boa Forma",                    email: "comercial@boaformajp.com.br",                   cnpj: "07711318000120" },
  { name: "Mood Refeições",               email: "moodcomsabor@gmail.com",                        cnpj: "43157250000142" },
  { name: "Refrigeração Icarai",          email: "cristiane.pessanha@refrigeracaoicarai.com.br",  cnpj: "31541824000100" },
  { name: "QUALIVI NUTRI",                email: "fayane.g@hotmail.com",                          cnpj: "42209848000175" },
  { name: "Debora ouverney",              email: "deboraouverney.psi@gmail.com",                  cnpj: "46637409000114" },
  { name: "Bruna Portatti",               email: "bruportatti@gmail.com",                         cnpj: "46634002000104" },
  { name: "Ivan Queiroz",                 email: "ivan_junior1402@hotmail.com",                   cnpj: "29437783000157" },
  { name: "Josielle Alves Bomfim",        email: "josielle_alves@hotmail.com",                    cnpj: "34456213000144" },
  { name: "Thaila Rios",                  email: "thailariosmkt@gmail.com",                       cnpj: "50861532000191" },
  { name: "junior",                       email: "junioradamiduarte12@gmail.com",                 cnpj: "50665734000168" },
  { name: "Vanessa Gonçalves",            email: "vanessa.goncalves199818@gmail.com",             cnpj: "51699530000100" }, // ⚠️ .vom → .com
  { name: "Thaina verni beppler",         email: "thainaverni@hotmail.com",                       cnpj: "57139868000194" },
  { name: "Restaurante Bom Paladar",      email: "ramosana0211@gmail.com",                        cnpj: "36666461000145" },
  { name: "Elisabete",                    email: "elisabete.luchetta@gmail.com",                  cnpj: "54377350000109" },
  { name: "Jeanne Mayre da Silva Maciel", email: "mayrejeanne@gmail.com",                         cnpj: "27880737000100" },
  { name: "Do Parque Fit",                email: "lilian.sa.nunes@hotmail.com",                   cnpj: "24862993000179" },
  { name: "Fast Good marmitas congeladas",email: "fastgood.gastronomiapratica@gmail.com",         cnpj: "27537253000155" },
  { name: "Brenari gastronomia",          email: "brenarigastronomia@gmail.com",                  cnpj: "51664926000112" },
  { name: "Thiago2",                      email: "malk_knight@hotmail.com",                       cnpj: "52262635802716" },
  { name: "Porta da Horta",               email: "portadahorta@gmail.com",                        cnpj: "28579953000175" },
  { name: "Afetive",                      email: "firmezaitalo@gmail.com",                         cnpj: "53700602000118" },
  { name: "Point Fit",                    email: "baiatoness@gmail.com",                           cnpj: "35132842000181" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function createUser({ name, email, cnpj }) {
  const normalizedEmail = email.toLowerCase().trim()

  // 1. Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { status: "approved" },
  })

  if (authError) {
    if (authError.message.includes("already registered") || authError.message.includes("already been registered")) {
      return { skipped: true, reason: "e-mail já cadastrado" }
    }
    throw new Error(`Auth error: ${authError.message}`)
  }

  const userId = authData.user.id

  // 2. Criar profile com role "client"
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    role: "client",
    full_name: name,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    throw new Error(`Profile error: ${profileError.message}`)
  }

  // 3. Criar registro de cliente
  const { error: clientError } = await admin.from("clients").insert({
    profile_id: userId,
    business_name: name,
    cnpj: cnpj,
    active: true,
  })

  if (clientError) {
    await admin.from("profiles").delete().eq("id", userId)
    await admin.auth.admin.deleteUser(userId)
    throw new Error(`Client error: ${clientError.message}`)
  }

  return { ok: true, userId }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔐 Supabase: ${SUPABASE_URL}`)
  console.log(`📋 Criando ${clients.length} clientes...\n`)

  const results = { ok: 0, skipped: 0, errors: [] }

  for (const client of clients) {
    process.stdout.write(`  • ${client.name.padEnd(35)} `)
    try {
      const result = await createUser(client)
      if (result.skipped) {
        console.log(`⏭  Ignorado — ${result.reason}`)
        results.skipped++
      } else {
        console.log(`✅ Criado (${result.userId})`)
        results.ok++
      }
    } catch (err) {
      console.log(`❌ Erro — ${err.message}`)
      results.errors.push({ name: client.name, email: client.email, error: err.message })
    }
  }

  console.log(`\n────────────────────────────────────────`)
  console.log(`✅ Criados:  ${results.ok}`)
  console.log(`⏭  Ignorados: ${results.skipped}`)
  console.log(`❌ Erros:    ${results.errors.length}`)

  if (results.errors.length > 0) {
    console.log("\nDetalhes dos erros:")
    for (const e of results.errors) {
      console.log(`  [${e.name}] ${e.email} — ${e.error}`)
    }
  }

  console.log(`\n🔑 Senha padrão de todos: ${PASSWORD}`)
  console.log("⚠️  Vanessa Gonçalves: e-mail corrigido de .vom → .com\n")
}

main().catch((err) => {
  console.error("Erro fatal:", err)
  process.exit(1)
})
