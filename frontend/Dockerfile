# frontend/Dockerfile — Multi-stage build for React app
#
# Stage 1 (builder): Install deps + run `npm run build` → generates dist/
# Stage 2 (nginx):   Copy dist/ into nginx → serve static files
#
# Why multi-stage?
#   Stage 1 image is ~800MB (Node + all node_modules)
#   Stage 2 image is ~25MB (nginx + only the built files)
#   Production container is 32x smaller — faster to deploy!

# ── Stage 1: Build ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the production bundle (outputs to /app/dist)
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────
FROM nginx:alpine

# Copy built files from Stage 1 into nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config: handle React Router (serve index.html for all routes)
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
