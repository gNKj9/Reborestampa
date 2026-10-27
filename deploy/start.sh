#!/bin/sh
# Arranque no PaaS: migrações, seed idempotente e só depois a API.
set -e

echo "[start] A aplicar migrações..."
./node_modules/.bin/prisma migrate deploy

echo "[start] A garantir o administrador (seed idempotente)..."
./node_modules/.bin/tsx prisma/seed.ts || echo "[start] seed ignorado (ver mensagem acima)"

echo "[start] A arrancar a API + site..."
exec node dist/server.js
