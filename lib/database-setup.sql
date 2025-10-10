-- Criação das tabelas para o sistema de tickets

-- Tabela de Empresas/Clientes
CREATE TABLE IF NOT EXISTS empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_empresa TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL DEFAULT 'Suporteautomabo',
  ultimo_login TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  o_que_deveria_acontecer TEXT NOT NULL,
  ai_id TEXT NOT NULL,
  ai_name TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Resolved')),
  urgencia TEXT DEFAULT 'Média' CHECK (urgencia IN ('Baixa', 'Média', 'Alta', 'Crítica')),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tickets_empresa_id ON tickets(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_criado_em ON tickets(criado_em DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_empresas_updated_at 
  BEFORE UPDATE ON empresas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at 
  BEFORE UPDATE ON tickets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir acesso público para este caso de uso)
-- Em produção, você pode querer políticas mais restritivas baseadas em auth
CREATE POLICY "Permitir acesso público para leitura de empresas" 
  ON empresas FOR SELECT 
  USING (true);

CREATE POLICY "Permitir acesso público para tickets" 
  ON tickets FOR ALL 
  USING (true);

-- Inserir algumas empresas de exemplo (opcional)
INSERT INTO empresas (nome_empresa) 
VALUES 
  ('Empresa Exemplo 1'),
  ('Empresa Exemplo 2'),
  ('Automabo')
ON CONFLICT (nome_empresa) DO NOTHING;


