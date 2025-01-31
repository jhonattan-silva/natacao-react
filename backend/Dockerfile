# Estágio base
FROM node:20.12.1 AS base

WORKDIR /app

# Instala o netcat-openbsd para o script wait-for.sh
RUN apt-get update && apt-get install -y netcat-openbsd && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copia os arquivos de dependências e instala
COPY package*.json ./
RUN npm ci

# Copia o script wait-for.sh e dá permissão de execução
COPY wait-for.sh /app/
RUN chmod +x /app/wait-for.sh

# Copia o restante do código
COPY . .

# Expõe a porta 5000 (usada pelo backend)
EXPOSE 5000

# Comando de entrada
CMD ["sh", "-c", "./wait-for.sh db 3306 && npm start"]
