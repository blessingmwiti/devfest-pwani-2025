# Multi-stage build for AI DevOps Assistant Backend
FROM node:24-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:24-slim

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8080

# Set environment variable for port (Cloud Run uses PORT=8080)
ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/index.js"]

