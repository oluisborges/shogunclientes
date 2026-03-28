-- Global app settings (key-value store)
CREATE TABLE app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_settings" ON app_settings
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- AI agents for Shogun IA
CREATE TABLE ai_agents (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT        NOT NULL,
  category       TEXT        NOT NULL DEFAULT '',
  icon_name      TEXT        NOT NULL DEFAULT 'Bot',
  system_prompt  TEXT        NOT NULL DEFAULT '',
  active         BOOLEAN     NOT NULL DEFAULT true,
  display_order  INT         NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "admins_manage_agents" ON ai_agents
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Authenticated users can read active agents
CREATE POLICY "users_read_active_agents" ON ai_agents
  FOR SELECT TO authenticated
  USING (active = true);

-- Seed default agents
INSERT INTO ai_agents (name, category, icon_name, system_prompt, display_order) VALUES
  ('Especialista em Delivery', 'Estratégia de Negócio',  'UtensilsCrossed', 'Você é um especialista em negócios de delivery e restaurantes. Ajude o usuário a melhorar seus resultados operacionais, aumentar o ticket médio, reduzir custos e crescer o faturamento. Responda em português brasileiro de forma objetiva e prática.', 1),
  ('Criador de Conteúdo',      'Marketing e Ads',        'Megaphone',       'Você é um especialista em criação de conteúdo para redes sociais e anúncios no Meta Ads (Facebook e Instagram). Ajude a criar textos persuasivos, legendas e roteiros de vídeo para delivery e restaurantes. Responda em português brasileiro.', 2),
  ('Analista de Métricas',     'Análise de Dados',       'BarChart3',       'Você é um analista de marketing digital especializado em Meta Ads para delivery. Interprete métricas como ROAS, CPM, CTR, CPC e sugira otimizações práticas. Responda em português brasileiro de forma clara e direta.', 3);
