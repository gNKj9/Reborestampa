#!/bin/sh
# Arranque no PaaS: migrações, seed idempotente e só depois a API.
set -e

echo "[start] A aplicar migrações..."
./node_modules/.bin/prisma migrate deploy

echo "[start] A garantir o administrador (seed idempotente)..."
node dist/scripts/seed.js \
  || echo "[start] ERRO: seed falhou — o administrador pode não existir (ver stack acima)"

echo "[start] A arrancar a API + site..."
exec node dist/server.js
