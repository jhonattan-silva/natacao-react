# Base stage for dependencies
FROM node:20.12.1 AS base

WORKDIR /app

# Copy package definitions and install dependencies
COPY package*.json ./
RUN npm ci

# Development stage
FROM base AS development
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true
COPY . .
CMD ["npm", "start"]

# Build stage
FROM base AS build
ENV NODE_ENV=production
COPY . .
RUN npm ci --only=production && npm run build

# Production stage with NGINX
FROM nginx:alpine AS production

# Copy nginx configuration
COPY nginx/nginx.prod.conf /etc/nginx/nginx.conf

# Copy built application from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]