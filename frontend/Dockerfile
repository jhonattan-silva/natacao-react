# Estágio base
FROM node:20.12.1 AS base

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Estágio de build
FROM base AS build
ENV NODE_ENV=production
COPY . .
RUN npm run build

# Estágio de produção com Nginx
FROM nginx:alpine AS production
COPY nginx/nginx.prod.conf /etc/nginx/nginx.conf
WORKDIR /usr/share/nginx/html
RUN rm -rf ./* # Limpa arquivos antigos para evitar conflitos
COPY --from=build /app/build .

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
