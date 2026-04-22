#!/usr/bin/env bash
# Smoke test end-to-end del CRUD + log + apagado on-demand de query-person.
# Pasa si todos los pasos retornan los codigos HTTP esperados.
#
# Requisitos: stack levantado (`make up`) y curl disponible.

set -u

BASE="${BASE_URL:-http://localhost:8080}"
TIPO="Cedula"
DOC="9999999999"
FAILS=0

check() {
  local label="$1" expected="$2" actual="$3"
  # Si expected termina en "xx" (ej. "5xx"), acepta cualquier codigo en esa familia.
  if [[ "$expected" == *xx ]]; then
    local prefix="${expected%xx}"
    if [[ "$actual" == ${prefix}* ]]; then
      printf "  [OK]   %-30s HTTP %s\n" "$label" "$actual"; return
    fi
  elif [[ "$actual" == "$expected" ]]; then
    printf "  [OK]   %-30s HTTP %s\n" "$label" "$actual"; return
  fi
  printf "  [FAIL] %-30s esperado HTTP %s, got %s\n" "$label" "$expected" "$actual"
  FAILS=$((FAILS+1))
}

code() {
  curl -s -o /dev/null -w "%{http_code}" "$@"
}

echo "=== 1. Healthchecks ==="
for svc in create update query delete log; do
  check "$svc /health" 200 "$(code "$BASE/api/$svc/health")"
done

echo
echo "=== 2. CREATE ==="
check "POST /api/create/" 201 "$(code -X POST "$BASE/api/create/" \
  -H "Content-Type: application/json" \
  -d "{\"tipo_documento\":\"$TIPO\",\"nro_documento\":\"$DOC\",\"primer_nombre\":\"Juan\",\"segundo_nombre\":\"Sebastian\",\"apellidos\":\"Ruiz\",\"fecha_nacimiento\":\"2000-05-15\",\"genero\":\"Masculino\",\"correo\":\"juan@example.com\",\"celular\":\"3001234567\"}")"

echo
echo "=== 3. QUERY ==="
check "GET /api/query/" 200 "$(code "$BASE/api/query/?tipo_documento=$TIPO&nro_documento=$DOC")"

echo
echo "=== 4. UPDATE ==="
check "PUT /api/update/" 200 "$(code -X PUT "$BASE/api/update/" \
  -H "Content-Type: application/json" \
  -d "{\"tipo_documento\":\"$TIPO\",\"nro_documento\":\"$DOC\",\"primer_nombre\":\"Juan\",\"segundo_nombre\":\"Sebastian\",\"apellidos\":\"Ruiz Gomez\",\"fecha_nacimiento\":\"2000-05-15\",\"genero\":\"Masculino\",\"correo\":\"juan@example.com\",\"celular\":\"3009999999\"}")"

echo
echo "=== 5. LOG por documento ==="
check "GET /api/log/ por doc" 200 "$(code "$BASE/api/log/?tipo_documento=$TIPO&nro_documento=$DOC")"

echo
echo "=== 6. LOG por rango de fechas ==="
today=$(date +%Y-%m-%d)
check "GET /api/log/ por fecha" 200 "$(code "$BASE/api/log/?desde=${today}T00:00:00&hasta=${today}T23:59:59")"

echo
echo "=== 7. Apagado on-demand de query-person ==="
docker compose stop query-person >/dev/null
check "query apagado -> 5xx" 5xx "$(code "$BASE/api/query/?tipo_documento=$TIPO&nro_documento=$DOC")"
check "create sigue vivo"    200 "$(code "$BASE/api/create/health")"
docker compose start query-person >/dev/null
for _ in $(seq 1 30); do
  [[ "$(code "$BASE/api/query/health")" == "200" ]] && break
  sleep 1
done
check "query reactivado"     200 "$(code "$BASE/api/query/health")"

echo
echo "=== 8. DELETE y QUERY final ==="
check "DELETE /api/delete/"  200 "$(code -X DELETE "$BASE/api/delete/?tipo_documento=$TIPO&nro_documento=$DOC")"
check "QUERY post-delete"    404 "$(code "$BASE/api/query/?tipo_documento=$TIPO&nro_documento=$DOC")"

echo
if [[ "$FAILS" -eq 0 ]]; then
  echo "Smoke test: OK (todo verde)"
  exit 0
else
  echo "Smoke test: $FAILS fallos"
  exit 1
fi
