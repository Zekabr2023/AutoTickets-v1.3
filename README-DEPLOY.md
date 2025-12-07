# 🚀 Instalação Rápida (Para Leigos)

Você acabou de acessar sua tela preta (terminal do servidor)?
Ótimo! Siga estritamente os passos abaixo. É só copiar e colar.

---

### Passo 1: Copie e Cole o comando abaixo
Selecione todo o bloco de código abaixo, copie e cole no seu terminal.
Ele vai baixar o projeto e preparar tudo.

```bash
# 1. Instalar git se não tiver
sudo apt update && sudo apt install git -y

# 2. Baixar o projeto
git clone https://github.com/Zekabr2023/AutoTickets-v1.3.git
cd AutoTickets-v1.3

# 3. Preparar o instalador
chmod +x script_instalation/setup.sh
sed -i 's/\r$//' script_instalation/setup.sh

# 4. Iniciar Instalação
sudo ./script_instalation/setup.sh
```

---

### Passo 2: Responda as Perguntas

O instalador vai te fazer algumas perguntas na tela. Aqui está o que responder:

1.  **Digite seu Domínio**:
    *   *O que digitar:* O endereço do seu site (ex: `suport.suaempresa.com.br`).
    *   ⚠️ **Atenção:** Certifique-se de que você já criou o apontamento "Tipo A" no seu registro de domínio (Godaddy, Registro.br, Cloudflare) apontando para o IP desse servidor.

2.  **Selecione o Modo de Instalação**:
    *   *O que digitar:* Digite `1` e dê Enter (Modo Independente).
    *   *Nota:* Só digite `2` se você for um usuário avançado com Portainer já instalado.

3.  **Digite seu Email para o SSL**:
    *   *O que digitar:* Seu email pessoal (para o certificado de segurança HTTPS).

4.  **Credenciais do Supabase e WhatsApp**:
    *   *O que digitar:* Copie e cole as chaves que você tem no seu arquivo `CREDENCIAIS-SUPABASE.txt` ou no painel do Supabase/Facebook.
    *   *Dica:* Para colar no terminal, geralmente é clicar com botão direito do mouse.

---

### Passo 3: Banco de Dados

Depois que o site estiver no ar, falta só uma coisinha no banco de dados.
1. Acesse seu painel no [Supabase.com](https://supabase.com).
2. Vá em **SQL Editor**.
3. Cole e execute este comando:

```sql
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS solicitante_nome TEXT;
```

---

### 🎉 Pronto!
Seu sistema deve estar acessível em `https://seu-dominio.com.br`.

---

### Manutenção Futura
Se você atualizar o código e quiser subir a atualização para o servidor:

```bash
cd AutoTickets-v1.3
git pull
sudo ./script_instalation/setup.sh
```
*(Pode rodar o instalador novamente que ele atualiza tudo)*
