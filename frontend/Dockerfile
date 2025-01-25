# Estágio base para dependências
FROM node:20.12.1 AS base

WORKDIR /app

# Copia os arquivos de definição de dependências e instala as dependências
COPY package*.json ./
RUN npm ci

# Estágio de desenvolvimento
FROM base AS development
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true
COPY . .
CMD ["npm", "start"]

# Estágio de build
FROM base AS build
ENV NODE_ENV=production
COPY . .
RUN npm ci --only=production && npm run build

# Estágio de produção com NGINX
FROM nginx:alpine AS production

# Copia a configuração do NGINX
COPY nginx/nginx.prod.conf /etc/nginx/nginx.conf

# Copia a aplicação construída do estágio de build
COPY --from=build /app/build /usr/share/nginx/html

# Inicia o NGINX
CMD ["nginx", "-g", "daemon off;"]