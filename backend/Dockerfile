# Dockerfile do Backend

# Estágio base
FROM node:20.12.1 AS base

WORKDIR /app

# Copia os arquivos de dependências e instala
COPY package*.json ./
RUN npm ci

# Copia o script wait-for.sh e dá permissão de execução
COPY wait-for.sh /app/wait-for.sh
RUN chmod +x /app/wait-for.sh

# Copia o restante do código
COPY . .

# Expõe a porta 5000 (usada pelo backend)
EXPOSE 5000

# Comando padrão (pode ser sobrescrito no docker-compose.yml)
CMD ["npm", "start"]