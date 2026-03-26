# Alternativa ao ngrok: LocalTunnel (Sem cadastro necessário)

LocalTunnel é uma alternativa gratuita ao ngrok que não requer cadastro.

## 1. Instalar LocalTunnel

```bash
npm install -g localtunnel
```

## 2. Iniciar o servidor Next.js

```bash
npm run dev
```

## 3. Em outro terminal, iniciar o túnel

```bash
lt --port 3000 --subdomain shogunclientes
```

Se o subdomínio estiver ocupado, tente outro nome:
```bash
lt --port 3000 --subdomain shogun-meta-oauth
```

Ou deixe o LocalTunnel escolher um nome aleatório:
```bash
lt --port 3000
```

## 4. Copiar a URL

O LocalTunnel vai mostrar algo como:
```
your url is: https://shogunclientes.loca.lt
```

## 5. Configurar no Meta

Use a URL do LocalTunnel:
```
https://shogunclientes.loca.lt/api/meta/oauth/callback
```

## 6. Atualizar .env

```env
NEXT_PUBLIC_APP_URL=https://shogunclientes.loca.lt
```

## 7. Reiniciar servidor Next.js

```bash
# Pare o servidor (Ctrl+C) e reinicie
npm run dev
```

## Importante

- Na primeira vez que acessar a URL, o LocalTunnel vai pedir para você clicar em "Continue"
- A URL permanece a mesma enquanto o túnel estiver ativo
- Se você parar e reiniciar, pode usar o mesmo subdomain

## Vantagens vs ngrok

✅ Não requer cadastro ou authtoken
✅ Gratuito e ilimitado
✅ Pode escolher seu próprio subdomain
✅ Mais simples de configurar

## Desvantagens

⚠️ Tela de confirmação na primeira visita
⚠️ Pode ser mais lento que ngrok
⚠️ Menos estável para uso prolongado
