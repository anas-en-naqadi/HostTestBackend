# syntax=docker/dockerfile:1

####################################
# 1) Builder stage
####################################
FROM node:18-alpine AS builder
WORKDIR /app

# 1.1 Install ALL deps (incl. dev for tsc & prisma)
COPY package*.json ./
RUN npm ci

# 1.2 Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# 1.3 Copy source & compile TS
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

####################################
# 2) Production stage
####################################
FROM node:18-alpine
ARG PORT=3001
ENV NODE_ENV=production \
    PORT=${PORT}

WORKDIR /app

# 2.1 Create non‐root user
RUN addgroup -S app && adduser -S app -G app

# 2.2 Install only prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# 2.3 Copy compiled code and Prisma schema (for migrations)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# 2.4 Fix permissions & switch user
RUN chown -R app:app /app
USER app

# 2.5 Expose & healthcheck
EXPOSE ${PORT}
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/health || exit 1

# 2.6 Run migrations, then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
