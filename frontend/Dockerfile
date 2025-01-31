FROM node:20.12.1 

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "start"]