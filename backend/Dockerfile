# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy manifests first (context is ./backend now)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the backend
COPY . .

# Make sure uploads exists (volume will mount over it)
RUN mkdir -p /app/uploads

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "src/server.js"]
