# Imagem única para PaaS (Render): o Express serve a API e o site estático.
# O Next é compilado em modo `export` e o resultado é copiado para /app/web.
#
# Build a partir da raiz do repositório:
#   docker build -f deploy/Dockerfile -t reborestampa .

# ---------- frontend estático ----------
FROM node:22-bookworm-slim AS web
WORKDIR /web

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend ./

# "/api" relativo: o browser chama o mesmo host onde o site está servido.
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_STATIC_EXPORT=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ---------- backend ----------
FROM node:22-bookworm-slim AS api
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci

COPY backend/prisma ./prisma
COPY backend/prisma.config.ts backend/tsconfig.json ./
# `prisma generate` não abre ligação, mas a config exige a variável definida.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
RUN npx prisma generate

COPY backend/src ./src
RUN npm run build

# ---------- runtime ----------
# Mantém as devDependencies: prisma CLI e tsx são usados no arranque
# (migrações e seed idempotente). Custo: imagem maior, sem custo de RAM.
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV SERVE_STATIC=true
ENV STATIC_DIR=/app/web

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs app

COPY --from=api --chown=app:nodejs /app/node_modules ./node_modules
COPY --from=api --chown=app:nodejs /app/dist ./dist
COPY --from=api --chown=app:nodejs /app/prisma ./prisma
COPY --from=api --chown=app:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=api --chown=app:nodejs /app/package.json ./package.json
COPY --from=web --chown=app:nodejs /web/out ./web
COPY --chown=app:nodejs deploy/start.sh ./start.sh

USER app
EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||10000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "./start.sh"]
