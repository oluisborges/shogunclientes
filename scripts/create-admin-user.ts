/**
 * Script para criar usuário admin no Supabase
 * 
 * Execute com: npx tsx scripts/create-admin-user.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function createAdminUser() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const email = 'leandrotogawa@gmail.com'
  const password = 'mudar@1234'
  const fullName = 'Leandro Togawa'

  console.log('🔧 Criando usuário admin...')
  console.log(`📧 Email: ${email}`)

  try {
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError.message)
      
      // Se o usuário já existe, vamos apenas atualizar
      if (authError.message.includes('already registered')) {
        console.log('⚠️  Usuário já existe. Tentando atualizar...')
        
        // Buscar usuário existente
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users?.users.find(u => u.email === email)
        
        if (existingUser) {
          console.log(`✅ Usuário encontrado: ${existingUser.id}`)
          
          // Atualizar senha
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password }
          )
          
          if (updateError) {
            console.error('❌ Erro ao atualizar senha:', updateError.message)
          } else {
            console.log('✅ Senha atualizada')
          }
          
          // Atualizar perfil para admin
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              role: 'admin',
              full_name: fullName,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id)
          
          if (profileError) {
            console.error('❌ Erro ao atualizar perfil:', profileError.message)
          } else {
            console.log('✅ Perfil atualizado para admin')
          }
          
          console.log('\n✅ Usuário admin atualizado com sucesso!')
          console.log(`📧 Email: ${email}`)
          console.log(`🔑 Senha: ${password}`)
          console.log(`👤 Nome: ${fullName}`)
          console.log(`🎯 Role: admin`)
        }
      }
      return
    }

    if (!authData.user) {
      console.error('❌ Usuário não foi criado')
      return
    }

    console.log(`✅ Usuário criado no Auth: ${authData.user.id}`)

    // Atualizar perfil para admin
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        full_name: fullName,
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('❌ Erro ao atualizar perfil:', profileError.message)
      
      // Tentar inserir se não existir
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (insertError) {
        console.error('❌ Erro ao inserir perfil:', insertError.message)
      } else {
        console.log('✅ Perfil criado como admin')
      }
    } else {
      console.log('✅ Perfil atualizado para admin')
    }

    console.log('\n✅ Usuário admin criado com sucesso!')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Senha: ${password}`)
    console.log(`👤 Nome: ${fullName}`)
    console.log(`🎯 Role: admin`)

  } catch (err) {
    console.error('❌ Erro geral:', err)
  }
}

createAdminUser()
