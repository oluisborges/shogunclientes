# Guia: Configurar OAuth no Meta for Developers

## Passo a Passo Detalhado

### 1. Acessar o Meta for Developers

1. Acesse: https://developers.facebook.com/
2. Faça login com sua conta Meta/Facebook
3. Clique em **"Meus Apps"** no canto superior direito

### 2. Selecionar ou Criar App

- Se já tem um app: clique nele
- Se não tem: clique em **"Criar App"** e siga o assistente

### 3. Adicionar Produto "Login do Facebook"

**Se ainda não tiver o produto adicionado:**

1. No menu lateral esquerdo, procure por **"Adicionar produto"** ou **"Add Product"**
2. Encontre **"Login do Facebook"** (Facebook Login)
3. Clique em **"Configurar"** ou **"Set Up"**

### 4. Configurar URIs de Redirecionamento

Existem **duas formas** de encontrar esta configuração:

#### **OPÇÃO A: Via Configurações do Login do Facebook**

1. No menu lateral esquerdo, clique em **"Login do Facebook"**
2. Clique em **"Configurações"** (ou "Settings")
3. Role a página até encontrar a seção:
   - **"URIs de redirecionamento OAuth válidos"** (português)
   - **"Valid OAuth Redirect URIs"** (inglês)

#### **OPÇÃO B: Via Configurações Básicas**

1. No menu lateral esquerdo, clique em **"Configurações"** → **"Básico"**
2. Role até o final da página
3. Procure por **"Domínios do App"** ou **"App Domains"**
4. Adicione: `localhost` (sem http://)

Depois volte para **Login do Facebook** → **Configurações** para adicionar a URI completa.

### 5. Adicionar a URI de Callback

Na caixa de texto **"URIs de redirecionamento OAuth válidos"**, adicione:

```
http://localhost:3000/api/meta/oauth/callback
```

**Para produção, adicione também:**
```
https://seu-dominio.com/api/meta/oauth/callback
```

### 6. Salvar Alterações

- Clique em **"Salvar alterações"** no final da página
- Aguarde a confirmação

## Configurações Adicionais Importantes

### Permissões do App

1. No menu lateral, clique em **"Permissões e recursos do app"** (App Review)
2. Procure por estas permissões:
   - **`ads_read`** - Para ler dados de anúncios
   - **`business_management`** - Para gerenciar contas de negócios

3. Se não estiverem ativas:
   - Clique em **"Solicitar"** ou **"Request"**
   - Preencha o formulário de solicitação
   - Aguarde aprovação da Meta (pode levar alguns dias)

### Modo de Desenvolvimento vs Produção

- **Modo de Desenvolvimento**: Funciona apenas para usuários que você adicionar como testadores
- **Modo Ativo**: Funciona para qualquer usuário (requer aprovação da Meta)

Para adicionar testadores (enquanto em desenvolvimento):

1. Vá em **"Funções"** → **"Funções"** (Roles)
2. Clique em **"Adicionar testadores"**
3. Adicione o email ou ID do Facebook dos usuários que vão testar

## Troubleshooting

### "Redirect URI Mismatch"

Se você receber este erro ao tentar conectar:

1. Verifique se a URI está **exatamente** como configurada
2. Certifique-se de que não há espaços extras
3. Verifique se `NEXT_PUBLIC_APP_URL` no `.env` está correto
4. A URI deve incluir o protocolo (`http://` ou `https://`)

### "App Not Set Up"

Se o Login do Facebook não estiver configurado:

1. Vá em **"Produtos"** no menu lateral
2. Clique em **"+ Adicionar produto"**
3. Encontre **"Login do Facebook"** e clique em **"Configurar"**

### Não encontro "Login do Facebook"

Pode estar com nome diferente dependendo do idioma:
- **Português**: "Login do Facebook"
- **Inglês**: "Facebook Login"
- **Espanhol**: "Inicio de sesión de Facebook"

## Estrutura do Menu (Referência Visual)

```
Meta for Developers
├── Meus Apps
│   └── [Seu App]
│       ├── Painel (Dashboard)
│       ├── Produtos
│       │   └── Login do Facebook
│       │       ├── Início rápido
│       │       └── Configurações ← AQUI!
│       ├── Configurações
│       │   ├── Básico
│       │   └── Avançado
│       ├── Permissões e recursos do app
│       └── Funções
│           └── Funções (para adicionar testadores)
```

## URLs Úteis

- **Meta for Developers**: https://developers.facebook.com/
- **Documentação OAuth**: https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
- **Documentação Marketing API**: https://developers.facebook.com/docs/marketing-apis

## Próximos Passos

Após configurar a URI de redirecionamento:

1. Certifique-se de que seu `.env` tem:
   ```env
   META_APP_ID=seu_app_id
   META_APP_SECRET=seu_app_secret
   NEXT_PUBLIC_META_APP_ID=seu_app_id
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. Reinicie o servidor:
   ```bash
   npm run dev
   ```

3. Acesse: http://localhost:3000/configuracoes

4. Clique em **"Conectar com Meta"**

5. Você será redirecionado para o Facebook para autorizar

6. Após autorizar, será redirecionado de volta e poderá sincronizar as contas
