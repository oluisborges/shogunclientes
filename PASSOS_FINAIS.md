# Passos Finais - Configurar Meta OAuth

Agora que o login está funcionando, vamos configurar a integração com Meta.

## 1️⃣ Configurar domínio fixo no ngrok

1. Acesse: https://dashboard.ngrok.com/domains
2. Clique em **"Create Domain"** ou **"New Domain"**
3. Escolha um nome (exemplo: `shogun-meta`)
4. Copie o domínio completo (exemplo: `shogun-meta.ngrok-free.app`)

## 2️⃣ Iniciar ngrok com domínio fixo

No terminal, execute:

```bash
ngrok http 3000 --domain=SEU-DOMINIO.ngrok-free.app
```

Exemplo:
```bash
ngrok http 3000 --domain=shogun-meta.ngrok-free.app
```

Deixe esse terminal aberto!

## 3️⃣ Atualizar .env

No arquivo `.env`, atualize:

```env
NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO.ngrok-free.app
```

Exemplo:
```env
NEXT_PUBLIC_APP_URL=https://shogun-meta.ngrok-free.app
```

## 4️⃣ Configurar Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** → **URL Configuration**
4. Configure:
   - **Site URL**: `https://SEU-DOMINIO.ngrok-free.app`
   - **Redirect URLs**: `https://SEU-DOMINIO.ngrok-free.app/**`
5. Clique em **Save**

## 5️⃣ Configurar Meta

1. Acesse: https://developers.facebook.com/apps
2. Selecione seu app
3. Vá em **Login do Facebook** → **Configurações**
4. Em **URIs de redirecionamento OAuth válidos**, adicione:
   ```
   https://SEU-DOMINIO.ngrok-free.app/api/meta/oauth/callback
   ```
5. Clique em **Salvar alterações**

## 6️⃣ Reiniciar servidor Next.js

```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

## 7️⃣ Testar a sincronização

1. Acesse: `https://SEU-DOMINIO.ngrok-free.app`
2. Faça login (se necessário)
3. Vá em **Configurações** no menu lateral
4. Clique em **"Conectar com Meta"**
5. Autorize no Facebook
6. Clique em **"Sincronizar Contas"**

---

## ✅ Checklist

- [ ] Domínio fixo criado no ngrok
- [ ] ngrok rodando com domínio fixo
- [ ] .env atualizado com URL do ngrok
- [ ] Supabase configurado com URL do ngrok
- [ ] Meta configurado com callback do ngrok
- [ ] Servidor Next.js reiniciado
- [ ] Teste de sincronização realizado

---

## 🆘 Se der erro

### "Redirect URI Mismatch"
- Verifique se a URI no Meta está EXATAMENTE igual
- Deve incluir `https://` e `/api/meta/oauth/callback`

### "Invalid Site URL"
- Verifique se configurou corretamente no Supabase
- Deve ser HTTPS (ngrok fornece HTTPS automaticamente)

### "Token não encontrado"
- Faça logout e login novamente
- Limpe cookies do navegador

---

## 📝 Comandos Resumidos

Terminal 1 (ngrok):
```bash
ngrok http 3000 --domain=SEU-DOMINIO.ngrok-free.app
```

Terminal 2 (Next.js):
```bash
npm run dev
```

Ambos devem ficar rodando simultaneamente!
