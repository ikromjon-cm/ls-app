# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy frontend
COPY package*.json ./
RUN npm ci

COPY vite.config.js tailwind.config.js postcss.config.js index.html ./
COPY src/ src/
RUN npm run build

# Build stage: server
FROM node:22-alpine AS server-builder

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/tsconfig.json ./
COPY server/prisma/ prisma/
COPY server/src/ src/
RUN npx prisma generate && npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache curl openssl

# Copy server
COPY --from=server-builder /app/server/dist/ dist/
COPY --from=server-builder /app/server/node_modules/ node_modules/
COPY --from=server-builder /app/server/prisma/ prisma/
COPY --from=server-builder /app/server/package.json ./

# Copy frontend
COPY --from=builder /app/dist/ dist/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "dist/index.js"]
