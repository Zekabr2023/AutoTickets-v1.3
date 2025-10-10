# 🚀 Guia Rápido de Deploy - Copie e Cole

## ⚡ Deploy em 5 Minutos

### 1️⃣ Preparar Git (copie e cole tudo de uma vez)

```bash
git init
git add .
git commit -m "Deploy inicial - Sistema de Tickets Automabo"
```

### 2️⃣ Criar repositório no GitHub

1. Acesse: https://github.com/new
2. Nome: `tickets-automabo` (ou outro nome)
3. **NÃO** marque "Add README" ou ".gitignore"
4. Clique em "Create repository"

### 3️⃣ Enviar para o GitHub

**Copie os comandos que aparecem no GitHub após criar o repositório, algo como:**

```bash
git remote add origin https://github.com/SEU-USUARIO/tickets-automabo.git
git branch -M main
git push -u origin main
```

### 4️⃣ Deploy no Netlify

1. Acesse: https://app.netlify.com
2. Clique em **"Add new site"** → **"Import an existing project"**
3. Escolha **GitHub**
4. Selecione o repositório `tickets-automabo`
5. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Clique em **"Show advanced"**

### 5️⃣ Adicionar Variáveis de Ambiente

Clique em **"Add environment variables"** e adicione estas 3 variáveis:

**Copie do seu arquivo `.env` local e cole no Netlify:**

| Key | Value (do seu .env) |
|-----|---------------------|
| `VITE_SUPABASE_URL` | Sua URL do Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sua chave anônima |
| `VITE_N8N_WEBHOOK_URL` | Sua URL do webhook |

### 6️⃣ Finalizar

1. Clique em **"Deploy site"**
2. ⏳ Aguarde 2-3 minutos
3. ✅ **Pronto! Site no ar!**

---

## 🔍 Verificar se deu certo

1. Clique na URL do Netlify (algo como: `https://seu-site.netlify.app`)
2. Página deve carregar sem tela branca
3. Faça login: `CBNET` / `Suporteautomabo`
4. ✅ Se entrou no dashboard, está funcionando!

---

## ⚠️ Se der erro de tela branca

1. Vá no Netlify: **Site settings** → **Environment variables**
2. Verifique se as 3 variáveis estão lá
3. Se não estiverem, adicione agora
4. Vá em **Deploys** → **Trigger deploy** → **Deploy site**

---

## 🔄 Atualizar o site depois

Sempre que fizer mudanças:

```bash
git add .
git commit -m "Descrição da mudança"
git push
```

**O Netlify faz deploy automático! 🎉**

---

## 📱 Domínio Personalizado (Opcional)

Se quiser usar `tickets.automabo.com.br`:

1. No Netlify: **Domain management** → **Add custom domain**
2. Digite: `tickets.automabo.com.br`
3. Configure DNS conforme instruções
4. ✅ Pronto!

---

## ✅ Checklist Rápido

Antes de iniciar, certifique-se:

- [ ] ✅ Arquivo `.env` existe e tem as 3 variáveis
- [ ] ✅ `npm run build` funciona sem erros
- [ ] ✅ Tem conta no GitHub
- [ ] ✅ Tem conta no Netlify (pode criar grátis)

---

**Dúvidas?** Veja o arquivo `SEGURANCA-E-DEPLOY.md` para detalhes completos.

