# Usar a imagem oficial do Nginx
FROM nginx:stable-alpine

# Remover a configuração padrão para evitar conflitos
RUN rm /etc/nginx/conf.d/default.conf

# Copiar o arquivo de configuração do seu site para o local CORRETO
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf
