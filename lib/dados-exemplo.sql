-- Script SQL para inserir dados de exemplo no sistema de tickets

-- Inserir empresas de exemplo
INSERT INTO empresas (nome_empresa, senha) 
VALUES 
  ('Automabo', 'Suporteautomabo'),
  ('Empresa Teste', 'Suporteautomabo'),
  ('TechCorp', 'Suporteautomabo')
ON CONFLICT (nome_empresa) DO NOTHING;

-- Para visualizar as empresas criadas:
SELECT id, nome_empresa, senha, criado_em FROM empresas ORDER BY nome_empresa;

-- Para criar uma nova empresa manualmente:
-- INSERT INTO empresas (nome_empresa, senha) 
-- VALUES ('Nome da Sua Empresa', 'Suporteautomabo');

-- Para alterar a senha de uma empresa específica:
-- UPDATE empresas SET senha = 'NovaSenha' WHERE nome_empresa = 'Nome da Empresa';

-- Para deletar uma empresa (cuidado: isso deletará todos os tickets relacionados):
-- DELETE FROM empresas WHERE nome_empresa = 'Nome da Empresa';


