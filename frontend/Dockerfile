# Estágio 1: Construir o aplicativo React
FROM node:20.12.1-alpine AS build

WORKDIR /app

# Copia apenas os arquivos de manifesto para aproveitar o cache do Docker
COPY package*.json ./

# Instala as dependências de forma otimizada
RUN npm ci

# Copia o restante do código-fonte
COPY . .

# Executa o build de produção. Os arquivos serão gerados em /app/build
RUN npm run build

# Estágio 2: Criar uma imagem final leve
# Esta imagem não faz nada, apenas contém a pasta 'build' que será copiada.
FROM alpine:latest

# Copia a pasta 'build' do estágio anterior para a imagem final
COPY --from=build /app/build /app/build
