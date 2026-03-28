-- Add provider, model and per-agent api_key to ai_agents
ALTER TABLE ai_agents
  ADD COLUMN IF NOT EXISTS provider  TEXT NOT NULL DEFAULT 'anthropic',
  ADD COLUMN IF NOT EXISTS model     TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  ADD COLUMN IF NOT EXISTS api_key   TEXT;

-- Update seed agents with defaults
UPDATE ai_agents SET
  provider = 'anthropic',
  model    = 'claude-sonnet-4-6'
WHERE provider IS NULL OR provider = '';
