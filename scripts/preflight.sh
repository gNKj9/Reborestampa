#!/usr/bin/env bash
# Verificação pós-deploy do site e da API.
#
#   BASE_URL=https://reborestampa.onrender.com bash scripts/preflight.sh
#
# Sai com código 1 se algo falhar, para poder ser usado em CI ou à mão depois
# de um deploy. Não precisa de credenciais: só toca em rotas públicas.
set -uo pipefail

BASE="${BASE_URL:-https://reborestampa.onrender.com}"
TIMEOUT="${TIMEOUT:-60}"  # a instância free pode demorar ~1 min a acordar

pass=0
fail=0

TMP_BODY="$(mktemp)"
trap 'rm -f "$TMP_BODY"' EXIT

ok() {
  pass=$((pass + 1))
  printf '  ok    %s\n' "$1"
}

bad() {
  fail=$((fail + 1))
  printf '  FALHA %s\n' "$1"
}

code() {
  # Em falha de ligação o curl já imprime 000; não acrescentar outro.
  curl -s -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" "$BASE$1" 2>/dev/null || true
}

expect_code() {
  local path="$1" expected="$2" label="$3" got
  got="$(code "$path")"
  if [ "$got" = "$expected" ]; then
    ok "$label"
  else
    bad "$label (esperado $expected, obtido $got)"
  fi
}

expect_header() {
  local path="$1" header="$2" label="$3" value
  value="$(curl -s -D - -o /dev/null --max-time "$TIMEOUT" "$BASE$path" 2>/dev/null \
    | tr -d '\r' | awk -v h="$header" 'BEGIN{IGNORECASE=1} tolower($0) ~ "^" tolower(h) ":" {print; exit}')"
  if [ -n "$value" ]; then
    ok "$label"
  else
    bad "$label (cabeçalho $header ausente)"
  fi
}

body_contains() {
  local path="$1" needle="$2" label="$3"
  if curl -s --max-time "$TIMEOUT" "$BASE$path" 2>/dev/null | grep -q "$needle"; then
    ok "$label"
  else
    bad "$label (não encontrou '$needle' em $path)"
  fi
}

echo "Verificação de $BASE"
echo

echo "== Páginas públicas =="
expect_code "/" 200 "home"
expect_code "/login" 200 "login"
expect_code "/recuperar" 200 "recuperar acesso"
expect_code "/redefinir" 200 "redefinir palavra-passe"
expect_code "/privacidade" 200 "política de privacidade"
expect_code "/sitemap.xml" 200 "sitemap"
expect_code "/robots.txt" 200 "robots"

echo "== Área reservada =="
expect_code "/painel" 200 "painel responde (conteúdo é renderizado no cliente)"
body_contains "/painel" 'noindex' "painel marcado como noindex"
body_contains "/robots.txt" "Disallow: /painel" "robots bloqueia o painel"

echo "== API =="
expect_code "/api/health" 200 "health"
body_contains "/api/health/ready" '"status":"ready"' "base de dados pronta"
expect_code "/api/contact-requests" 401 "rotas privadas exigem sessão"
expect_code "/api/rota-que-nao-existe" 404 "404 em JSON para rotas desconhecidas"

echo "== Cabeçalhos de segurança =="
expect_header "/" "strict-transport-security" "HSTS"
expect_header "/" "x-content-type-options" "nosniff"
expect_header "/" "referrer-policy" "referrer-policy"
expect_header "/api/health" "content-security-policy" "CSP na API"

echo "== Recuperação de palavra-passe =="
# Email único por execução: o limite é por IP+email e o monitor não deve
# gastar a quota de um endereço real.
PROBE_EMAIL="preflight+$(date +%s)@exemplo.pt"
forgot_code="$(curl -s -o "$TMP_BODY" -w '%{http_code}' --max-time "$TIMEOUT" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$PROBE_EMAIL\"}" "$BASE/api/auth/forgot-password" 2>/dev/null || true)"
if [ "$forgot_code" = "202" ] || [ "$forgot_code" = "429" ]; then
  ok "pedido de recuperação responde ($forgot_code)"
else
  bad "pedido de recuperação (esperado 202 ou 429, obtido $forgot_code)"
fi
if [ "$forgot_code" = "202" ]; then
  if grep -q 'devToken' "$TMP_BODY" 2>/dev/null; then
    bad "a API devolveu devToken em produção"
  else
    ok "sem devToken na resposta pública"
  fi
fi

echo
printf 'Resultado: %d verificações ok, %d falhas\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
