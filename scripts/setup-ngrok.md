# Usar ngrok para desenvolvimento com Meta OAuth

Se a Meta não aceitar 127.0.0.1 ou localhost, use ngrok:

## 1. Criar conta no ngrok

1. Acesse: https://dashboard.ngrok.com/signup
2. Crie uma conta gratuita
3. Após login, acesse: https://dashboard.ngrok.com/get-started/your-authtoken
4. Copie seu authtoken

## 2. Instalar ngrok

```bash
# Via npm
npm install -g ngrok

# Ou baixe de: https://ngrok.com/download
```

## 3. Autenticar ngrok

```bash
ngrok config add-authtoken SEU_TOKEN_AQUI
```

## 4. Iniciar túnel

```bash
ngrok http 3000
```

## 3. Copiar URL HTTPS

O ngrok vai mostrar algo como:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

## 4. Configurar no Meta

Use a URL do ngrok:
```
https://abc123.ngrok.io/api/meta/oauth/callback
```

## 5. Atualizar .env

```env
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

## 6. Reiniciar servidor

```bash
npm run dev
```

**Nota:** A URL do ngrok muda toda vez que você reinicia. Para URL fixa, crie conta no ngrok.
