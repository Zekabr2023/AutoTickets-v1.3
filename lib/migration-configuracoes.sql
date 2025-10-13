-- Migration para adicionar configurações do sistema
-- Inclui domínios permitidos para iframe e outras configurações

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração inicial para domínios permitidos
INSERT INTO configuracoes_sistema (chave, valor, descricao) 
VALUES 
  ('iframe_domains', '[]', 'Lista de domínios permitidos para exibir a aplicação em iframe (JSON array)'),
  ('admin_notifications', 'true', 'Se o admin deve receber notificações de novos tickets')
ON CONFLICT (chave) DO NOTHING;

-- Adicionar campo de solução aos tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS solucao TEXT,
ADD COLUMN IF NOT EXISTS resolvido_por TEXT,
ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMPTZ;

-- Adicionar status "InAnalysis" se não existir
ALTER TABLE tickets 
DROP CONSTRAINT IF EXISTS tickets_status_check;

ALTER TABLE tickets 
ADD CONSTRAINT tickets_status_check 
CHECK (status IN ('Pending', 'InAnalysis', 'Resolved'));

-- Trigger para atualizar updated_at automaticamente na tabela de configurações
CREATE TRIGGER update_configuracoes_sistema_updated_at 
  BEFORE UPDATE ON configuracoes_sistema 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS na tabela de configurações
ALTER TABLE configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso público às configurações
CREATE POLICY "Permitir acesso público para configurações" 
  ON configuracoes_sistema FOR ALL 
  USING (true);
