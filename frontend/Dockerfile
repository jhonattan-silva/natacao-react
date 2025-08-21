# Estágio 1: Construir o aplicativo React
FROM node:20.12.1-alpine AS build

WORKDIR /app

# Copia os manifestos de dependência
COPY package*.json ./

# Instala as dependências
RUN npm ci

# Copia o código-fonte
COPY . .

# COPIA O ARQUIVO .ENV PARA DENTRO DO CONTEXTO DE BUILD
# Esta é a linha crucial que estava faltando.
COPY .env ./

# Agora, o build usará a REACT_APP_API_URL do arquivo .env do servidor
RUN npm run build

# Estágio 2: Criar uma imagem final leve
FROM alpine:latest

# Copia a pasta 'build' do estágio anterior para a imagem final
COPY --from=build /app/build /app/build
