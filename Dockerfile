# Production Dockerfile for City Rush 3D on Google Cloud Run
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install dependencies
COPY package.json ./
RUN npm install

# Copy application source code
COPY . .

# Build client bundle (Vite) and production server (esbuild)
RUN npm run build

# Expose target port for Cloud Run
EXPOSE 3000

# Start production server
CMD ["node", "server.js"]
