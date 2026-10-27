#!/usr/bin/env bash
# Testes de integração das funcionalidades administrativas:
#   - pedidos de contacto (público + caixa de entrada)
#   - gestão de utilizadores (papéis, travas de segurança, reposição)
#   - alteração da própria palavra-passe
#
# Requer a API a correr e um administrador criado (ver README).
# Uso:
#   ADMIN_PASSWORD='...' ./tests/smoke-admin.sh
set -euo pipefail

API="${API:-http://127.0.0.1:4000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@reborestampa.pt}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:?define ADMIN_PASSWORD}"

DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/.out.$$"
JAR_A="$DIR/.jar-a.$$"
JAR_B="$DIR/.jar-b.$$"
trap 'rm -f "$OUT" "$JAR_A" "$JAR_B"' EXIT

pass=0
fail=0

code() { curl -sS -o "$OUT" -w '%{http_code}' "$@"; }

jget() {
  python3 - "$OUT" "$1" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
cur = data
for part in sys.argv[2].split("."):
    cur = cur[int(part)] if isinstance(cur, list) else cur[part]
print(cur)
PY
}

ok() { pass=$((pass + 1)); printf '  ok    %s\n' "$1"; }

expect() {
  local want="$1" got="$2" label="$3"
  if [ "$want" != "$got" ]; then
    fail=$((fail + 1))
    printf '  FALHA %s (esperado %s, obtido %s)\n' "$label" "$want" "$got"
    printf '        corpo: %s\n' "$(head -c 300 "$OUT")"
  else
    ok "$label"
  fi
}

assert() {
  local cond="$1" label="$2"
  if [ "$cond" = "1" ]; then ok "$label"; else
    fail=$((fail + 1)); printf '  FALHA %s\n' "$label"
  fi
}

echo "== Autenticação =="
expect 200 "$(code -c "$JAR_A" -H 'content-type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  "$API/api/auth/login")" "login do administrador"
TOKEN_A="$(jget accessToken)"

echo "== Pedidos de contacto (público) =="
expect 200 "$(code -H "authorization: Bearer $TOKEN_A" "$API/api/contact-requests")" \
  "linha de base da caixa de entrada"
TOTAL_BEFORE="$(jget total)"

expect 201 "$(code -H 'content-type: application/json' \
  -d '{"name":"Ana Ribeiro","email":"ana@exemplo.pt","company":"Malhas Norte","phone":"912345678","message":"Gostaria de pedir uma prova de cor para lacas a quatro cores."}' \
  "$API/api/contact")" "pedido válido aceite"
assert "$( [ "$(jget ok)" = "True" ] && echo 1 || echo 0 )" "resposta discreta {ok:true}"

expect 201 "$(code -H 'content-type: application/json' \
  -d '{"name":"Bot","email":"bot@exemplo.pt","message":"Mensagem de spam com honeypot preenchido.","website":"http://spam.example"}' \
  "$API/api/contact")" "honeypot respondido como sucesso"

expect 200 "$(code -H "authorization: Bearer $TOKEN_A" "$API/api/contact-requests")" \
  "recontagem após os dois pedidos"
TOTAL_AFTER="$(jget total)"
assert "$( [ "$TOTAL_AFTER" = "$((TOTAL_BEFORE + 1))" ] && echo 1 || echo 0 )" \
  "honeypot não entrou na base (total $TOTAL_BEFORE → $TOTAL_AFTER)"

expect 422 "$(code -H 'content-type: application/json' \
  -d '{"name":"A","email":"invalido","message":"curta"}' \
  "$API/api/contact")" "payload inválido rejeitado"

echo "== Caixa de entrada (RBAC) =="
expect 401 "$(code "$API/api/contact-requests")" "sem sessão → 401"

expect 201 "$(code -H "authorization: Bearer $TOKEN_A" -H 'content-type: application/json' \
  -d '{"name":"Vasco Leitor","email":"vasco@exemplo.pt","password":"Leitura-Forte-2026","role":"VIEWER"}' \
  "$API/api/users")" "administrador cria VIEWER"
VIEWER_ID="$(jget user.id)"

expect 200 "$(code -c "$JAR_B" -H 'content-type: application/json' \
  -d '{"email":"vasco@exemplo.pt","password":"Leitura-Forte-2026"}' \
  "$API/api/auth/login")" "VIEWER inicia sessão"
TOKEN_B="$(jget accessToken)"

expect 403 "$(code -H "authorization: Bearer $TOKEN_B" "$API/api/contact-requests")" \
  "VIEWER não vê pedidos (403)"

expect 200 "$(code -H "authorization: Bearer $TOKEN_A" "$API/api/contact-requests")" \
  "ADMIN lista pedidos"
NEW_COUNT="$(jget counts.NEW)"
assert "$( [ "$NEW_COUNT" -ge 1 ] && echo 1 || echo 0 )" "contagem de novos inclui o pedido"
REQUEST_ID="$(jget items.0.id)"

expect 200 "$(code -H "authorization: Bearer $TOKEN_A" -X PATCH -H 'content-type: application/json' \
  -d '{"status":"REPLIED"}' "$API/api/contact-requests/$REQUEST_ID")" "marcar como respondido"
HANDLED="$(jget request.handledAt)"
assert "$( [ "$HANDLED" != "None" ] && echo 1 || echo 0 )" "regista a data de resposta"

expect 422 "$(code -H "authorization: Bearer $TOKEN_A" -X PATCH -H 'content-type: application/json' \
  -d '{"status":"INVENTADO"}' "$API/api/contact-requests/$REQUEST_ID")" "estado inválido rejeitado"

expect 404 "$(code -H "authorization: Bearer $TOKEN_A" -X PATCH -H 'content-type: application/json' \
  -d '{"status":"READ"}' "$API/api/contact-requests/00000000-0000-4000-8000-000000000000")" "pedido inexistente → 404"

echo "== Gestão de utilizadores =="
expect 200 "$(code -H "authorization: Bearer $TOKEN_A" -X PATCH -H 'content-type: application/json' \
  -d '{"role":"EDITOR"}' "$API/api/users/$VIEWER_ID")" "promover a EDITOR"
expect 200 "$(code -H "authorization: Bearer $TOKEN_B" "$API/api/contact-requests")" \
  "EDITOR passa a ver pedidos"

expect 200 "$(code -H "authorization: Bearer $TOKEN_A" "$API/api/auth/me")" "me do administrador"
ADMIN_ID="$(jget user.id)"

expect 400 "$(code -H "authorization: Bearer $TOKEN_A" -X PATCH -H 'content-type: application/json' \
  -d '{"role":"VIEWER"}' "$API/api/users/$ADMIN_ID")" "administrador não muda o próprio papel"
expect 400 "$(code -H "authorization: Bearer $TOKEN_A" -X PATCH -H 'content-type: application/json' \
  -d '{"isActive":false}' "$API/api/users/$ADMIN_ID")" "administrador não se desativa"

expect 400 "$(code -H "authorization: Bearer $TOKEN_A" -X POST -H 'content-type: application/json' \
  -d '{"newPassword":"Reposta-Forte-2026"}' "$API/api/users/$ADMIN_ID/reset-password")" \
  "reposição sobre a própria conta é recusada"

echo "== Reposição de palavra-passe (administrador) =="
expect 200 "$(code -H "authorization: Bearer $TOKEN_A" -X POST -H 'content-type: application/json' \
  -d '{"newPassword":"Reposta-Forte-2026"}' "$API/api/users/$VIEWER_ID/reset-password")" \
  "administrador repõe a palavra-passe do EDITOR"

expect 401 "$(code -H 'content-type: application/json' \
  -d '{"email":"vasco@exemplo.pt","password":"Leitura-Forte-2026"}' "$API/api/auth/login")" \
  "palavra-passe antiga deixa de funcionar"

expect 401 "$(code -b "$JAR_B" -X POST "$API/api/auth/refresh")" "refresh do EDITOR foi revogado"

expect 200 "$(code -H 'content-type: application/json' \
  -d '{"email":"vasco@exemplo.pt","password":"Reposta-Forte-2026"}' "$API/api/auth/login")" \
  "palavra-passe reposta funciona"

echo "== Alteração da própria palavra-passe =="
expect 400 "$(code -H "authorization: Bearer $TOKEN_A" -X PATCH -H 'content-type: application/json' \
  -d '{"currentPassword":"Errada-000000","newPassword":"Outra-Forte-2026"}' "$API/api/auth/password")" \
  "palavra-passe atual errada é recusada"

expect 400 "$(code -H "authorization: Bearer $TOKEN_A" -X PATCH -H 'content-type: application/json' \
  -d "{\"currentPassword\":\"$ADMIN_PASSWORD\",\"newPassword\":\"$ADMIN_PASSWORD\"}" "$API/api/auth/password")" \
  "nova igual à atual é recusada"

expect 200 "$(code -b "$JAR_A" -H "authorization: Bearer $TOKEN_A" -X PATCH -H 'content-type: application/json' \
  -d "{\"currentPassword\":\"$ADMIN_PASSWORD\",\"newPassword\":\"Admin-Nova-Forte-2026\"}" "$API/api/auth/password")" \
  "administrador altera a própria palavra-passe"
assert "$( [ "$(jget user.passwordChangedAt)" != "None" ] && echo 1 || echo 0 )" "passwordChangedAt preenchido"

expect 200 "$(code -b "$JAR_A" -X POST "$API/api/auth/refresh")" "sessão que alterou continua válida"

expect 401 "$(code -H 'content-type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" "$API/api/auth/login")" \
  "palavra-passe antiga do administrador já não entra"

expect 200 "$(code -H 'content-type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"Admin-Nova-Forte-2026\"}" "$API/api/auth/login")" \
  "palavra-passe nova do administrador entra"

echo "== Limite do formulário público =="
LIMIT_CODES=""
for i in 1 2 3 4 5; do
  LIMIT_CODES="$LIMIT_CODES $(code -H 'content-type: application/json' \
    -d "{\"name\":\"Teste $i\",\"email\":\"teste$i@exemplo.pt\",\"message\":\"Mensagem de teste número $i para o limite.\"}" \
    "$API/api/contact")"
done
if printf '%s' "$LIMIT_CODES" | grep -q '429'; then ok "limite de pedidos aplicado ($LIMIT_CODES)";
else fail=$((fail + 1)); printf '  FALHA limite não aplicado (%s)\n' "$LIMIT_CODES"; fi

echo
printf 'Resultado: %d passaram, %d falharam\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
