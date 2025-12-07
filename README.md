# 🎫 Sistema de Tickets - Automabo

Sistema completo de gerenciamento de tickets/chamados com integração Supabase e webhooks n8n.

---

## ⚡ INÍCIO RÁPIDO (3 Passos)

### 1️⃣ Criar arquivo `.env`

**Veja suas credenciais em:** [CREDENCIAIS-SUPABASE.txt](CREDENCIAIS-SUPABASE.txt)

Crie um arquivo `.env` na raiz do projeto com:

```env
# Veja o arquivo .env.example para o template
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_N8N_WEBHOOK_URL=sua-url-do-webhook
```

### 2️⃣ Instalar e rodar

```bash
npm install
npm run dev
```

### 3️⃣ Acessar e fazer login

**Cliente:**
- **URL:** http://localhost:5173
- **Empresa:** CBNET (ou Automabo)
- **Senha:** Suporteautomabo

**Admin:**
- **URL:** http://localhost:5173
- **Empresa:** AUTOMABO
- **Senha:** Automabo.2026
- **Acessa:** Painel Administrativo completo

🎉 **Pronto!** Sistema funcionando!

---

## ✨ Funcionalidades

### 🔐 Autenticação
- ✅ Login por empresa com senha
- ✅ **Painel Admin** (login: AUTOMABO / Automabo.2026)
- ✅ **Sessão persiste com F5** (localStorage)
- ✅ Botão de logout
- ✅ Registro automático do último login
- ✅ **Configurações de notificações** (email + WhatsApp)

### 🔧 Painel Administrativo (Admin)
- ✅ **Estatísticas gerais** de todas as empresas
- ✅ **Filtro de data** (início e fim)
- ✅ **6 Cards:** Empresas, Total Tickets, Pendentes, Em Análise, Resolvidos, Hoje
- ✅ **Lista de empresas** com contadores de tickets
- ✅ **Cadastrar nova empresa** (modal)
- ✅ **Cadastrar nova IA** para qualquer empresa (modal)
- ✅ Ver último login de cada empresa
- ✅ Ver notificações configuradas

### 🎫 Gestão de Tickets
- ✅ **ID Numérico Sequencial** (#0001, #0002, #0003...)
- ✅ **Busca colapsada** (ícone de lupa com animação elegante)
- ✅ **Título obrigatório** com contador de caracteres
- ✅ Criar tickets com todas as informações
- ✅ **3 Status:** Pendente, Em Análise, Resolvido
- ✅ **Deletar tickets** (2 formas: modal OU botão direito)
- ✅ **Animação de exclusão** (fade-out + scale + slide)
- ✅ **Menu de contexto** (clique direito) elegante
- ✅ Visualização em 3 colunas separadas
- ✅ Detalhes completos em modal

### 📊 Dashboard
- ✅ **4 Cards de estatísticas:** Pendentes, Em Análise, Resolvidos, Taxa
- ✅ Atualização em tempo real (Supabase Realtime)
- ✅ Filtros automáticos por status

### 📸 Upload de Imagens
- ✅ **Clique na área** (abre explorador de arquivos)
- ✅ **Drag & Drop Global** (tela inteira vira área de drop!)
- ✅ **Drag & Drop na área** (arrastar direto na caixa)
- ✅ **Paste (Ctrl+V)** de imagens
- ✅ Múltiplas imagens por ticket
- ✅ Preview antes do envio

### 🔔 Webhooks n8n
- ✅ **Webhook ao criar:** Envio automático com TODOS os dados + imagens
- ✅ **Webhook ao deletar:** Envia número do ticket para apagar do Trello
- ✅ Logs detalhados no console
- ✅ FormData com JSON + campos individuais
- ✅ Não bloqueante (assíncrono)

### 🤖 IAs por Empresa
- ✅ Cada empresa tem suas próprias IAs
- ✅ **CBNET:** Ana, Mariana
- ✅ **Automabo:** AlphaBot, BetaBrain, GammaThinker
- ✅ Dropdown dinâmico

### 🎨 Interface
- ✅ Design moderno e responsivo
- ✅ Loading states em todas as ações
- ✅ Feedback visual claro
- ✅ **Footer "powered by Automabo"** (link para automabo.com.br)

---

## 🖱️ Menu de Contexto & Animações

### Menu de Contexto (Botão Direito)
**Clique DIREITO** em qualquer ticket para acessar menu rápido:

**Visual:**
- Fundo escuro elegante (gray-800)
- Border sutil (gray-600)
- Shadow grande (shadow-2xl)
- Hover: fundo vermelho suave
- Ícone: 🗑️ aumenta no hover

**Comportamento:**
- Fecha ao clicar fora
- Fecha ao rolar a página
- Posição: onde você clicou
- Opção: "Excluir Chamado"
- **Atalho**: 2 cliques ao invés de 4 (modal)

**Segurança:**
- Mesma confirmação em 2 etapas
- Nada é deletado sem confirmação

### Animação de Exclusão
Quando você deleta um ticket (modal OU menu contexto):

**Efeitos visuais simultâneos:**
- **Fade-out**: opacity 100% → 0%
- **Scale**: diminui para 95%
- **Slide**: desliza 32px para esquerda
- **Duração**: 300ms (suave)
- **Pointer-events**: none (não clicável)

**Timeline:**
```
0ms    → Confirmação aceita
0ms    → 🎬 Ticket entra em "deletingTicketIds"
0-300ms → 💫 Animação visual (fade + scale + slide)
300ms  → ✨ Ticket invisível
500ms  → 🗑️ Ticket removido do array
500ms  → 📊 Estatísticas recalculam
500ms  → 📤 Webhook enviado
15.5s  → 🗄️ Banco limpa
```

**Resultado:**
Interface profissional com feedback visual claro! ✨

---

## 🗄️ Banco de Dados (Supabase)

### ✅ Já Configurado Automaticamente via MCP!

**Projeto:** Tickets Automabo  
**Região:** South America (São Paulo)  
**Status:** ✅ Ativo e Saudável

### Tabelas:

#### 1. `empresas` (4 empresas cadastradas)
- Automabo
- **CBNET** 
- Empresa Teste
- TechCorp

**Senha padrão:** `Suporteautomabo`

#### 2. `tickets` (12 colunas)
- Vinculado à empresa
- Nome do cliente
- Título, descrição, comportamento esperado
- IA relacionada
- Status: Pending, InAnalysis, Resolved
- Urgência: Baixa, Média, Alta, Crítica
- Timestamps automáticos

#### 3. `ias` (5 IAs cadastradas)
- **CBNET:** Ana, Mariana
- **Automabo:** AlphaBot, BetaBrain, GammaThinker

### Recursos:
- ✅ Row Level Security (RLS) habilitado
- ✅ Índices otimizados para performance
- ✅ Triggers automáticos para timestamps
- ✅ Foreign keys com CASCADE DELETE
- ✅ Realtime Subscriptions habilitado

---

## 🔄 Atualização em Tempo Real

### Como alterar status de um ticket:

1. Abra o **SQL Editor** no Supabase
2. Execute:

```sql
-- Ver tickets pendentes
SELECT id, titulo, nome_cliente, status FROM tickets WHERE status = 'Pending';

-- Mover para "Em Análise"
UPDATE tickets SET status = 'InAnalysis' WHERE id = 'ID_DO_TICKET';

-- Resolver ticket
UPDATE tickets SET status = 'Resolved' WHERE id = 'ID_DO_TICKET';
```

3. **Volte pro Dashboard** (NÃO recarregue!)
4. **Veja a mágica:**
   - ✅ Estatísticas atualizam automaticamente
   - ✅ Ticket move para coluna correta
   - ✅ Badge muda de cor
   - ✅ Tudo em tempo real! ⚡

---

## 🤖 Gerenciar IAs

### Adicionar novas IAs para uma empresa:

```sql
-- Ver IDs das empresas
SELECT id, nome_empresa FROM empresas;

-- Adicionar IA para CBNET
INSERT INTO ias (empresa_id, nome) 
VALUES ('af83198c-8093-4b18-af97-7fb5334ef605', 'Carlos');

-- Ver todas as IAs
SELECT e.nome_empresa, i.nome as ia_nome 
FROM ias i 
JOIN empresas e ON i.empresa_id = e.id
ORDER BY e.nome_empresa, i.nome;
```

### IDs das Empresas:
| Empresa       | ID                                   |
|---------------|--------------------------------------|
| CBNET         | af83198c-8093-4b18-af97-7fb5334ef605 |
| Automabo      | 9569775a-563e-4c13-8d9d-d56239057c2e |
| Empresa Teste | b3f02504-89ef-4413-9f01-908869c9328c |
| TechCorp      | e08f0e5a-d515-451e-9b46-756e4503eb26 |

---

## 🔔 Webhooks n8n

### Webhook ao Criar Ticket

**URL:** `https://n8n-cbnet.automabo.com.br/webhook/Tickets`

**O que é enviado:**

```javascript
// Campo JSON (recomendado usar este)
ticket_data: {
  "empresa_nome": "CBNET",
  "ticket_numero": 42,
  "titulo": "Problema com Ana",
  "descricao": "A IA não está respondendo...",
  "o_que_deveria_acontecer": "Deveria responder normalmente",
  "ai_name": "Ana",
  "urgencia": "Alta",
  "ticket_id": "abc-123",
  "total_imagens": 2
}

// Campos individuais (também disponíveis)
empresa_nome, ticket_numero, titulo, descricao, o_que_deveria_acontecer,
ai_name, urgencia, ticket_id, total_imagens

// Imagens (se houver)
imagem_0: [Arquivo binário]
imagem_0_nome: "screenshot.png"
imagem_1: [Arquivo binário]
imagem_1_nome: "erro.jpg"
```

### Como acessar no n8n:

**Opção 1 (Recomendada):**
```javascript
const data = JSON.parse($json.ticket_data);
// Acesse: data.empresa_nome, data.titulo, etc.
```

**Opção 2:**
```javascript
$json.empresa_nome
$json.titulo
$json.descricao
// etc...
```

### Verificar logs (criar):

Abra o console do navegador (F12) ao criar um ticket e veja:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 ENVIANDO WEBHOOK
  • Empresa: CBNET
  • Título: ...
  • Descrição: ...
  • Total Imagens: 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 CAMPOS NO FORMDATA:
  • ticket_data: {...}
  • empresa_nome: CBNET
  • imagem_0: [Arquivo: foto.png]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ WEBHOOK ENVIADO COM SUCESSO!
```

---

### Webhook ao Deletar Ticket

**URL:** `https://n8n-cbnet.automabo.com.br/webhook/apagartrello`

**O que é enviado:**
```json
{
  "ticket_numero": 42
}
```

**Apenas o número!** Suficiente para identificar e apagar o card no Trello.

**Quando é disparado:**
- Ao deletar um ticket (confirmação do modal)
- **IMEDIATAMENTE** após confirmação
- **ANTES** de deletar do banco (banco tem delay de 15s)
- Cliente vê exclusão instantânea ⚡
- n8n tem tempo para processar e apagar do Trello
- Banco limpa após 15 segundos (em background)

**Como usar no n8n:**
```javascript
const numeroTicket = $json.ticket_numero;
// Use para buscar card no Trello: "#0042"
// Delete o card encontrado
```

**Logs no console (ao deletar):**
```
🗑️ ENVIANDO WEBHOOK DE DELEÇÃO
URL: .../apagartrello
Número do Ticket: #0042
✅ WEBHOOK DE DELEÇÃO ENVIADO COM SUCESSO!
```

---

## 📊 Status dos Tickets

### 3 Status Disponíveis:

| Status | Cor | Quando usar |
|--------|-----|-------------|
| 🟡 **Pending** | Amarelo | Ticket acabou de ser criado |
| 🔵 **InAnalysis** | Azul | Ticket sendo analisado |
| 🟢 **Resolved** | Verde | Ticket resolvido |

### Dashboard - 4 Cards:
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Pendentes │ │Em Análise│ │Resolvidos│ │   Taxa   │
│    5     │ │    3     │ │    12    │ │   80%    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Listas - 3 Colunas:
```
┌──────────┐ ┌──────────┐ ┌──────────┐
│Pendentes │ │Em Análise│ │Resolvidos│
└──────────┘ └──────────┘ └──────────┘
```

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Deploy:** Netlify
- **Automação:** n8n (webhooks)
- **Persistência:** localStorage (sessão)

---

## 🚀 Deploy no Netlify

### 1. Preparar repositório:
```bash
git add .
git commit -m "Sistema de tickets completo"
git push origin main
```

### 2. No Netlify:
1. Conecte seu repositório (GitHub/GitLab)
2. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

### 3. Variáveis de Ambiente:
No Netlify, adicione em **Site settings → Environment variables**:
```
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_N8N_WEBHOOK_URL=sua-url-do-webhook
```

> 💡 **Importante:** Use suas credenciais reais do arquivo `.env` local

### 4. Deploy!
O deploy é automático após conectar o repositório.

**Arquivo `netlify.toml` já está configurado!** ✅

---

## 🎯 Casos de Uso

### Criar Ticket:
1. Login
2. Clique "Abrir Chamado"
3. Selecione a IA (Ana, Mariana, etc.)
4. Preencha descrição e comportamento esperado
5. **Arraste imagens** na tela inteira (overlay azul)
6. Envie
7. Ticket criado + webhook disparado!

### Deletar Ticket (2 Formas):

**Forma 1: Via Modal**
1. Clique no ticket
2. Role até o fim do modal
3. "🗑️ Cancelar/Excluir Chamado"
4. Confirme

**Forma 2: Botão Direito (Rápido!)** ⚡
1. **Clique DIREITO** no ticket
2. Menu aparece elegante
3. "🗑️ Excluir Chamado"
4. Confirme

**Ambos fazem:**
5. 🎬 **Animação** (fade-out + scale + slide)
6. ⚡ Ticket desaparece com efeito visual
7. 📊 Estatísticas atualizam
8. 📤 Webhook enviado para Trello
9. ⏱️ **Banco limpa após 15s** (background)

**Por que 15 segundos?**
- n8n tem tempo para processar e apagar do Trello
- Cliente vê exclusão instantânea (UX perfeita)
- Sincronia garantida entre sistemas

### Alterar Status (Supabase):
```sql
UPDATE tickets SET status = 'InAnalysis' WHERE id = 'abc-123';
```
Dashboard atualiza automaticamente! ⚡

---

## 🔐 Segurança

- ✅ Row Level Security (RLS) habilitado
- ✅ Variáveis de ambiente para credenciais
- ✅ Senha não salva no localStorage
- ✅ Headers de segurança no Netlify
- ✅ Confirmação em 2 etapas para deletar

---

## 🧪 Testes Recomendados

### ✅ Teste 1: Login Persiste
```bash
1. Faça login
2. Aperte F5
3. Resultado: Continua logado ✅
```

### ✅ Teste 2: Drag & Drop Global
```bash
1. Abrir Chamado
2. Arraste imagem sobre a tela
3. Resultado: Overlay azul aparece ✅
4. Solte em qualquer lugar
5. Resultado: Imagem adicionada ✅
```

### ✅ Teste 3: Tempo Real
```bash
1. Dashboard aberto
2. No Supabase: UPDATE tickets SET status = 'InAnalysis' ...
3. Resultado: Dashboard atualiza sozinho ✅
```

### ✅ Teste 4: Webhook
```bash
1. Console aberto (F12)
2. Crie ticket com imagens
3. Resultado: Logs detalhados + "✅ WEBHOOK ENVIADO" ✅
```

---

## 📊 Estrutura do Banco

### Tabela `empresas`:
```
- id (UUID)
- nome_empresa (TEXT UNIQUE)
- senha (TEXT) - padrão: "Suporteautomabo"
- ultimo_login (TIMESTAMPTZ)
- email_notificacao (TEXT) - Email para receber notificações
- whatsapp_notificacao (TEXT) - WhatsApp para receber notificações
- notificacoes_ativas (BOOLEAN) - Se as notificações estão ativas
- criado_em, atualizado_em (TIMESTAMPTZ)
```

### Tabela `tickets`:
```
- id (UUID)
- numero (INTEGER UNIQUE) - ID numérico sequencial (#0001, #0002...)
- empresa_id (UUID FK)
- nome_cliente (TEXT)
- titulo (TEXT)
- descricao (TEXT)
- o_que_deveria_acontecer (TEXT)
- ai_id, ai_name (TEXT)
- status (Pending/InAnalysis/Resolved)
- urgencia (Baixa/Média/Alta/Crítica)
- criado_em, atualizado_em (TIMESTAMPTZ)
```

### Tabela `ias`:
```
- id (UUID)
- empresa_id (UUID FK)
- nome (TEXT)
- ativo (BOOLEAN)
- criado_em, atualizado_em (TIMESTAMPTZ)
```

---

## 📁 Estrutura do Projeto

```
├── components/              # Componentes React
│   ├── App.tsx             # App principal + localStorage + footer
│   ├── LoginScreen.tsx     # Tela de login
│   ├── Dashboard.tsx       # Dashboard + 3 colunas + logout
│   ├── NewTicketForm.tsx   # Criar ticket + drag global
│   ├── TicketList.tsx      # Lista de tickets
│   ├── TicketDetailsModal.tsx # Detalhes + deletar
│   └── ImageDropzone.tsx   # Upload de imagens
│
├── lib/                    # Serviços
│   ├── supabase.ts         # Cliente Supabase
│   ├── authService.ts      # Login/Logout
│   ├── ticketService.ts    # CRUD de tickets
│   ├── iaService.ts        # Gerenciar IAs
│   ├── webhooks.ts         # Envio para n8n
│   ├── database-setup.sql  # Script de criação
│   └── dados-exemplo.sql   # Dados de exemplo
│
├── types.ts                # Tipos TypeScript
├── package.json            # Dependências
├── netlify.toml            # Config Netlify
└── vite.config.ts          # Config Vite
```

---

## 🎨 Cores e Estilos

### Status:
- 🟡 **Pendente:** Amarelo (`yellow-400`)
- 🔵 **Em Análise:** Azul (`blue-400`)
- 🟢 **Resolvido:** Verde (`green-400`)

### Urgência:
- 🔴 **Crítica:** Vermelho
- 🟠 **Alta:** Laranja
- 🟡 **Média:** Amarelo
- 🔵 **Baixa:** Azul claro

---

## 💡 Dicas de Uso

### 🔧 Acesso Admin:
1. **Login:** AUTOMABO / Automabo.2026
2. **Painel Admin** abre automaticamente
3. **Funcionalidades:**
   - Ver estatísticas de todas as empresas
   - Filtrar tickets por data
   - Cadastrar novas empresas
   - Cadastrar IAs para qualquer empresa
   - Monitorar atividade de cada cliente

### Cadastrar Nova Empresa (Admin):
1. Login como admin
2. Clique **"➕ Nova Empresa"**
3. Digite nome da empresa
4. Senha padrão já vem preenchida
5. Salve
6. Cliente já pode fazer login!

### Cadastrar IA para Empresa (Admin):
1. Login como admin
2. Clique **"🤖 Nova IA"**
3. Selecione a empresa no dropdown
4. Digite nome da IA
5. Salve
6. IA já aparece para a empresa!

### Buscar Ticket por Número:
1. **Clique no ícone 🔍** no header (ao lado do sino)
2. **Campo expande** com animação elegante
3. **Digite o número** do ticket (ex: 1, 42, 123)
4. **Pressione Enter** ou clique no ícone de busca
5. **Ticket encontrado** → Abre automaticamente
6. **Clique 🔍 novamente** → Fecha e limpa

**Números dos tickets:**
- Sequenciais: #0001, #0002, #0003...
- Únicos por empresa
- Badge destacado em roxo
- Fácil de referenciar e comunicar

### Configurar Notificações:
1. **Clique no ícone 🔔** no header do Dashboard
   - 🔔 Cinza = Não configurado
   - 🔔 **Dourado + brilhando** = Configurado! ✨
   - Passe o mouse → texto "Notificações" aparece
2. **Ative/Desative** notificações com o toggle
3. **Preencha email** e **WhatsApp** (opcional)
4. **Salve** as configurações
5. Sininho fica **dourado** quando configurado!

**Campos salvos:**
- Email para notificações
- WhatsApp para notificações  
- Se as notificações estão ativas

### Upload de Imagens (3 formas):
1. **Clique** na área de upload (abre explorador)
2. **Arraste** na tela inteira (overlay azul) ou na área específica
3. **Ctrl+V** para colar imagens da área de transferência
- Múltiplas imagens de uma vez em qualquer método

### Gerenciar Status:
- Altere diretamente no Supabase (SQL Editor)
- Dashboard atualiza em tempo real
- Sem necessidade de F5

### Adicionar IAs:
```sql
INSERT INTO ias (empresa_id, nome) 
VALUES ('ID_DA_EMPRESA', 'Nome da IA');
```

### Adicionar Empresa:
```sql
INSERT INTO empresas (nome_empresa, senha) 
VALUES ('Nome da Empresa', 'Suporteautomabo');
```

---

## 🔍 Troubleshooting

### F5 desloga:
- ✅ **CORRIGIDO!** Agora persiste com localStorage

### Webhook não envia dados:
- Abra console (F12) e veja os logs detalhados
- Todos os campos devem aparecer
- Se n8n não recebe, problema está na configuração do workflow

### Delete trava:
- ✅ **CORRIGIDO!** Agora com logs e tratamento de erro
- Veja console (F12) para detalhes

### IAs não aparecem:
- Verifique se a empresa tem IAs cadastradas
- Execute: `SELECT * FROM ias WHERE empresa_id = 'ID'`

---

## 📦 Build para Produção

```bash
# Build
npm run build

# Preview local
npm run preview

# A pasta dist/ estará pronta para deploy
```

---

## 🔧 Painel Administrativo

### Acesso:
- **Login:** AUTOMABO
- **Senha:** Automabo.2026

### Recursos:

#### 📊 Estatísticas Gerais (6 Cards):
```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│   4    │ │   42   │ │   12   │ │   8    │ │   22   │ │   5    │
│Empresas│ │ Total  │ │Penden. │ │ Anális.│ │ Resolv.│ │  Hoje  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
```

#### 📅 Filtro de Data:
- Selecione data início e/ou fim
- Estatísticas filtram automaticamente
- Veja tickets de períodos específicos

#### 🏢 Lista de Empresas:
Tabela completa com:
- Nome da empresa
- Email e WhatsApp cadastrados
- Total de tickets
- Tickets por status (Pendentes, Em Análise, Resolvidos)
- Data do último login

#### ➕ Cadastrar Nova Empresa:
1. Clique "➕ Nova Empresa"
2. Preencha nome
3. Senha padrão: "Suporteautomabo"
4. Salve
5. Cliente já pode fazer login!

#### 🤖 Cadastrar Nova IA:
1. Clique "🤖 Nova IA"
2. Selecione empresa (dropdown)
3. Digite nome da IA
4. Salve
5. IA disponível para a empresa!

#### 📈 Monitoramento:
- Ver quais empresas têm mais tickets
- Identificar picos de demanda
- Acompanhar último acesso
- Verificar notificações configuradas

---

## 🔒 Segurança

### Boas Práticas Implementadas:
- ✅ Variáveis de ambiente para credenciais
- ✅ RLS habilitado no Supabase
- ✅ Senha não salva no localStorage
- ✅ Headers de segurança (netlify.toml)
- ✅ Validações no frontend e backend

### localStorage:
O sistema usa localStorage apenas para:
- ID da empresa
- Nome da empresa
- Estado de autenticação
- View atual

**Senha NUNCA é armazenada no navegador!**

---

## 📞 Informações Importantes

### Credenciais:
```
# Configure suas credenciais no arquivo .env
# Veja .env.example para o template
```

### Webhook n8n:
```
https://n8n-cbnet.automabo.com.br/webhook/Tickets
```

### Link do Footer:
```
https://automabo.com.br
```

---

## 🎓 Scripts SQL Úteis

### Ver estatísticas:
```sql
SELECT 
  status,
  COUNT(*) as total
FROM tickets
GROUP BY status;
```

### Ver tickets por empresa:
```sql
SELECT 
  t.titulo,
  t.nome_cliente,
  t.status,
  t.ai_name
FROM tickets t
WHERE t.empresa_id = 'ID_DA_EMPRESA'
ORDER BY t.criado_em DESC;
```

### Ver últimos tickets:
```sql
SELECT 
  titulo,
  nome_cliente,
  status,
  criado_em
FROM tickets
ORDER BY criado_em DESC
LIMIT 10;
```

### Ver empresas com notificações configuradas:
```sql
SELECT 
  nome_empresa,
  email_notificacao,
  whatsapp_notificacao,
  notificacoes_ativas
FROM empresas
WHERE notificacoes_ativas = true
  AND (email_notificacao IS NOT NULL OR whatsapp_notificacao IS NOT NULL);
```

### Buscar dados para disparar notificação:
```sql
-- Exemplo: Pegar empresas que devem ser notificadas sobre um ticket
SELECT 
  e.nome_empresa,
  e.email_notificacao,
  e.whatsapp_notificacao,
  t.titulo,
  t.status
FROM tickets t
JOIN empresas e ON t.empresa_id = e.id
WHERE e.notificacoes_ativas = true
  AND t.status = 'Pending'
  AND (e.email_notificacao IS NOT NULL OR e.whatsapp_notificacao IS NOT NULL);
```

---

## ✅ Checklist Pré-Deploy

- [x] Código completo e testado
- [x] Banco de dados configurado
- [x] Variáveis de ambiente documentadas
- [x] Build funciona (`npm run build`)
- [x] localStorage implementado
- [x] Logout funcionando
- [x] Footer adicionado
- [x] Webhooks testados
- [x] Tempo real funcionando
- [x] netlify.toml configurado
- [x] Sem erros de lint

---

## 🎉 Status do Projeto

**Implementação:** ✅ 100% Completa  
**Banco de Dados:** ✅ Configurado via MCP  
**Funcionalidades:** ✅ 14 funcionando  
**Documentação:** ✅ Completa  
**Testes:** ✅ Prontos  
**Deploy:** ✅ Pronto para Netlify  

---

## 📄 Arquivo de Credenciais

**Importante:** As credenciais completas estão em:
- **[CREDENCIAIS-SUPABASE.txt](CREDENCIAIS-SUPABASE.txt)**

---

## 🚀 Próximos Passos

1. **Teste local:** `npm install && npm run dev`
2. **Verifique funcionalidades:** Login, Criar ticket, Delete, etc.
3. **Deploy no Netlify:** Siga o arquivo `netlify.toml`
4. **Configure env vars** no painel do Netlify
5. **Teste em produção!**

---

**Desenvolvido por:** Automabo  
**Versão:** 1.4.0  
**Data:** Outubro 2025  
**Status:** ✅ Pronto para Produção

**powered by [Automabo](https://automabo.com.br)** 🚀
# AutoTickets-v1.3
