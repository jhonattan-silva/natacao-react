# Usando a imagem oficial do Nginx como base
FROM nginx:alpine

# Copiar os arquivos de build do React para o diretório de documentos do Nginx
COPY --from=lpn2025-frontend /app/build /usr/share/nginx/html

# Copiar o arquivo de configuração do Nginx
COPY ./nginx/nginx.prod.conf /etc/nginx/nginx.conf
