# Como Gerar Token com Permissões Corretas

## Problema Identificado

O token que você gerou tem apenas estas permissões:
- `ads_read`
- `business_management`
- `public_profile`

Mas está faltando a permissão para acessar as **contas de anúncios**.

## ✅ Solução: Gerar Token Correto

### Passo 1: Acessar Graph API Explorer

1. Acesse: https://developers.facebook.com/tools/explorer
2. No topo, selecione seu app: **Samurai App** (ID: 1815688891321...)

### Passo 2: Adicionar Permissões Corretas

1. Clique em **"Permissions"** (ou "Permissões") no lado direito
2. Na caixa de busca, procure e marque:
   - ✅ `ads_read`
   - ✅ `ads_management` (IMPORTANTE!)
   - ✅ `business_management`

### Passo 3: Gerar Token

1. Clique em **"Generate Access Token"**
2. Autorize todas as permissões quando solicitado
3. Copie o novo token

### Passo 4: Testar o Token (Opcional mas Recomendado)

Antes de importar, teste se o token funciona:

1. No Graph API Explorer, com o token gerado
2. No campo de consulta, digite: `me/adaccounts`
3. Clique em **"Submit"** ou **"Enviar"**
4. Você deve ver suas contas de anúncios listadas

Se aparecer erro, significa que:
- Sua conta não tem acesso a contas de anúncios, OU
- Você precisa ser adicionado como admin/anunciante nas contas

### Passo 5: Importar no Sistema

1. Copie o token gerado
2. Vá em: http://localhost:3000/configuracoes
3. Cole o token
4. Clique em **"Importar Clientes"**

## 🔍 Verificar Acesso às Contas

Se mesmo com as permissões corretas não funcionar, verifique:

### No Business Manager

1. Acesse: https://business.facebook.com/
2. Vá em **Configurações de Negócios**
3. Clique em **Contas de Anúncios** no menu lateral
4. Verifique se você tem acesso às contas
5. Seu papel deve ser: **Admin** ou **Anunciante**

### Adicionar Acesso (se necessário)

Se você não aparecer nas contas:
1. Peça ao proprietário da conta para te adicionar
2. Ele deve ir em: Business Manager → Contas de Anúncios → Adicionar Pessoas
3. Adicionar seu email/ID com papel de **Admin**

## 🆘 Troubleshooting

### "Permissões insuficientes"
- Certifique-se de marcar `ads_management` (não apenas `ads_read`)
- Verifique se autorizou TODAS as permissões solicitadas

### "Nenhuma conta encontrada"
- Sua conta Meta pode não ter acesso a contas de anúncios
- Verifique no Business Manager se você está listado nas contas

### "Token inválido"
- Gere um novo token
- Certifique-se de selecionar o app correto no topo

## 📝 Checklist

- [ ] Graph API Explorer aberto
- [ ] App correto selecionado (Samurai App)
- [ ] Permissões marcadas: ads_read, ads_management, business_management
- [ ] Token gerado
- [ ] Teste com `me/adaccounts` bem-sucedido
- [ ] Token colado no sistema
- [ ] Importação realizada

## 🎯 Permissões Necessárias

```
✅ ads_read          - Ler dados de anúncios
✅ ads_management    - Gerenciar contas de anúncios (ESSENCIAL!)
✅ business_management - Acessar dados de negócios
```

A permissão **`ads_management`** é a chave para acessar as contas de anúncios!
