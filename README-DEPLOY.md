# 🚀 Instalação Rápida (Para Leigos)

Você acabou de acessar sua tela preta (terminal do servidor)?
Ótimo! Siga estritamente os passos abaixo. É só copiar e colar.

---

---

### Passo 0: Preparação (Opcional - Recomendado para Múltiplos Apps)
Se você vai rodar **VÁRIOS sites** neste servidor (não apenas o AutoTickets), recomendamos preparar o terreno instalando o Docker e o **Portainer** primeiro.
Isso cria um painel visual para você gerenciar tudo.

```bash
# Baixar o projeto (se ainda não baixou)
git clone https://github.com/Zekabr2023/AutoTickets-v1.3.git AutoTickets-v2.0
cd AutoTickets-v2.0

# Instalar Base (Docker + Portainer)
chmod +x script_instalation/setup_server_base.sh
sed -i 's/\r$//' script_instalation/setup_server_base.sh
sudo ./script_instalation/setup_server_base.sh
```
*Acesse o Portainer em `https://SEU-IP:9443` para conferir se está tudo OK.*

---

### Passo 1: Instalação do AutoTickets
Selecione todo o bloco de código abaixo, copie e cole no seu terminal.
Ele vai baixar o projeto e preparar tudo.

```bash
```bash
# 1. Instalar git (se ainda não fez)
sudo apt update && sudo apt install git -y

# 2. Baixar o projeto (se pulou o Passo 0)
git clone https://github.com/Zekabr2023/AutoTickets-v1.3.git AutoTickets-v2.0
cd AutoTickets-v2.0

# 3. Iniciar Instalação
chmod +x script_instalation/setup.sh
sed -i 's/\r$//' script_instalation/setup.sh
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

4.  **Credenciais do Supabase e IA**:
    *   *Prepare-se:* Você vai precisar de 4 chaves:
        1.  `supaURL` (URL do projeto)
        2.  `anonKey` (Chave pública)
        3.  `serviceRoleKey` (Chave secreta backend - **NOVA**)
        4.  `geminiApiKey` (Chave da IA do Google - **NOVA**)
    *   *O que digitar:* O instalador vai pedir uma por uma. Copie e cole.

---

### Passo 3: Banco de Dados

Depois que o site estiver no ar, precisamos configurar as tabelas e a segurança.
1. Acesse seu painel no [Supabase.com](https://supabase.com).
2. Vá em **SQL Editor** > **+ New Query**.
3. Copie o conteúdo de `server/rpc/setup_full_database.sql` deste projeto.
4. Cole e clique em **Run**.

Isso vai criar as tabelas (`empresas`, `tickets`, `ias`) e configurar a segurança (RPCs).

---

### 🎉 Pronto!
Seu sistema deve estar acessível em `https://seu-dominio.com.br`.

---

### Manutenção Futura
Se você atualizar o código e quiser subir a atualização para o servidor:

```bash
cd AutoTickets-v2.0
git pull
sudo ./script_instalation/setup.sh
```
*(Pode rodar o instalador novamente que ele atualiza tudo)*
