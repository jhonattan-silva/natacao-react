# Estágio base
FROM node:20.12.1 AS base

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Estágio de build (produção)
FROM node:20.12.1 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Estágio final: Produção com NGINX
FROM nginx:alpine AS production
COPY nginx/nginx.prod.conf /etc/nginx/nginx.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]