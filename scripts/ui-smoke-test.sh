#!/bin/bash

set -euo pipefail

ENV_FILE="${1:-.env.demo}"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
NGINX_URL="${NGINX_URL:-http://localhost}"
OPENG2P_PUBLIC_URL="${OPENG2P_PUBLIC_URL:-http://localhost:8070}"
WSO2_GATEWAY_PUBLIC_URL="${WSO2_GATEWAY_PUBLIC_URL:-http://localhost:8243}"
CHOREO_NOTIFIER_PUBLIC_URL="${CHOREO_NOTIFIER_PUBLIC_URL:-http://localhost:8095}"
ODOO_PUBLIC_URL="${ODOO_PUBLIC_URL:-http://localhost:8069}"
SUPERSET_PUBLIC_URL="${SUPERSET_PUBLIC_URL:-http://localhost:8088}"

TMP_DIR="/tmp/govrecover360-ui-smoke-$(date +%Y%m%d%H%M%S)"
mkdir -p "$TMP_DIR"

pass() {
  echo "✅ $1"
}

fail() {
  echo "❌ $1"
  exit 1
}

check_status() {
  local name="$1"
  local url="$2"
  local allowed="${3:-200}"
  local outfile="$TMP_DIR/${name// /_}.out"
  local code

  code=$(curl -sk -L --max-redirs 2 -o "$outfile" -w "%{http_code}" "$url" || true)
  if [[ ",$allowed," == *",$code,"* ]]; then
    pass "$name returned HTTP $code"
  else
    echo "URL: $url"
    echo "Body:"
    cat "$outfile" || true
    fail "$name returned HTTP $code; expected one of: $allowed"
  fi
}

check_spa_route() {
  local route="$1"
  local outfile="$TMP_DIR/spa_${route//\//_}.html"
  local code

  code=$(curl -sk "$FRONTEND_URL$route" -o "$outfile" -w "%{http_code}" || true)
  if [ "$code" != "200" ]; then
    fail "Frontend route $route returned HTTP $code"
  fi
  if grep -q "GovRecover360" "$outfile" && grep -q "<script" "$outfile"; then
    pass "Frontend route $route returns React app shell"
  else
    fail "Frontend route $route did not return the React app shell"
  fi
}

echo "GovRecover360 UI smoke test"
echo "Output: $TMP_DIR"

check_status "Frontend root" "$FRONTEND_URL" "200"
check_spa_route "/login"
check_spa_route "/admin"
check_spa_route "/admin/integrations"

check_status "Backend health" "$BACKEND_URL/api/health" "200"
check_status "Integration status direct" "$BACKEND_URL/api/integrations/status" "200"
check_status "Integration status nginx" "$NGINX_URL/api/integrations/status" "200"
check_status "OpenG2P health" "$OPENG2P_PUBLIC_URL/api/health" "200"
check_status "WSO2 gateway health" "$WSO2_GATEWAY_PUBLIC_URL/health" "200"
check_status "Choreo health" "$CHOREO_NOTIFIER_PUBLIC_URL/health" "200"
check_status "Superset" "$SUPERSET_PUBLIC_URL" "200,302"
check_status "Odoo" "$ODOO_PUBLIC_URL" "200,303"

echo "✅ UI smoke test completed"
