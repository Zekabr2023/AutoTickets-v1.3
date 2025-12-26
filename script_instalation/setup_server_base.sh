#!/bin/bash
# Script de Preparação Base do Servidor (Infraestrutura Completa)
# Instala Docker, Traefik (Proxy) e Portainer (Gerenciador)
# Configura SSL automático e Domínio para o Portainer

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}    INFRAESTRUTURA COMPLETA - SERVER MANAGER  ${NC}"
echo -e "${BLUE}==============================================${NC}"

# 1. Verificar Root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Por favor, execute como root (sudo ./setup_server_base.sh)${NC}"
  exit 1
fi

# 2. Instalar Dependências
echo -e "\n${GREEN}[1/5] Instalando Dependências...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
else
    echo "Docker já instalado."
fi

if ! command -v htpasswd &> /dev/null; then
  echo "Instalando utilitários de senha..."
  apt-get update -quiet && apt-get install apache2-utils -y -quiet
fi

# 3. Configuração Interativa
echo -e "\n${GREEN}[2/5] Configuração da Infraestrutura${NC}"

read -p "Email para Certificados SSL (LetsEncrypt): " SSL_EMAIL
if [ -z "$SSL_EMAIL" ]; then echo -e "${RED}Email obrigatório!${NC}"; exit 1; fi

read -p "Domínio para o Portainer (ex: painel.seudominio.com): " PORTAINER_DOMAIN
if [ -z "$PORTAINER_DOMAIN" ]; then echo -e "${RED}Domínio obrigatório!${NC}"; exit 1; fi

read -s -p "Senha Admin do Portainer: " PORTAINER_PASSWORD
echo ""
if [ -z "$PORTAINER_PASSWORD" ]; then echo -e "${RED}Senha obrigatória!${NC}"; exit 1; fi

# Gerar Hash da Senha (Bcrypt)
# Portainer espera formato: $2y$05$SeuHash...
# htpasswd gera apr1 ou md5 por padrão, precisamos forçar bcrypt (-B) e custo (-C) se possível,
# mas htpasswd padrão do apache2-utils gera $2y$... com -B.
HASHED_PASSWORD=$(htpasswd -nbB admin "$PORTAINER_PASSWORD" | cut -d ":" -f 2)

echo -e "Senha processada."

# 4. Criar Rede Compartilhada
echo -e "\n${GREEN}[3/5] Criando Rede 'proxy'...${NC}"
docker network create proxy 2>/dev/null || echo "Rede 'proxy' já existe."

# 5. Gerar Docker Compose de Infraestrutura
echo -e "\n${GREEN}[4/5] Gerando docker-compose.infra.yml...${NC}"

cat > docker-compose.infra.yml <<EOF
services:
  # Traefik (Proxy Reverso Global)
  traefik:
    image: traefik:v3.0
    command:
      - "--api.insecure=false"
      - "--api.dashboard=false"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.tlschallenge=true"
      - "--certificatesresolvers.myresolver.acme.email=$SSL_EMAIL"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
      # Redirecionamento HTTP -> HTTPS
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "./letsencrypt:/letsencrypt"
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
    networks:
      - proxy
    restart: always

  # Portainer (Gerenciador)
  portainer:
    image: portainer/portainer-ce:latest
    command: --admin-password='$HASHED_PASSWORD'
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "portainer_data:/data"
    networks:
      - proxy
    restart: always
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.portainer.rule=Host(\`$PORTAINER_DOMAIN\`)"
      - "traefik.http.routers.portainer.entrypoints=websecure"
      - "traefik.http.routers.portainer.tls.certresolver=myresolver"
      - "traefik.http.services.portainer.loadbalancer.server.port=9000"

volumes:
  portainer_data:

networks:
  proxy:
    external: true
EOF

# 6. Deploy
echo -e "\n${GREEN}[5/5] Iniciando Infraestrutura...${NC}"
docker compose -f docker-compose.infra.yml up -d

if [ $? -eq 0 ]; then
    echo -e "\n${BLUE}==============================================${NC}"
    echo -e "${GREEN}SUCESSO! Infraestrutura Operacional.${NC}"
    echo -e "Portainer acessível em: https://$PORTAINER_DOMAIN"
    echo -e "Usuário: admin"
    echo -e "Senha: (a que você digitou)"
    echo -e "${BLUE}==============================================${NC}"
else
    echo -e "\n${RED}Falha ao iniciar infraestrutura.${NC}"
fi
