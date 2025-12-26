#!/bin/bash
# Script de Preparação Base do Servidor
# Instala Docker, Rede Compartilhada e Portainer CE

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}    INFRAESTRUTURA BASE - SERVER MANAGER      ${NC}"
echo -e "${BLUE}==============================================${NC}"

# 1. Verificar Root
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, execute como root (sudo ./setup_server_base.sh)"
  exit 1
fi

# 2. Instalar Docker
echo -e "\n${GREEN}[1/3] Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    echo "Docker instalado com sucesso."
else
    echo "Docker já instalado."
fi

# 3. Criar Rede Compartilhada
echo -e "\n${GREEN}[2/3] Criando Rede 'proxy'...${NC}"
docker network create proxy 2>/dev/null || echo "Rede 'proxy' já existe."

# 4. Instalar Portainer
echo -e "\n${GREEN}[3/3] Instalando Portainer CE...${NC}"

# Verifica se já existe
if [ $(docker ps -a -q -f name=portainer) ]; then
    echo "Portainer já está rodando."
else
    docker volume create portainer_data
    docker run -d -p 8000:8000 -p 9443:9443 -p 9000:9000 \
        --name portainer \
        --restart=always \
        --network proxy \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v portainer_data:/data \
        portainer/portainer-ce:latest
    
    echo -e "${GREEN}Portainer Iniciado!${NC}"
    echo "Acesse: https://SEU-IP:9443"
fi

echo -e "\n${BLUE}==============================================${NC}"
echo -e "${GREEN}Concluído!${NC}"
echo "Agora seu servidor está pronto para receber múltiplas aplicações."
echo -e "${BLUE}==============================================${NC}"
