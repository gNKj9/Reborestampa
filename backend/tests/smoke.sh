#!/usr/bin/env bash
# Smoke test end-to-end da API (auth, RBAC, rotação de refresh, CORS, rate limit).
# Pré-requisitos: API a correr em API_URL, admin semeado com ADMIN_EMAIL/ADMIN_PASSWORD.
#
#   API_URL=http://127.0.0.1:4000/api \
#   ADMIN_EMAIL=admin@reborestampa.pt ADMIN_PASSWORD='...' bash tests/smoke.sh
set -u

API="${API_URL:-http://127.0.0.1:4000/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@reborestampa.pt}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:?define ADMIN_PASSWORD}"
TMP="$(mktemp -d)"
COOKIES="$TMP/admin.jar"

trap 'rm -rf "$TMP"' EXIT

say() { printf "\n== %s ==\n" "$1"; }
cookie_value() { awk -v n=rb_refresh '$6==n {print $7}' "$1"; }

say "1. login admin"
LOGIN=$(curl -s -c "$COOKIES" -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  -w '\n%{http_code}' "$API/auth/login")
BODY=$(printf '%s' "$LOGIN" | head -n -1)
CODE=$(printf '%s' "$LOGIN" | tail -n 1)
echo "status=$CODE"
printf '%s' "$BODY" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('chaves da resposta:', sorted(d.keys()))
print('utilizador:', d['user']['email'], d['user']['role'])
open('$TMP/access.txt','w').write(d['accessToken'])
"
echo "refresh token presente no corpo? $(printf '%s' "$BODY" | grep -c refreshToken)"

say "2. flags do cookie de refresh"
curl -s -D - -o /dev/null -c "$COOKIES" -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  "$API/auth/login" | grep -i "^set-cookie" | sed 's/; */\n    /g'

say "3. GET /auth/me sem token"
curl -s -o /dev/null -w 'status=%{http_code}\n' "$API/auth/me"

say "4. GET /auth/me com token"
TOKEN=$(cat "$TMP/access.txt")
curl -s -o "$TMP/me.json" -w 'status=%{http_code}\n' \
  -H "Authorization: Bearer $TOKEN" "$API/auth/me"
cat "$TMP/me.json"; echo

say "5. GET /users como ADMIN"
curl -s -o "$TMP/users.json" -w 'status=%{http_code}\n' \
  -H "Authorization: Bearer $TOKEN" "$API/users"
python3 -c "
import json
d=json.load(open('$TMP/users.json'))
print('total:', d['total'], '|', [u['email'] for u in d['items']])
"

say "6. criar conta VIEWER"
VIEWER_EMAIL="viewer+$(date +%s)@reborestampa.pt"
curl -s -o "$TMP/created.json" -w 'status=%{http_code}\n' \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Ana Silva\",\"email\":\"$VIEWER_EMAIL\",\"password\":\"ViewerPass!2026\",\"role\":\"VIEWER\"}" \
  "$API/auth/register"
cat "$TMP/created.json"; echo

say "7. VIEWER a tentar GET /users (esperado 403)"
curl -s -c "$TMP/viewer.jar" -H "Content-Type: application/json" \
  -d "{\"email\":\"$VIEWER_EMAIL\",\"password\":\"ViewerPass!2026\"}" \
  "$API/auth/login" > "$TMP/viewer-login.json"
VTOKEN=$(python3 -c "import json;print(json.load(open('$TMP/viewer-login.json'))['accessToken'])")
curl -s -o "$TMP/forbidden.json" -w 'status=%{http_code}\n' \
  -H "Authorization: Bearer $VTOKEN" "$API/users"
cat "$TMP/forbidden.json"; echo

say "8. validação de input (esperado 422)"
curl -s -w '\nstatus=%{http_code}\n' -H "Content-Type: application/json" \
  -d '{"email":"nao-e-email","password":"x"}' "$API/auth/login"

say "9. password errada (esperado 401)"
curl -s -o /dev/null -w 'status=%{http_code}\n' -H "Content-Type: application/json" \
  -d "{\"email\":\"$VIEWER_EMAIL\",\"password\":\"PasswordErrada1\"}" "$API/auth/login"

say "10. rotação: refresh com cookie"
curl -s -b "$COOKIES" -c "$COOKIES" -o "$TMP/refreshed.json" -w 'status=%{http_code}\n' \
  -X POST "$API/auth/refresh"
python3 -c "
import json
d=json.load(open('$TMP/refreshed.json'))
print('novo access token (len):', len(d['accessToken']))
"

say "11. deteção de reutilização de refresh token"
rm -f "$TMP/r1.jar"
curl -s -c "$TMP/r1.jar" -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  "$API/auth/login" > /dev/null
OLD_TOKEN=$(cookie_value "$TMP/r1.jar")
echo "token capturado (len=${#OLD_TOKEN})"
curl -s -b "$TMP/r1.jar" -c "$TMP/r1.jar" -o /dev/null -w 'primeiro refresh=%{http_code}\n' \
  -X POST "$API/auth/refresh"
NEW_TOKEN=$(cookie_value "$TMP/r1.jar")
curl -s -o "$TMP/reuse.json" -w 'reutilização do antigo=%{http_code}\n' \
  -X POST -H "Cookie: rb_refresh=$OLD_TOKEN" "$API/auth/refresh"
cat "$TMP/reuse.json"; echo
curl -s -o /dev/null -w 'token novo após deteção=%{http_code} (esperado 401: família revogada)\n' \
  -X POST -H "Cookie: rb_refresh=$NEW_TOKEN" "$API/auth/refresh"

say "12. CORS"
echo -n "origem não autorizada -> cabeçalho ACAO: "
curl -s -D - -o /dev/null -H "Origin: https://evil.example" "$API/health" \
  | grep -ci "access-control-allow-origin"
echo -n "origem autorizada -> "
curl -s -D - -o /dev/null -H "Origin: http://localhost:3000" "$API/health" \
  | grep -i "access-control-allow-origin" | tr -d '\r'

say "13. logout revoga o refresh token"
curl -s -b "$COOKIES" -c "$COOKIES" -o /dev/null -w 'logout=%{http_code}\n' -X POST "$API/auth/logout"
curl -s -o "$TMP/after.json" -w 'refresh após logout=%{http_code}\n' \
  -X POST -H "Cookie: rb_refresh=$NEW_TOKEN" "$API/auth/refresh"

say "14. rate limit no login (25 falhas, email diferente em cada)"
for _ in $(seq 1 25); do
  curl -s -o /dev/null -w "%{http_code} " -H "Content-Type: application/json" \
    -d "{\"email\":\"brute+$(date +%s)@example.com\",\"password\":\"ErradaPass1\"}" \
    "$API/auth/login"
done
echo

say "15. rota inexistente"
curl -s -w '\nstatus=%{http_code}\n' "$API/nao-existe"
