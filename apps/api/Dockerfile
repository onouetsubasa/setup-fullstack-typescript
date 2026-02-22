# ---- deps ----
FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

# ---- builder ----
FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

RUN pnpm --filter api build

# ---- runner (production) ----
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono

COPY --from=builder --chown=hono:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=hono:nodejs /app/apps/api/node_modules ./node_modules

USER hono
EXPOSE 8080

CMD ["node", "dist/index.js"]

# ---- development ----
FROM node:22-alpine AS development
RUN corepack enable
WORKDIR /app

ENV NODE_ENV=development

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

EXPOSE 8080
CMD ["pnpm", "--filter", "api", "dev"]
