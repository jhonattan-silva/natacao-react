# Etapa base para build
FROM node:22 AS base

WORKDIR /app

# Instale apenas as dependências do projeto
COPY package*.json ./
RUN npm install

# Copie o código para o container
COPY . .

# Etapa para desenvolvimento
FROM base AS development
ENV NODE_ENV=development
ARG ENV_FILE=.env
COPY ${ENV_FILE} /app/.env
CMD ["npm", "start"]
