// Run this script to fix admin access
// Usage: node fix-admin-access.js

const { createClient } = require('@supabase/supabase-js')

// Read environment variables from .env.local file
const fs = require('fs')
const path = require('path')

function loadEnvFile() {
  const envPaths = [path.join(__dirname, '.env.local'), path.join(__dirname, '.env')]
  let envPath = null
  
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      envPath = p
      break
    }
  }
  
  if (!envPath) {
    console.error('Error: No .env or .env.local file found')
    process.exit(1)
  }
  
  console.log(`Reading environment from: ${envPath}`)
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envVars = {}
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      envVars[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  })
  
  return envVars
}

const env = loadEnvFile()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixAdminAccess() {
  try {
    console.log('Checking current profiles...')
    
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching profiles:', error)
      return
    }

    console.log('Current profiles:')
    profiles.forEach(profile => {
      console.log(`- ${profile.email || 'no-email'}: role=${profile.role || 'null'}, id=${profile.id}`)
    })

    // Fix known admin emails
    const adminEmails = ['xluisborges@gmail.com', 'leandrotogawa@gmail.com']
    
    for (const email of adminEmails) {
      console.log(`\nUpdating ${email} to admin role...`)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin', 
          updated_at: new Date().toISOString() 
        })
        .eq('email', email)

      if (updateError) {
        console.error(`Error updating ${email}:`, updateError)
      } else {
        console.log(`✓ Updated ${email} to admin role`)
      }
    }

    // Verify the updates
    console.log('\nVerification - Current admin profiles:')
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')

    if (adminProfiles) {
      adminProfiles.forEach(profile => {
        console.log(`✓ ${profile.email}: role=${profile.role}, id=${profile.id}`)
      })
    }

    console.log('\nDone! Try accessing the users page now.')
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

fixAdminAccess()
