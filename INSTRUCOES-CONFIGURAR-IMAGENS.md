# 📸 Instruções para Configurar Upload de Imagens

## ⚡ Configuração Rápida (2 passos)

Para que as imagens sejam salvas e exibidas nos tickets, você precisa executar esta configuração **uma única vez** no Supabase.

---

## 1️⃣ Adicionar Coluna de Imagens

Acesse o **Supabase Dashboard**:

1. Vá para: `https://supabase.com/dashboard`
2. Selecione seu projeto (Tickets Automabo)
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Cole o seguinte SQL:

```sql
-- Adicionar coluna de imagens na tabela tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS imagens JSONB DEFAULT '[]';
```

6. Clique em **RUN** (ou pressione `Ctrl+Enter`)
7. ✅ Deve aparecer: "Success. No rows returned"

---

## 2️⃣ Criar Bucket de Storage

Ainda no **Supabase Dashboard**:

1. No menu lateral, clique em **Storage**
2. Clique no botão **New Bucket**
3. Preencha:
   - **Name**: `ticket-images`
   - **Public bucket**: ✅ **Marque esta opção** (importante!)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: Deixe em branco (aceita todos os tipos de imagem)
4. Clique em **Create bucket**

### 2.1 Configurar Políticas de Acesso (Opcional)

Se você quiser configurar políticas de segurança mais detalhadas:

1. Clique no bucket `ticket-images`
2. Vá para a aba **Policies**
3. Clique em **New Policy**

**Política de Leitura Pública:**
```sql
CREATE POLICY "Permitir leitura pública de imagens"
ON storage.objects FOR SELECT
USING (bucket_id = 'ticket-images');
```

**Política de Upload:**
```sql
CREATE POLICY "Permitir upload de imagens"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ticket-images');
```

> **Nota:** Como o bucket é público, essas políticas já são aplicadas automaticamente.

---

## ✅ Pronto!

Após executar esses 2 passos, o sistema de tickets já estará configurado para:

- ✅ Fazer upload de imagens para o Supabase Storage
- ✅ Salvar URLs das imagens no banco de dados
- ✅ Exibir imagens quando clicar em um ticket
- ✅ Enviar imagens via webhook para n8n/Trello

---

## 🧪 Como Testar

1. Acesse o sistema: `http://localhost:3001`
2. Faça login
3. Clique em **Novo Chamado**
4. Adicione uma ou mais imagens (arraste, cole ou clique)
5. Preencha os dados e envie
6. Clique no ticket criado
7. ✅ As imagens devem aparecer no modal de detalhes!

---

## ⚠️ Troubleshooting

### ❌ Erro: "Bucket not found"

- Certifique-se de ter criado o bucket `ticket-images` no Storage
- Verifique se o bucket está marcado como **público**

### ❌ Imagens não aparecem no modal

- Verifique se a coluna `imagens` foi adicionada executando:
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'tickets' AND column_name = 'imagens';
  ```
- Deve retornar: `imagens | jsonb`

### ❌ Erro de permissão ao fazer upload

- Verifique se o bucket está marcado como **público**
- Verifique as políticas de acesso no Storage

---

## 📝 Arquivos Criados

- `lib/imageService.ts` - Serviço de upload de imagens
- `lib/migration-imagens.sql` - Migration SQL (para referência)
- `lib/executar-migration-imagens.ts` - Script auxiliar (opcional)

---

## 🚀 Próximos Passos

Após configurar, as imagens serão:

1. **Salvas no Supabase Storage** (bucket `ticket-images`)
2. **URLs armazenadas no banco** (coluna `imagens`)
3. **Exibidas no modal** ao clicar no ticket
4. **Enviadas via webhook** para automações

---

**Powered by Automabo** 💙

