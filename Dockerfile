# ┌─────────────────────────────────────────────────────────────────────┐
# │   STAGE 1: Build the Vite app                                     │
# └─────────────────────────────────────────────────────────────────────┘
FROM node:18-alpine AS builder
WORKDIR /app

# 1. Copy only package.json & package-lock.json initially to cache deps
COPY package.json package-lock.json ./

# 2. Install dependencies
RUN npm ci

# 3. Copy the rest of the source (including vite.config.js & index.html)
COPY . .

# 4. Build the production bundle
RUN npm run build


# ┌─────────────────────────────────────────────────────────────────────┐
# │   STAGE 2: Serve via NGINX under /bakalarka                       │
# └─────────────────────────────────────────────────────────────────────┘
FROM nginx:alpine
# Remove the default nginx site config
RUN rm /etc/nginx/conf.d/default.conf

# Copy a custom NGINX config that serves everything under /bakalarka
COPY nginx-bakalarka.conf /etc/nginx/conf.d/bakalarka.conf

# Copy built files from the "builder" stage
# They were output to /app/dist
COPY --from=builder /app/dist /usr/share/nginx/html/bakalarka

# Expose port 80
EXPOSE 80

# By default, the nginx image will run and pick up our bakalarak.conf
CMD ["nginx", "-g", "daemon off;"]
