# ==============================================================================
# CampusGate - Production Frontend Dockerfile (Multi-Stage Build)
# ==============================================================================

# Stage 1: Compile React / Vite Application
FROM node:20-alpine AS builder

WORKDIR /app

# Cache package dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and compile static bundles
COPY . .
RUN npm run build

# Stage 2: Serve via High-Performance Nginx Web Server
FROM nginx:alpine

# Remove default nginx boilerplate website
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled frontend distribution and custom reverse proxy config
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check to ensure Nginx is serving traffic
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
