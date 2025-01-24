# Base stage for dependencies
FROM node:20.12.1 AS base

WORKDIR /app

# Copy package definitions and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Development stage
FROM base AS development
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true
CMD ["npm", "start"]

# Build stage
FROM base AS build
ENV NODE_ENV=production
RUN npm ci --only=production && npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Ensure correct path for nginx.prod.conf
WORKDIR /app
COPY ../../nginx/nginx.prod.conf /etc/nginx/nginx.conf

# Copy built application from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
