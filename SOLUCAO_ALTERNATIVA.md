# Solução Alternativa - Importar Clientes sem OAuth

Como a Meta está exigindo verificações que não podem ser completadas agora, vamos usar uma abordagem alternativa: **importar clientes manualmente usando um token de acesso**.

## ✅ Vantagens desta abordagem

- ✅ Não precisa de OAuth configurado
- ✅ Não precisa de verificação do app Meta
- ✅ Funciona imediatamente
- ✅ Você mantém controle total do token
- ✅ Funciona localmente (sem ngrok)

## 📋 Passo a Passo

### 1. Obter Token de Acesso da Meta

1. Acesse: https://developers.facebook.com/tools/explorer
2. No topo da página, selecione seu **Meta App** no dropdown
3. Clique em **"Generate Access Token"** ou **"Gerar Token de Acesso"**
4. Marque as permissões necessárias:
   - ✅ `ads_read`
   - ✅ `business_management`
5. Clique em **"Generate Access Token"**
6. Autorize as permissões quando solicitado
7. **Copie o token** gerado (começa com algo como `EAAG...`)

### 2. Importar Clientes no Sistema

1. Certifique-se de que o servidor está rodando:
   ```bash
   npm run dev
   ```

2. Acesse: http://localhost:3000/configuracoes

3. Cole o token no campo **"Token de Acesso da Meta"**

4. Clique em **"Importar Clientes"**

5. Aguarde a sincronização

### 3. Verificar Clientes Importados

Após a importação:
- Os clientes aparecerão no seletor de clientes (topo da página)
- Você pode navegar para **Métricas** ou **Campanhas**
- Os dados serão buscados automaticamente

## 🔄 Renovar Token

O token gerado pelo Graph API Explorer expira após algumas horas. Quando expirar:

1. Volte ao Graph API Explorer
2. Gere um novo token
3. Importe novamente (vai atualizar os clientes existentes)

## 🎯 Token de Longa Duração (Opcional)

Para um token que dura 60 dias:

1. Gere um token no Graph API Explorer
2. Use a ferramenta de debug de token:
   - Acesse: https://developers.facebook.com/tools/debug/accesstoken
   - Cole seu token
   - Clique em "Extend Access Token"
   - Copie o novo token de longa duração

## ⚠️ Importante

- **Nunca compartilhe seu token** com ninguém
- O token dá acesso às suas contas de anúncios
- Guarde o token em local seguro
- Quando expirar, gere um novo

## 🚀 Próximos Passos

Depois que importar os clientes:

1. Vá em **Métricas** para ver os dados
2. Vá em **Campanhas** para ver suas campanhas
3. Configure **Metas** para acompanhar performance
4. Use **Histórico** para análise temporal

## 🔧 Troubleshooting

### "Nenhuma conta de anúncios encontrada"
- Verifique se sua conta Meta tem acesso a contas de anúncios
- Certifique-se de que autorizou as permissões corretas

### "Token inválido ou expirado"
- Gere um novo token no Graph API Explorer
- Certifique-se de selecionar o app correto

### "Erro ao importar"
- Verifique se você é admin ou gestor no sistema
- Veja o console do navegador (F12) para mais detalhes
- Verifique se o servidor está rodando

## 📝 Resumo

```
1. Graph API Explorer → Gerar Token
2. Copiar Token
3. /configuracoes → Colar Token
4. Importar Clientes
5. Pronto! ✅
```

Essa solução funciona perfeitamente para desenvolvimento e testes. Quando o app Meta estiver totalmente verificado, você pode migrar para OAuth automático.
