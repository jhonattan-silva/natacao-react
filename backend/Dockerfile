# Use a imagem base oficial do Node.js
FROM node:20.12.1

# Diretório de trabalho
WORKDIR /app

# Copie os arquivos de dependência e instale
COPY package*.json ./
RUN npm install

# Copie o restante do código
COPY . .

# Exponha a porta 5000
EXPOSE 5000

# Comando para iniciar o servidor
CMD ["npm", "start"]
