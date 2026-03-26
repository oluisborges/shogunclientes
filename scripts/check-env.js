const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.local.example');

console.log('🔍 Verificando configuração do .env...\n');

if (!fs.existsSync(envPath)) {
  console.log('❌ Arquivo .env não encontrado!');
  console.log('📝 Copie .env.local.example para .env e configure as variáveis\n');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'META_APP_ID',
  'META_APP_SECRET',
  'NEXT_PUBLIC_META_APP_ID',
  'NEXT_PUBLIC_APP_URL',
];

const missing = [];
const configured = [];

requiredVars.forEach(varName => {
  const regex = new RegExp(`^${varName}=(.+)$`, 'm');
  const match = envContent.match(regex);
  
  if (!match || match[1].trim() === '' || match[1].includes('your_')) {
    missing.push(varName);
  } else {
    configured.push(varName);
  }
});

console.log('✅ Variáveis configuradas:');
configured.forEach(v => console.log(`   - ${v}`));

if (missing.length > 0) {
  console.log('\n⚠️  Variáveis faltando ou não configuradas:');
  missing.forEach(v => console.log(`   - ${v}`));
  console.log('\n📖 Consulte SETUP_META.md para instruções de configuração\n');
  process.exit(1);
} else {
  console.log('\n✅ Todas as variáveis estão configuradas!\n');
}
