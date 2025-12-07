#!/bin/bash
# Instalador Universal para AutoTickets
# Compatível com Ubuntu 22.04/24.04
# Suporta ambientes Standalone e Portainer/Traefik
# Repositório: https://github.com/Zekabr2023/AutoTickets-v1.3.git

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ASCII Art Header
echo -e "${BLUE}"
cat << "EOF"
  /$$$$$$              /$$            /$$$$$$$$ /$$           /$$                   /$$             
 /$$__  $$            | $$           |__  $$__/|__/          | $$                  | $$             
| $$  \ $$ /$$   /$$ /$$$$$$    /$$$$$$ | $$    /$$  /$$$$$$$| $$   /$$  /$$$$$$  /$$$$$$   /$$$$$$$
| $$$$$$$$| $$  | $$|_  $$_/   /$$__  $$| $$   | $$ /$$_____/| $$  /$$/ /$$__  $$|_  $$_/  /$$_____/
| $$__  $$| $$  | $$  | $$    | $$  \ $$| $$   | $$| $$      | $$$$$$/ | $$$$$$$$  | $$   |  $$$$$$ 
| $$  | $$| $$  | $$  | $$ /$$| $$  | $$| $$   | $$| $$      | $$_  $$ | $$_____/  | $$ /$$\____  $$
| $$  | $$|  $$$$$$/  |  $$$$/|  $$$$$$/| $$   | $$|  $$$$$$$| $$ \  $$|  $$$$$$$  |  $$$$//$$$$$$$/
|__/  |__/ \______/    \___/   \______/ |__/   |__/ \_______/|__/  \__/ \_______/   \___/ |_______/ 
                                                                                                    
EOF

echo -e "${NC}"
echo -e "${BLUE}"
cat << "EOF"
         /$$$ /$$                        /$$$$$$              /$$                                       /$$                /$$$  
        /$$_/| $$                       /$$__  $$            | $$                                      | $$               |_  $$ 
       /$$/  | $$$$$$$  /$$   /$$      | $$  \ $$ /$$   /$$ /$$$$$$    /$$$$$$  /$$$$$$/$$$$   /$$$$$$ | $$$$$$$   /$$$$$$  \  $$
      | $$   | $$__  $$| $$  | $$      | $$$$$$$$| $$  | $$|_  $$_/   /$$__  $$| $$_  $$_  $$ |____  $$| $$__  $$ /$$__  $$  | $$
      | $$   | $$  \ $$| $$  | $$      | $$__  $$| $$  | $$  | $$    | $$  \ $$| $$ \ $$ \ $$  /$$$$$$$| $$  \ $$| $$  \ $$  | $$
      |  $$  | $$  | $$| $$  | $$      | $$  | $$| $$  | $$  | $$ /$$| $$  | $$| $$ | $$ | $$ /$$__  $$| $$  | $$| $$  | $$  /$$/
       \  $$$| $$$$$$$/|  $$$$$$$      | $$  | $$|  $$$$$$/  |  $$$$/|  $$$$$$/| $$ | $$ | $$|  $$$$$$$| $$$$$$$/|  $$$$$$//$$$/ 
        \___/|_______/  \____  $$      |__/  |__/ \______/    \___/   \______/ |__/ |__/ |__/ \_______/|_______/  \______/|___/  
                        /$$  | $$                                                                                                
                       |  $$$$$$/                                                                                                
                        \______/                                                                                                 
EOF
echo -e "${NC}"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}       AutoTickets - Assistente de Instalação   ${NC}"
echo -e "${BLUE}================================================${NC}"

# Garantir que estamos na raiz do projeto
cd "$(dirname "$0")/.." || {
    echo -e "${RED}Erro: Não foi possível mudar para o diretório raiz do projeto.${NC}"
    exit 1
}

# 1. Verificar Root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Por favor, execute como root (sudo ./script_instalation/setup.sh)${NC}"
  exit 1
fi

# 2. Verificar Docker
echo -e "\n${YELLOW}[1/4] Verificando Ambiente...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Docker não encontrado. Instalando..."
    curl -fsSL https://get.docker.com | sh
    echo "Docker instalado."
else
    echo -e "${GREEN}Docker já está instalado.${NC}"
fi

# 3. Configuração
echo -e "\n${YELLOW}[2/4] Configuração${NC}"

read -p "Digite seu Domínio (ex: tickets.automabo.com.br): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}O domínio é obrigatório.${NC}"
    exit 1
fi

echo -e "\nSelecione o Modo de Instalação:"
echo "1) Independente (Quero instalar Traefik + SSL automaticamente)"
echo "2) Integrado (Tenho Portainer/Traefik rodando em rede externa)"
read -p "Selecione [1 ou 2]: " DEPLOY_MODE

TRAEFIK_NETWORK="traefik_proxy" # Padrão para Independente
EXTERNAL_NETWORK_NAME=""

if [ "$DEPLOY_MODE" == "2" ]; then
    read -p "Digite o nome da sua rede Docker externa (padrão: proxy): " INPUT_NET
    EXTERNAL_NETWORK_NAME=${INPUT_NET:-proxy}
    TRAEFIK_NETWORK=$EXTERNAL_NETWORK_NAME
    echo -e "${GREEN}Usando rede existente: $EXTERNAL_NETWORK_NAME${NC}"
else
    # Modo Independente
    echo -e "${GREEN}Configurando Traefik para instalação independente.${NC}"
    read -p "Digite seu Email para o SSL (LetsEncrypt): " SSL_EMAIL
fi

# Credenciais
echo -e "\n--- Credenciais do Supabase ---"
read -p "URL do Supabase: " SUPABASE_URL
read -p "Chave Anon do Supabase: " SUPABASE_KEY
read -p "Chave Service Role do Supabase (opcional, para backend): " SUPABASE_SERVICE_KEY

echo -e "\n--- Configurações do WhatsApp (Meta) ---"
read -p "Phone Number ID: " PHONE_NUMBER_ID
read -p "Access Token: " ACCESS_TOKEN
read -p "Verify Token (Webhook): " VERIFY_TOKEN

# 4. Gerar .env
echo -e "\n${YELLOW}[3/4] Gerando arquivos de configuração...${NC}"

cat > .env <<EOF
# Gerado pelo setup.sh
DOMAIN=$DOMAIN
NODE_ENV=production

# Supabase
SUPABASE_URL=$SUPABASE_URL
SUPABASE_KEY=$SUPABASE_KEY
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY

# Variáveis do Frontend (Vite precisa destas no momento do build)
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_KEY
VITE_API_URL=https://$DOMAIN/api

# WhatsApp
PHONE_NUMBER_ID=$PHONE_NUMBER_ID
ACCESS_TOKEN=$ACCESS_TOKEN
VERIFY_TOKEN=$VERIFY_TOKEN

# Porta (Backend Interno)
PORT=3001
EOF

echo -e "${GREEN}Arquivo .env criado.${NC}"

# 5. Gerar docker-compose.prod.yml
echo "Gerando docker-compose.prod.yml..."

if [ "$DEPLOY_MODE" == "1" ]; then
    # TEMPLATE INDEPENDENTE
    cat > docker-compose.prod.yml <<EOF
services:
  # Proxy Reverso (Traefik)
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.tlschallenge=true"
      - "--certificatesresolvers.myresolver.acme.email=$SSL_EMAIL"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "./letsencrypt:/letsencrypt"
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
    networks:
      - ${TRAEFIK_NETWORK}

  # Backend (API Node)
  api:
    build:
      context: .
      dockerfile: Dockerfile.backend
    restart: always
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=\${SUPABASE_URL}
      - SUPABASE_KEY=\${SUPABASE_KEY}
      - SUPABASE_SERVICE_KEY=\${SUPABASE_SERVICE_KEY}
      - PHONE_NUMBER_ID=\${PHONE_NUMBER_ID}
      - ACCESS_TOKEN=\${ACCESS_TOKEN}
      - VERIFY_TOKEN=\${VERIFY_TOKEN}
      - PORT=3001
    networks:
      - ${TRAEFIK_NETWORK}

  # Frontend (Nginx)
  web:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        - VITE_SUPABASE_URL=\${SUPABASE_URL}
        - VITE_SUPABASE_ANON_KEY=\${SUPABASE_KEY}
        - VITE_API_URL=https://\${DOMAIN}/api
    restart: always
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(\`\${DOMAIN}\`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=myresolver"
    networks:
      - ${TRAEFIK_NETWORK}
    depends_on:
      - api

networks:
  ${TRAEFIK_NETWORK}:
    name: ${TRAEFIK_NETWORK}
EOF

else
    # TEMPLATE INTEGRADO (Portainer/Traefik Externo)
    cat > docker-compose.prod.yml <<EOF
services:
  # Backend (API Node)
  api:
    build:
      context: .
      dockerfile: Dockerfile.backend
    restart: always
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=\${SUPABASE_URL}
      - SUPABASE_KEY=\${SUPABASE_KEY}
      - SUPABASE_SERVICE_KEY=\${SUPABASE_SERVICE_KEY}
      - PHONE_NUMBER_ID=\${PHONE_NUMBER_ID}
      - ACCESS_TOKEN=\${ACCESS_TOKEN}
      - VERIFY_TOKEN=\${VERIFY_TOKEN}
      - PORT=3001
    networks:
      - ${EXTERNAL_NETWORK_NAME}
    labels:
        # Se for necessário roteamento específico para o backend, adicione aqui. 
        # Geralmente é tratado pelo proxy reverso junto com o frontend.
        - "traefik.enable=false"

  # Frontend (Nginx)
  web:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        - VITE_SUPABASE_URL=\${SUPABASE_URL}
        - VITE_SUPABASE_ANON_KEY=\${SUPABASE_KEY}
        - VITE_API_URL=https://\${DOMAIN}/api
    restart: always
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.autotickets.rule=Host(\`\${DOMAIN}\`)"
      - "traefik.http.routers.autotickets.entrypoints=websecure"
      - "traefik.http.routers.autotickets.tls.certresolver=myresolver"
      - "traefik.http.services.autotickets.loadbalancer.server.port=80"
      # Verifique os labels corretos se estiver usando Nginx Proxy Manager no Portainer
    networks:
      - ${EXTERNAL_NETWORK_NAME}
    depends_on:
      - api

networks:
  ${EXTERNAL_NETWORK_NAME}:
    external: true
EOF
fi

echo -e "${GREEN}docker-compose.prod.yml gerado!${NC}"

# 6. Implantação
echo -e "\n${YELLOW}[4/4] Implantando...${NC}"
echo "Construindo e iniciando containers..."

# Parar instâncias antigas se houver
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Iniciar novas
docker compose -f docker-compose.prod.yml up -d --build

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Sucesso! Aplicação implantada em: https://$DOMAIN${NC}"
    echo -e "NOTA: Certifique-se de que seu registro DNS A aponta para este IP."
else
    echo -e "\n${RED}Falha na implantação. Verifique os logs com 'docker compose -f docker-compose.prod.yml logs'${NC}"
fi
