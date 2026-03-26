# Configuração da Meta Ads API

## Passo 1: Configurar variáveis de ambiente

No seu arquivo `.env`, adicione as seguintes variáveis:

```env
# Meta Ads API
META_APP_ID=seu_app_id_aqui
META_APP_SECRET=seu_app_secret_aqui
NEXT_PUBLIC_META_APP_ID=seu_app_id_aqui

# App URL (importante para OAuth callback)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Importante:** 
- `META_APP_ID` e `META_APP_SECRET` são as credenciais do seu app Meta
- `NEXT_PUBLIC_META_APP_ID` é a versão pública do APP_ID (usada no frontend)
- `NEXT_PUBLIC_APP_URL` deve ser a URL onde sua aplicação está rodando

## Passo 2: Configurar o App na Meta

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Vá em "Meus Apps" e selecione seu app (ou crie um novo)
3. Em **Configurações > Básico**:
   - Copie o **ID do App** e cole em `META_APP_ID`
   - Copie a **Chave Secreta do App** e cole em `META_APP_SECRET`

4. Em **Produtos**, adicione **Login do Facebook** se ainda não estiver adicionado

5. Em **Login do Facebook > Configurações**:
   - Adicione a URL de callback em **URIs de redirecionamento OAuth válidos**:
     ```
     http://localhost:3000/api/meta/oauth/callback
     ```
   - Para produção, adicione também:
     ```
     https://seu-dominio.com/api/meta/oauth/callback
     ```

6. Em **Permissões e Recursos do App**:
   - Solicite as permissões: `ads_read` e `business_management`
   - Essas permissões podem precisar de revisão pela Meta

## Passo 3: Sincronizar Clientes

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Faça login na aplicação com uma conta de **admin** ou **gestor**

3. Navegue até **Configurações** no menu lateral

4. Clique em **"Conectar com Meta"**
   - Você será redirecionado para o Facebook
   - Faça login com a conta que tem acesso às contas de anúncios
   - Autorize as permissões solicitadas

5. Após ser redirecionado de volta, clique em **"Sincronizar Contas"**

6. O sistema irá:
   - Buscar todas as contas de anúncios que você tem acesso
   - Criar/atualizar registros de clientes no banco de dados
   - Armazenar os tokens de acesso para cada cliente

## Passo 4: Verificar Clientes Importados

Após a sincronização:
- Os clientes aparecerão no seletor de clientes (topo da página)
- Você pode navegar para **Métricas** ou **Campanhas** para ver os dados
- Os dados da Meta serão buscados automaticamente usando os tokens armazenados

## Troubleshooting

### "Credenciais da Meta não configuradas no servidor"
- Verifique se `META_APP_ID` e `META_APP_SECRET` estão no arquivo `.env`
- Reinicie o servidor após adicionar as variáveis

### "Permissões insuficientes"
- Apenas usuários com role `admin` ou `gestor` podem sincronizar clientes
- Verifique seu role na tabela `profiles` do Supabase

### "Token de acesso não encontrado"
- Faça o login com Meta novamente clicando em "Conectar com Meta"
- O token expira após 60 dias e precisa ser renovado

### Nenhuma conta encontrada
- Verifique se a conta Meta usada tem acesso a contas de anúncios
- Verifique se as permissões `ads_read` e `business_management` foram concedidas
- Tente revogar e reconectar a autorização

## Estrutura Técnica

### Endpoints criados:

1. **`/api/meta/oauth/callback`** (GET)
   - Recebe o código OAuth da Meta
   - Troca por access token
   - Armazena token em cookie seguro

2. **`/api/meta/sync-accounts`** (POST)
   - Busca contas de anúncios via Meta API
   - Cria/atualiza registros na tabela `clients`
   - Retorna lista de clientes sincronizados

### Fluxo de dados:

```
Usuário → Conectar com Meta → OAuth Facebook → Callback
                                                    ↓
                                            Access Token armazenado
                                                    ↓
Usuário → Sincronizar Contas → API Meta → Buscar Ad Accounts
                                                    ↓
                                        Criar/Atualizar Clientes DB
```

## Segurança

- Tokens de acesso são armazenados de forma segura no banco de dados
- Apenas admins/gestores podem sincronizar contas
- RLS (Row Level Security) garante que cada usuário vê apenas seus clientes
- Tokens expiram após 60 dias e precisam ser renovados
