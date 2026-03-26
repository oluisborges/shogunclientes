# Teste Simples - Sem ngrok

Vamos testar primeiro SEM o ngrok para garantir que o login funciona localmente.

## 1. Pare o ngrok (se estiver rodando)

Feche o terminal do ngrok (Ctrl+C)

## 2. Configure .env para localhost

No arquivo `.env`, certifique-se de que está assim:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Reinicie o servidor

```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

## 4. Teste o login

1. Acesse: http://localhost:3000/login
2. Tente fazer login
3. Funciona?

---

## Se funcionar localmente:

O problema é com a configuração do ngrok/Meta. Vamos resolver depois.

## Se NÃO funcionar localmente:

Abra o Console do navegador (F12) e veja se há erros em vermelho.
Me envie uma screenshot dos erros.

---

## Próximos passos após confirmar que funciona localmente:

1. Vamos configurar o Supabase corretamente
2. Depois configurar o ngrok com domínio fixo
3. Aí sim testar a integração com Meta
