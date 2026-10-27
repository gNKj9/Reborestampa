# ---- build ----
FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
# `prisma generate` não abre ligação, mas a config exige a variável definida.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
RUN npx prisma generate

COPY src ./src
RUN npm run build

# ---- dependências de produção ----
# Stage separado para NÃO podar o `build`: o serviço `migrate` do compose
# constrói até `build` e precisa do prisma CLI e do tsx (devDependencies).
FROM build AS prod-deps
RUN npm prune --omit=dev

# ---- runtime ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs api

COPY --from=prod-deps --chown=api:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=api:nodejs /app/dist ./dist
COPY --from=build --chown=api:nodejs /app/prisma ./prisma
COPY --from=build --chown=api:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=api:nodejs /app/package.json ./package.json

USER api
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
