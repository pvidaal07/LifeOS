# ============================================
# Build stage
# ============================================
FROM node:20-alpine AS builder

ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================
# Production stage - serve with nginx
# ============================================
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing: redirigir todas las rutas a index.html
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
