# Estágio 1: Construir o aplicativo React
FROM node:20.12.1-alpine AS build

WORKDIR /app

# 1. Declare o argumento que virá do docker-compose
ARG REACT_APP_API_URL

# 2. Defina-o como uma variável de ambiente para o restante do build
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# O resto do processo continua o mesmo
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Estágio 2: Imagem final
FROM alpine:latest
COPY --from=build /app/build /app/build
RUN npm run build

# Estágio 2: Criar uma imagem final leve
FROM alpine:latest

# Copia a pasta 'build' do estágio anterior para a imagem final
COPY --from=build /app/build /app/build
