# Estágio base para dependências
FROM node:20.12.1 AS base

WORKDIR /app

# Copia os arquivos de dependências e instala
COPY package*.json ./
RUN npm ci

# Estágio de build (produção)
FROM base AS build
ENV NODE_ENV=production
COPY . .  
RUN npm run build

# Estágio final: Produção com NGINX
FROM node:20.12.1 AS production

# Copia a configuração personalizada do NGINX
COPY nginx/nginx.prod.conf /etc/nginx/nginx.conf

# Instala o NGINX
RUN apt-get update && apt-get install -y nginx

# Copia os arquivos do build para o NGINX
COPY --from=build /app/build /usr/share/nginx/html

# Expor a porta padrão
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]