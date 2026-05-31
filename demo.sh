#!/bin/bash

set -euo pipefail

# ====================================================
# GovRecover360 End-to-End Demo Script
# Disaster Recovery + OpenG2P + WSO2 + Odoo + Choreo
# ====================================================

ENV_FILE="${1:-.env.demo}"
RUN_ID="$(date +%Y%m%d%H%M%S)"
TMP_DIR="/tmp/govrecover360-demo-$RUN_ID"

mkdir -p "$TMP_DIR"

echo "===================================================="
echo "🚀 GovRecover360 Disaster Recovery End-to-End Demo"
echo "===================================================="
echo "Run ID: $RUN_ID"
echo "Temp output: $TMP_DIR"
echo "===================================================="

# ----------------------------------------------------
# 0. Load environment
# ----------------------------------------------------

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Environment file not found: $ENV_FILE"
  echo ""
  echo "Expected one of:"
  echo "  .env.demo"
  echo "  .env"
  echo ""
  echo "Run:"
  echo "  docker compose --env-file .env.demo up -d --build"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

# ----------------------------------------------------
# 1. Default local URLs
# ----------------------------------------------------

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
NGINX_URL="${NGINX_URL:-http://localhost}"
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
OPENG2P_PUBLIC_URL="${OPENG2P_PUBLIC_URL:-http://localhost:8070}"
WSO2_GATEWAY_PUBLIC_URL="${WSO2_GATEWAY_PUBLIC_URL:-http://localhost:8243}"
CHOREO_NOTIFIER_PUBLIC_URL="${CHOREO_NOTIFIER_PUBLIC_URL:-http://localhost:8095}"
AI_SERVICE_PUBLIC_URL="${AI_SERVICE_PUBLIC_URL:-http://localhost:8050}"
ODOO_PUBLIC_URL="${ODOO_PUBLIC_URL:-http://localhost:8069}"
SUPERSET_PUBLIC_URL="${SUPERSET_PUBLIC_URL:-http://localhost:8088}"

# Docker internal defaults may exist in env:
# OPENG2P_API_BASE_URL=http://openg2p:8070/api
# WSO2_GATEWAY_URL=http://wso2-api-manager:8243

echo ""
echo "🔧 Demo URLs"
echo "Frontend:        $FRONTEND_URL"
echo "Backend:         $BACKEND_URL"
echo "Nginx:           $NGINX_URL"
echo "OpenG2P:         $OPENG2P_PUBLIC_URL"
echo "WSO2 Gateway:    $WSO2_GATEWAY_PUBLIC_URL"
echo "Choreo Notifier: $CHOREO_NOTIFIER_PUBLIC_URL"
echo "AI Service:      $AI_SERVICE_PUBLIC_URL"
echo "Odoo:            $ODOO_PUBLIC_URL"
echo "Superset:        $SUPERSET_PUBLIC_URL"

# ----------------------------------------------------
# Helper functions
# ----------------------------------------------------

section() {
  echo ""
  echo "===================================================="
  echo "$1"
  echo "===================================================="
}

success() {
  echo "✅ $1"
}

warn() {
  echo "⚠️  $1"
}

fail() {
  echo "❌ $1"
  exit 1
}

http_check() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"

  echo "Checking $name -> $url"

  local code
  code=$(curl -sk -o "$TMP_DIR/${name// /_}.out" -w "%{http_code}" "$url" || true)

  if [ "$code" = "$expected" ]; then
    success "$name returned HTTP $code"
  else
    echo "Response body:"
    cat "$TMP_DIR/${name// /_}.out" || true
    fail "$name failed. Expected HTTP $expected but got HTTP $code"
  fi
}

http_check_allow_redirect() {
  local name="$1"
  local url="$2"

  echo "Checking $name -> $url"

  local code
  code=$(curl -sk -o "$TMP_DIR/${name// /_}.out" -w "%{http_code}" "$url" || true)

  if [[ "$code" =~ ^(200|301|302|303)$ ]]; then
    success "$name returned HTTP $code"
  else
    echo "Response body:"
    cat "$TMP_DIR/${name// /_}.out" || true
    fail "$name failed. Got HTTP $code"
  fi
}

# Like http_check but prints a warning instead of hard-failing.
# Use for optional/eventually-ready services (nginx, superset).
http_check_warn() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"

  echo "Checking $name -> $url"

  local code
  code=$(curl -sk -o "$TMP_DIR/${name// /_}.out" -w "%{http_code}" "$url" || true)

  if [ "$code" = "$expected" ]; then
    success "$name returned HTTP $code"
  else
    echo "Response body:"
    cat "$TMP_DIR/${name// /_}.out" || true
    warn "$name returned HTTP $code (expected $expected). Continuing — may need more startup time or manual check."
  fi
}

# Like http_check_allow_redirect but prints a warning instead of hard-failing.
http_check_redirect_warn() {
  local name="$1"
  local url="$2"

  echo "Checking $name -> $url"

  local code
  code=$(curl -sk -o "$TMP_DIR/${name// /_}.out" -w "%{http_code}" "$url" || true)

  if [[ "$code" =~ ^(200|301|302|303)$ ]]; then
    success "$name returned HTTP $code"
  else
    echo "Response body:"
    cat "$TMP_DIR/${name// /_}.out" || true
    warn "$name returned HTTP $code. Continuing — may need more startup time or manual check."
  fi
}

json_value() {
  local key="$1"
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    value = data
    for part in '$key'.split('.'):
        if isinstance(value, dict):
            value = value.get(part)
        else:
            value = None
            break
    print('' if value is None else value)
except Exception:
    print('')
"
}

pretty_json() {
  python3 -m json.tool 2>/dev/null || cat
}

post_json() {
  local name="$1"
  local url="$2"
  local data="$3"
  local outfile="$TMP_DIR/${name// /_}.json"

  echo "POST $url"

  local code
  code=$(curl -sk -X POST "$url" \
    -H "Content-Type: application/json" \
    -o "$outfile" \
    -w "%{http_code}" \
    -d "$data" || true)

  if [[ "$code" =~ ^(200|201)$ ]]; then
    success "$name returned HTTP $code"
    cat "$outfile" | pretty_json
  else
    echo "Response body:"
    cat "$outfile" || true
    fail "$name failed. Got HTTP $code"
  fi
}

get_json_optional() {
  local name="$1"
  local url="$2"
  local outfile="$TMP_DIR/${name// /_}.json"

  echo "GET $url"

  local code
  code=$(curl -sk "$url" \
    -H "Content-Type: application/json" \
    -o "$outfile" \
    -w "%{http_code}" || true)

  if [[ "$code" =~ ^(200|201)$ ]]; then
    success "$name returned HTTP $code"
    cat "$outfile" | pretty_json
  else
    warn "$name returned HTTP $code"
    cat "$outfile" || true
  fi
}

# ----------------------------------------------------
# 2. Docker service check
# ----------------------------------------------------

section "1️⃣ Checking Docker Compose services"

if ! command -v docker >/dev/null 2>&1; then
  fail "Docker is not installed or not available in PATH"
fi

docker compose --env-file "$ENV_FILE" ps

REQUIRED_CONTAINERS=(
  "govrecover-frontend"
  "govrecover-backend"
  "govrecover-openg2p"
  "govrecover-wso2"
  "govrecover-odoo"
  "govrecover-postgres"
  "govrecover-redis"
)

echo ""
echo "Checking expected GovRecover360 containers..."

RUNNING_CONTAINERS="$(docker ps --format '{{.Names}}')"

for expected in "${REQUIRED_CONTAINERS[@]}"; do
  if echo "$RUNNING_CONTAINERS" | grep -qi "$expected"; then
    success "Container found: $expected"
  else
    warn "Container matching '$expected' not found by name. Checking may still pass through health URLs."
  fi
done

# ----------------------------------------------------
# 3. Health checks
# ----------------------------------------------------

section "2️⃣ Running core health checks"

http_check_allow_redirect "Frontend" "$FRONTEND_URL"
http_check_redirect_warn  "Nginx Root" "$NGINX_URL"
http_check "Backend Health Direct" "$BACKEND_URL/api/health" "200"
http_check_warn           "Backend Health Through Nginx" "$NGINX_URL/api/health" "200"
http_check "OpenG2P Demo Runtime Health" "$OPENG2P_PUBLIC_URL/api/health" "200"
http_check "WSO2 Demo Gateway Health" "$WSO2_GATEWAY_PUBLIC_URL/health" "200"
http_check "WSO2 Backend Proxy Health" "$WSO2_GATEWAY_PUBLIC_URL/api/health" "200"
http_check "Choreo Notification Health" "$CHOREO_NOTIFIER_PUBLIC_URL/health" "200"
http_check "AI Service Health" "$AI_SERVICE_PUBLIC_URL/health" "200"
http_check_allow_redirect "Odoo Web" "$ODOO_PUBLIC_URL"
http_check_redirect_warn  "Superset" "$SUPERSET_PUBLIC_URL"

echo ""
echo "Checking WSO2 version endpoint..."
curl -sk "$WSO2_GATEWAY_PUBLIC_URL/services/Version" | tee "$TMP_DIR/wso2_version.out"
echo ""
success "WSO2 demo gateway version check completed"

# ----------------------------------------------------
# 4. Backend integration status
# ----------------------------------------------------

section "3️⃣ Checking backend integration status"

get_json_optional "Integration Status Direct" "$BACKEND_URL/api/integrations/status"
get_json_optional "Integration Status Nginx" "$NGINX_URL/api/integrations/status"

# ----------------------------------------------------
# 5. OpenG2P demo runtime flow
# ----------------------------------------------------

section "4️⃣ Running OpenG2P beneficiary demo flow"

BENEFICIARY_ID="BEN-$RUN_ID"
HOUSEHOLD_ID="HH-$RUN_ID"
PROGRAM_ID="FLOOD-RELIEF-2026"

BENEFICIARY_NAME="Flood Relief Beneficiary $RUN_ID"
BENEFICIARY_EMAIL="beneficiary.$RUN_ID@govrecover.local"

echo "Beneficiary ID: $BENEFICIARY_ID"
echo "Household ID:   $HOUSEHOLD_ID"
echo "Program ID:     $PROGRAM_ID"

SYNC_PAYLOAD=$(cat <<EOF
{
  "beneficiaryId": "$BENEFICIARY_ID",
  "householdId": "$HOUSEHOLD_ID",
  "name": "$BENEFICIARY_NAME",
  "email": "$BENEFICIARY_EMAIL",
  "phone": "0771112222",
  "district": "Gampaha",
  "dsDivision": "Negombo",
  "gnDivision": "Pitipana",
  "familySize": 5,
  "damageLevel": "SEVERE",
  "disasterEvent": "Western Province Flood 2026",
  "requestedAid": ["FOOD_PACK", "CASH_GRANT", "TEMPORARY_SHELTER"]
}
EOF
)

post_json "OpenG2P Sync Beneficiary" "$OPENG2P_PUBLIC_URL/api/beneficiaries/sync" "$SYNC_PAYLOAD"

ELIGIBILITY_PAYLOAD=$(cat <<EOF
{
  "beneficiaryId": "$BENEFICIARY_ID",
  "householdId": "$HOUSEHOLD_ID",
  "programId": "$PROGRAM_ID",
  "district": "Gampaha",
  "damageLevel": "SEVERE",
  "familySize": 5,
  "insideDisasterZone": true,
  "duplicateApplication": false
}
EOF
)

post_json "OpenG2P Eligibility Check" "$OPENG2P_PUBLIC_URL/api/eligibility/check" "$ELIGIBILITY_PAYLOAD"

get_json_optional "OpenG2P Entitlements" "$OPENG2P_PUBLIC_URL/api/entitlements"

ENROLLMENT_PAYLOAD=$(cat <<EOF
{
  "beneficiaryId": "$BENEFICIARY_ID",
  "householdId": "$HOUSEHOLD_ID",
  "programId": "$PROGRAM_ID",
  "programName": "Flood Relief & Recovery Program 2026",
  "entitlements": [
    {
      "type": "CASH",
      "amount": 25000,
      "currency": "LKR"
    },
    {
      "type": "IN_KIND",
      "items": ["Food Pack", "Water Bottles", "Medical Kit", "Tent"]
    }
  ],
  "status": "ENROLLED"
}
EOF
)

post_json "OpenG2P Program Enrollment" "$OPENG2P_PUBLIC_URL/api/program-enrollments" "$ENROLLMENT_PAYLOAD"

# ----------------------------------------------------
# 6. WSO2 demo gateway flow
# ----------------------------------------------------

section "5️⃣ Running WSO2 demo gateway checks"

http_check "WSO2 Gateway Health Again" "$WSO2_GATEWAY_PUBLIC_URL/health" "200"
http_check "Backend API Through WSO2 Gateway" "$WSO2_GATEWAY_PUBLIC_URL/api/health" "200"

echo ""
echo "Testing WSO2 gateway integration status if available..."
get_json_optional "WSO2 Integration Status" "$BACKEND_URL/api/integrations/wso2/status"

# ----------------------------------------------------
# 7. Backend OpenG2P connector checks if available
# ----------------------------------------------------

section "6️⃣ Checking backend OpenG2P connector endpoints"

get_json_optional "Backend OpenG2P Status" "$BACKEND_URL/api/integrations/openg2p/status"

echo ""
echo "Attempting backend-mediated OpenG2P sync if endpoint exists..."

BACKEND_SYNC_PAYLOAD=$(cat <<EOF
{
  "beneficiaryId": "$BENEFICIARY_ID",
  "householdId": "$HOUSEHOLD_ID",
  "name": "$BENEFICIARY_NAME",
  "district": "Gampaha",
  "damageLevel": "SEVERE",
  "programId": "$PROGRAM_ID"
}
EOF
)

BACKEND_SYNC_OUT="$TMP_DIR/backend_openg2p_sync.json"
BACKEND_SYNC_CODE=$(curl -sk -X POST "$BACKEND_URL/api/integrations/openg2p/sync-beneficiary" \
  -H "Content-Type: application/json" \
  -o "$BACKEND_SYNC_OUT" \
  -w "%{http_code}" \
  -d "$BACKEND_SYNC_PAYLOAD" || true)

if [[ "$BACKEND_SYNC_CODE" =~ ^(200|201)$ ]]; then
  success "Backend OpenG2P sync endpoint works"
  cat "$BACKEND_SYNC_OUT" | pretty_json
else
  warn "Backend OpenG2P sync endpoint not available or protected. HTTP $BACKEND_SYNC_CODE"
  cat "$BACKEND_SYNC_OUT" || true
fi

# ----------------------------------------------------
# 8. Choreo notification flow
# ----------------------------------------------------

section "7️⃣ Running Choreo notification demo"

NOTIFICATION_PAYLOAD=$(cat <<EOF
{
  "beneficiaryId": "$BENEFICIARY_ID",
  "householdId": "$HOUSEHOLD_ID",
  "recipientName": "$BENEFICIARY_NAME",
  "recipientPhone": "0771112222",
  "applicationStatus": "APPROVED_FOR_RELIEF",
  "message": "Your flood relief application has been approved. Your support package is being prepared."
}
EOF
)

post_json "Choreo Application Approved Notification" "$CHOREO_NOTIFIER_PUBLIC_URL/notify/application-approved" "$NOTIFICATION_PAYLOAD"

PAYMENT_PAYLOAD=$(cat <<EOF
{
  "beneficiaryId": "$BENEFICIARY_ID",
  "recipientName": "$BENEFICIARY_NAME",
  "amount": 25000,
  "currency": "LKR",
  "status": "PAYMENT_APPROVED"
}
EOF
)

post_json "Choreo Payment Approved Notification" "$CHOREO_NOTIFIER_PUBLIC_URL/notify/payment-approved" "$PAYMENT_PAYLOAD"

DISPATCH_PAYLOAD=$(cat <<EOF
{
  "beneficiaryId": "$BENEFICIARY_ID",
  "householdId": "$HOUSEHOLD_ID",
  "recipientName": "$BENEFICIARY_NAME",
  "items": ["Food Pack", "Water Bottles", "Medical Kit", "Tent"],
  "dispatchStatus": "DISPATCHED"
}
EOF
)

post_json "Choreo Dispatch Completed Notification" "$CHOREO_NOTIFIER_PUBLIC_URL/notify/dispatch-completed" "$DISPATCH_PAYLOAD"

# ----------------------------------------------------
# 9. Optional Odoo JSON-RPC check
# ----------------------------------------------------

section "8️⃣ Optional Odoo JSON-RPC check"

if [ -n "${ODOO_DB:-}" ] && [ -n "${ODOO_USERNAME:-${ODOO_LOGIN:-}}" ] && [ -n "${ODOO_PASSWORD:-}" ]; then
  ODOO_LOGIN_VALUE="${ODOO_USERNAME:-${ODOO_LOGIN:-admin}}"

  echo "Odoo env found. Testing Odoo session authentication..."
  echo "Odoo DB: $ODOO_DB"
  echo "Odoo User: $ODOO_LOGIN_VALUE"

  ODOO_LOGIN_RESPONSE="$TMP_DIR/odoo_login_response.json"

  curl -sk -X POST "$ODOO_PUBLIC_URL/web/session/authenticate" \
    -H "Content-Type: application/json" \
    -o "$ODOO_LOGIN_RESPONSE" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"params\": {
        \"db\": \"$ODOO_DB\",
        \"login\": \"$ODOO_LOGIN_VALUE\",
        \"password\": \"$ODOO_PASSWORD\"
      }
    }" || true

  if grep -q "\"uid\"" "$ODOO_LOGIN_RESPONSE"; then
    success "Odoo JSON-RPC login successful"
  else
    warn "Odoo JSON-RPC login did not confirm uid. Manual UI verification may be required."
    cat "$ODOO_LOGIN_RESPONSE" || true
  fi
else
  warn "Odoo DB/login/password env values not found. Skipping Odoo JSON-RPC login."
  echo "Manual check:"
  echo "  Open $ODOO_PUBLIC_URL"
  echo "  Apps → GovAid Disaster Recovery → Install/Upgrade"
fi

# ----------------------------------------------------
# 10. Final summary
# ----------------------------------------------------

section "✅ GovRecover360 Demo Completed"

echo "Demo Run ID:             $RUN_ID"
echo "Beneficiary ID:          $BENEFICIARY_ID"
echo "Beneficiary Name:        $BENEFICIARY_NAME"
echo "Household ID:            $HOUSEHOLD_ID"
echo "Program ID:              $PROGRAM_ID"
echo ""
echo "Verified URLs:"
echo "Frontend:                $FRONTEND_URL"
echo "Backend Health:          $BACKEND_URL/api/health"
echo "Backend via Nginx:       $NGINX_URL/api/health"
echo "OpenG2P Health:          $OPENG2P_PUBLIC_URL/api/health"
echo "WSO2 Gateway Health:     $WSO2_GATEWAY_PUBLIC_URL/health"
echo "WSO2 Backend Proxy:      $WSO2_GATEWAY_PUBLIC_URL/api/health"
echo "Choreo Notifier:         $CHOREO_NOTIFIER_PUBLIC_URL/health"
echo "AI Service:              $AI_SERVICE_PUBLIC_URL/health"
echo "Odoo:                    $ODOO_PUBLIC_URL"
echo "Superset:                $SUPERSET_PUBLIC_URL"
echo ""
echo "Output files saved in:"
echo "$TMP_DIR"
echo ""
echo "Manual verification:"
echo "1. Open frontend:"
echo "   $FRONTEND_URL"
echo ""
echo "2. Login using Demo Mode:"
echo "   Admin / Field Officer / Verifier / Finance / Warehouse / Auditor"
echo ""
echo "3. Open Admin → Integrations:"
echo "   Confirm OpenG2P, WSO2, Choreo, Odoo, AI service statuses."
echo ""
echo "4. Open Odoo:"
echo "   $ODOO_PUBLIC_URL"
echo "   Apps → GovAid Disaster Recovery → verify module/menu."
echo ""
echo "5. Open Superset:"
echo "   $SUPERSET_PUBLIC_URL"
echo "   Verify disaster recovery dashboard if configured."
echo ""
echo "Important production note:"
echo "The local WSO2 service is a demo-compatible gateway."
echo "For production, point WSO2_GATEWAY_URL and JWKS values to a real WSO2 API Manager deployment."
echo "===================================================="