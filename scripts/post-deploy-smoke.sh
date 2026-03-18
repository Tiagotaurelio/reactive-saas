#!/bin/sh

set -eu

APP_URL="${APP_URL:-http://127.0.0.1:3000}"
EMAIL="${REACTIVE_SMOKE_EMAIL:-admin@reactive.local}"
PASSWORD="${REACTIVE_SMOKE_PASSWORD:-demo123}"
COOKIE_JAR="$(mktemp)"

cleanup() {
  rm -f "$COOKIE_JAR"
}

trap cleanup EXIT

check_status() {
  url="$1"
  expected="${2:-200}"
  status="$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$APP_URL$url")"
  if [ "$status" != "$expected" ]; then
    echo "Falha em $url: esperado $expected, recebido $status" >&2
    exit 1
  fi
  echo "OK $url -> $status"
}

echo "Smoke ReActive em $APP_URL"

check_status "/api/health" "200"
check_status "/demo" "200"
check_status "/login" "200"

login_status="$(curl -s -o /dev/null -w "%{http_code}" -c "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$APP_URL/api/auth/login")"

if [ "$login_status" != "200" ]; then
  echo "Falha no login demo: status $login_status" >&2
  exit 1
fi

echo "OK /api/auth/login -> $login_status"

check_status "/api/auth/session" "200"
check_status "/dashboard" "200"
check_status "/clientes" "200"
check_status "/inbox" "200"
check_status "/logs" "200"
check_status "/api/reactive/snapshot" "200"

echo "Smoke ReActive concluido com sucesso."
