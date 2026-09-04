# syntax=docker/dockerfile:1

# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime

RUN addgroup -g 1001 -S nodejs \
    && adduser -u 1001 -S svelte -G nodejs

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder --chown=svelte:nodejs /app/build ./build
COPY --chown=svelte:nodejs package.json package-lock.json ./
# Instala só as dependências de runtime. Hoje não há nenhuma (o adapter-node
# empacota o app), mas o template existe para receber as do consumidor.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev \
    && chown -R svelte:nodejs /app/node_modules 2>/dev/null || true

# O forge roda o pod com runAsUser: 1001 e readOnlyRootFilesystem: true.
USER 1001

EXPOSE 3000

# Coerente com o healthPath do forge.yaml.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "build"]
