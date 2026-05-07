# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (including devDependencies for tsc)
COPY package*.json ./
RUN npm ci

# Generate Prisma client before building
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and compile TypeScript → JavaScript
COPY . .
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Only install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client for production
COPY prisma ./prisma
RUN npx prisma generate

# Copy compiled JS output from builder (dist folder)
COPY --from=builder /app/dist ./dist

# Don't run as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

CMD ["node", "dist/index.js"]